from decimal import Decimal

from rest_framework import serializers

from inventory.models import Product
from .models import Order, OrderItem


def _quantize_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"))


def enforce_catalog_line_pricing(items_data: list[dict], *, use_b2b_price: bool) -> tuple[list[dict], Decimal]:
    """Mijoz yuborgan narxlarni e'tiborsiz qoldirib katalog narxini qo'llaydi."""
    normalized: list[dict] = []
    total = Decimal("0")
    for raw in items_data:
        product_ref = raw.get("product")
        if product_ref is None:
            raise serializers.ValidationError({"items": "Mahsulot ID talab qilinadi."})
        try:
            qty = Decimal(str(raw.get("quantity", 0)))
        except (TypeError, ValueError, ArithmeticError) as exc:
            raise serializers.ValidationError({"items": "Noto'g'ri miqdor."}) from exc
        if qty <= 0:
            raise serializers.ValidationError({"items": "Miqdor 0 dan katta bo'lishi kerak."})

        if isinstance(product_ref, Product):
            product = product_ref
        else:
            try:
                product = Product.objects.get(pk=product_ref)
            except Product.DoesNotExist as exc:
                raise serializers.ValidationError(
                    {"items": f"Mahsulot topilmadi: {product_ref}"}
                ) from exc

        if not product.is_active:
            raise serializers.ValidationError({"items": f"{product.name} faol emas."})
        if use_b2b_price and not product.is_b2b_active:
            raise serializers.ValidationError({"items": f"{product.name} B2B katalogda yo'q."})

        if use_b2b_price:
            unit_price = product.b2b_price if product.b2b_price else product.base_price
        else:
            unit_price = product.base_price
        line_total = _quantize_money(unit_price * qty)
        normalized.append(
            {
                "product": product,
                "quantity": qty,
                "price": unit_price,
                "total": line_total,
            }
        )
        total += line_total
    return normalized, _quantize_money(total)


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "quantity", "price", "total"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    client_name = serializers.CharField(source="client.company_name", read_only=True)
    status = serializers.CharField(required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        role = getattr(user, "role", None) if user else None
        if role == "b2b":
            for field_name in ("status", "paid_amount", "client", "agent", "driver", "source"):
                if field_name in self.fields:
                    self.fields[field_name].read_only = True
        elif role == "agent":
            for field_name in ("status", "paid_amount", "agent", "driver"):
                if field_name in self.fields:
                    self.fields[field_name].read_only = True
        if self.instance is not None:
            self.fields["items"].required = False

    def validate_items(self, value: list) -> list:
        if not value:
            raise serializers.ValidationError("Buyurtmada kamida bitta mahsulot qatori bo'lishi kerak.")
        return value

    def validate(self, attrs: dict) -> dict:
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        role = getattr(user, "role", None) if user else None
        if self.instance is not None:
            if role == "driver":
                extra = set(attrs.keys()) - {"status"}
                if extra:
                    raise serializers.ValidationError(
                        "Haydovchi faqat buyurtma holatini yangilashi mumkin."
                    )
                status_val = attrs.get("status", self.instance.status)
                if status_val not in ("in_transit", "delivered", "returned"):
                    raise serializers.ValidationError(
                        "Haydovchi holati: in_transit, delivered yoki returned."
                    )
            elif role == "warehouse":
                extra = set(attrs.keys()) - {"status"}
                if extra:
                    raise serializers.ValidationError(
                        "Ombor faqat buyurtma holatini yangilashi mumkin."
                    )
                status_val = attrs.get("status", self.instance.status)
                if status_val not in ("picking", "packed", "in_transit"):
                    raise serializers.ValidationError(
                        "Ombor holati: picking, packed yoki in_transit."
                    )
            return attrs
        raw = getattr(self, "initial_data", None) or {}
        items = raw.get("items")
        if not items:
            raise serializers.ValidationError({"items": "Mahsulotlar ro'yxati bo'sh."})
        try:
            computed = sum(
                (Decimal(str(i.get("total", 0))) for i in items if i is not None),
                Decimal("0"),
            )
        except (TypeError, ValueError, ArithmeticError) as exc:
            raise serializers.ValidationError({"items": "Noto'g'ri summa maydonlari."}) from exc

        total = attrs.get("total_amount")
        if total is not None and computed != Decimal(str(total)):
            raise serializers.ValidationError(
                {"total_amount": "Jami summa qatorlar yig'indisiga mos kelmaydi."}
            )
        return attrs

    class Meta:
        model = Order
        fields = [
            "id",
            "source",
            "client",
            "client_name",
            "agent",
            "driver",
            "status",
            "total_amount",
            "paid_amount",
            "order_date",
            "items",
        ]

    def create(self, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        role = getattr(user, "role", None) if user else None
        is_b2b = role == "b2b"
        if is_b2b:
            validated_data["status"] = "pending"
            validated_data["client"] = user
        elif role == "agent":
            validated_data["agent"] = user
        items_data = validated_data.pop("items", [])
        items_data, computed_total = enforce_catalog_line_pricing(
            items_data, use_b2b_price=is_b2b
        )
        validated_data["total_amount"] = computed_total
        order = Order.objects.create(**validated_data)
        for item in items_data:
            OrderItem.objects.create(order=order, **item)
        return order

