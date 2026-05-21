from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied

from accounts.permissions import IsOrderWriteRole
from .models import Order
from .serializers import OrderSerializer

ORDER_CREATE_ROLES = frozenset({"b2b", "admin", "accountant", "agent"})


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == "destroy":
            return [permissions.IsAuthenticated(), IsOrderWriteRole()]
        if self.action in ("update", "partial_update"):
            role = getattr(self.request.user, "role", None)
            if role in ("driver", "warehouse"):
                return [permissions.IsAuthenticated()]
            return [permissions.IsAuthenticated(), IsOrderWriteRole()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.all().select_related("client", "agent", "driver")
        role = getattr(user, "role", None)
        if role == "b2b":
            return qs.filter(client=user)
        if role == "agent":
            return qs.filter(agent=user)
        if role == "driver":
            return qs.filter(driver=user)
        if role in ("warehouse", "production"):
            return qs.filter(
                status__in=("confirmed", "picking", "packed", "in_transit")
            )
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        role = getattr(user, "role", None)
        if role not in ORDER_CREATE_ROLES:
            raise PermissionDenied("Bu rol buyurtma yarata olmaydi.")
        extra: dict = {}
        if role == "b2b":
            if not user.is_active:
                raise PermissionDenied("Hisobingiz admin tasdig‘ini kutmoqda.")
            extra["client"] = user
            extra["status"] = "pending"
        elif role == "agent":
            extra["agent"] = user
        serializer.save(**extra)
