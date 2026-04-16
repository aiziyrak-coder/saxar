from rest_framework import viewsets, permissions
from .models import Order
from .serializers import OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.all().select_related("client", "agent", "driver")
        if user.role == "b2b":
            return qs.filter(client=user)
        if user.role == "agent":
            return qs.filter(agent=user)
        if user.role == "driver":
            return qs.filter(driver=user)
        return qs

    def perform_create(self, serializer):
        order = serializer.save()
        # total_amount already passed from frontend; could be recomputed here
        return order

