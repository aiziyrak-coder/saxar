from rest_framework import viewsets, permissions

from accounts.permissions import IsStaffRole, IsPaymentWriteRole
from .models import Payment, Expense
from .serializers import PaymentSerializer, ExpenseSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsPaymentWriteRole()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Payment.objects.all().select_related("client", "order")
        role = getattr(user, "role", None)
        if role == "b2b":
            return qs.filter(client=user)
        if role in ("admin", "accountant"):
            return qs
        if role == "agent":
            return qs.filter(order__agent=user)
        if role == "driver":
            return qs.filter(order__driver=user)
        return qs.none()

    def perform_create(self, serializer):
        serializer.save()


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffRole]

    def get_queryset(self):
        user = self.request.user
        qs = Expense.objects.all()
        if getattr(user, "role", None) == "admin":
            return qs
        if getattr(user, "role", None) == "accountant":
            return qs
        return qs.none()
