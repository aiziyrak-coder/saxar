from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import User
from .permissions import IsAdminRole
from .serializers import UserSerializer, RegisterB2BSerializer, AdminUserCreateSerializer


class RegisterB2BView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterB2BSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class UsersByRoleView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        role = self.kwargs.get("role")
        return User.objects.filter(role=role)


class AdminUserListCreateView(generics.ListCreateAPIView):
    """RBAC: barcha Django foydalanuvchilar (Telegram bog‘lash uchun ID)."""

    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AdminUserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        qs = User.objects.all().order_by("-id")
        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)
        return qs


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    serializer_class = UserSerializer
    queryset = User.objects.all()

    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        role = request.data.get("role")
        is_active = request.data.get("is_active")
        if role is not None:
            user.role = role
        if is_active is not None:
            user.is_active = bool(is_active)
        for field in (
            "phone",
            "telegram_username",
            "first_name",
            "last_name",
            "email",
            "stir",
            "company_name",
            "region",
            "address",
        ):
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
        return Response(UserSerializer(user).data)

