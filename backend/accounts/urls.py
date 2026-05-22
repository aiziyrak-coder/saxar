from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .platform_views import PlatformSettingsView, PlatformSettingsPublicView, SmsTestView
from .landing_views import LandingPublicView, LandingAdminView
from .views import (
    RegisterB2BView,
    MeView,
    UsersByRoleView,
    AdminUserListCreateView,
    AdminUserDetailView,
)


urlpatterns = [
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/register-b2b/", RegisterB2BView.as_view(), name="register_b2b"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("users/role/<str:role>/", UsersByRoleView.as_view(), name="users_by_role"),
    path("users/", AdminUserListCreateView.as_view(), name="admin_users"),
    path("users/<int:pk>/", AdminUserDetailView.as_view(), name="admin_user_detail"),
    path("platform/settings/", PlatformSettingsView.as_view(), name="platform_settings"),
    path("platform/settings/public/", PlatformSettingsPublicView.as_view(), name="platform_settings_public"),
    path("platform/sms/test/", SmsTestView.as_view(), name="platform_sms_test"),
    path("platform/landing/public/", LandingPublicView.as_view(), name="landing_public"),
    path("platform/landing/", LandingAdminView.as_view(), name="landing_admin"),
]

