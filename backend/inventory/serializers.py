from rest_framework import serializers

from accounts.permissions import IsStaffRole
from .media_utils import normalize_media_path
from .models import Category, Brand, Product, InventoryBatch, InventoryTransaction


def _is_staff_request(request) -> bool:
    user = getattr(request, "user", None) if request else None
    return bool(
        user and user.is_authenticated and getattr(user, "role", None) in IsStaffRole.STAFF
    )


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"
        extra_kwargs = {
            "image": {"allow_blank": True, "required": False},
            "description": {"allow_blank": True, "required": False},
        }

    def validate_image(self, value: str) -> str:
        return normalize_media_path(value)


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = "__all__"
        extra_kwargs = {
            "logo": {"allow_blank": True, "required": False},
            "description": {"allow_blank": True, "required": False},
        }

    def validate_logo(self, value: str) -> str:
        return normalize_media_path(value)


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    brand_name = serializers.CharField(source="brand.name", read_only=True)

    class Meta:
        model = Product
        fields = "__all__"
        extra_kwargs = {
            "image": {"allow_blank": True, "required": False},
            "description": {"allow_blank": True, "required": False},
            "barcode": {"allow_blank": True, "required": False},
        }

    def validate_image(self, value: str) -> str:
        return normalize_media_path(value)


class InventoryBatchSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = InventoryBatch
        fields = "__all__"


class InventoryTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = "__all__"


class ProductListSerializer(serializers.ModelSerializer):
    """Simplified product serializer for list views"""
    category_name = serializers.CharField(source="category.name", read_only=True)
    brand_name = serializers.CharField(source="brand.name", read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'description', 'image', 'category', 'category_name',
            'brand', 'brand_name', 'base_price', 'b2b_price', 'cost_price', 'unit',
            'min_stock', 'max_stock', 'is_active', 'is_b2b_active', 'created_at', 'updated_at',
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not _is_staff_request(self.context.get("request")):
            data.pop("cost_price", None)
        return data

