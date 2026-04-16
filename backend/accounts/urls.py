from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterB2BView, MeView, UsersByRoleView


urlpatterns = [
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/register-b2b/", RegisterB2BView.as_view(), name="register_b2b"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("users/role/<str:role>/", UsersByRoleView.as_view(), name="users_by_role"),
]

