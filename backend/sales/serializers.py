from decimal import Decimal

from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "quantity", "price", "total"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    client_name = serializers.CharField(source="client.company_name", read_only=True)

    def validate_items(self, value: list) -> list:
        if not value:
            raise serializers.ValidationError("Buyurtmada kamida bitta mahsulot qatori bo'lishi kerak.")
        return value

    def validate(self, attrs: dict) -> dict:
        if self.instance is not None:
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
        items_data = validated_data.pop("items", [])
        order = Order.objects.create(**validated_data)
        for item in items_data:
            OrderItem.objects.create(order=order, **item)
        return order

