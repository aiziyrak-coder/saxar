from django.conf import settings
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import RedirectView
from django.views.static import serve
from rest_framework.routers import DefaultRouter

from core.views import health_check
from inventory.upload_views import ImageUploadView
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
    path("api/upload/image/", ImageUploadView.as_view(), name="upload_image"),
    path("api/accounts/", include("accounts.urls")),
    path("api/telegram/", include("telegram_bot.urls")),
    path("api/", include(router.urls)),
    path("api-auth/", include("rest_framework.urls")),  # DRF login/logout
]

urlpatterns += [
    re_path(
        r"^media/(?P<path>.*)$",
        serve,
        {"document_root": settings.MEDIA_ROOT},
    ),
]

