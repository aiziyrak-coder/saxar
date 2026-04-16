from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Category, Brand, Product, InventoryBatch
from .serializers import (
    CategorySerializer, BrandSerializer, ProductSerializer,
    ProductListSerializer, InventoryBatchSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True).order_by("sort_order", "name")
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]  # Demo mode


class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.filter(is_active=True).order_by("name")
    serializer_class = BrandSerializer
    permission_classes = [permissions.AllowAny]  # Demo mode


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category", "brand").filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]  # Demo mode

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

    def get_queryset(self):
        queryset = self.queryset
        category = self.request.query_params.get('category', None)
        brand = self.request.query_params.get('brand', None)
        search = self.request.query_params.get('search', None)
        is_b2b = self.request.query_params.get('is_b2b', None)

        if category:
            queryset = queryset.filter(category_id=category)
        if brand:
            queryset = queryset.filter(brand_id=brand)
        if is_b2b == 'true':
            queryset = queryset.filter(is_b2b_active=True)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(sku__icontains=search)
            )

        return queryset.order_by("name")

    @action(detail=False, methods=['get'])
    def b2b_catalog(self, request):
        """Get products available for B2B customers"""
        products = self.get_queryset().filter(is_b2b_active=True)
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class InventoryBatchViewSet(viewsets.ModelViewSet):
    queryset = InventoryBatch.objects.select_related("product").all().order_by("expiry_date")
    serializer_class = InventoryBatchSerializer
    permission_classes = [permissions.AllowAny]  # Demo mode

