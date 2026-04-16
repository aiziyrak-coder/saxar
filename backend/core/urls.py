from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework.routers import DefaultRouter

from core.views import health_check
from sales.views import OrderViewSet
from inventory.views import CategoryViewSet, BrandViewSet, ProductViewSet, InventoryBatchViewSet
from finance.views import PaymentViewSet, ExpenseViewSet

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"brands", BrandViewSet, basename="brand")
router.register(r"orders", OrderViewSet, basename="order")
router.register(r"products", ProductViewSet, basename="product")
router.register(r"inventory-batches", InventoryBatchViewSet, basename="inventorybatch")
router.register(r"payments", PaymentViewSet, basename="payment")
router.register(r"expenses", ExpenseViewSet, basename="expense")

urlpatterns = [
    # api.saxar.uz/ kabi ildiz so'rovlari — marshrutlar /api/ ostida
    path("", RedirectView.as_view(url="/api/", permanent=False)),
    path("admin/", admin.site.urls),
    path("api/health/", health_check),
    path("api/accounts/", include("accounts.urls")),
    path("api/", include(router.urls)),
    path("api-auth/", include("rest_framework.urls")),  # DRF login/logout
]

