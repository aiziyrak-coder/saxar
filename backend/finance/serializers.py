from rest_framework import serializers
from .models import Payment, Expense


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "client",
            "order",
            "amount",
            "type",
            "description",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        role = getattr(user, "role", None) if user else None
        order = attrs.get("order")
        if role == "driver" and order is not None:
            if order.driver_id != user.id:
                raise serializers.ValidationError(
                    {"order": "Faqat o‘zingizga biriktirilgan buyurtma uchun to‘lov."}
                )
        if role == "agent" and order is not None:
            if order.agent_id != user.id:
                raise serializers.ValidationError(
                    {"order": "Faqat o‘z agent buyurtmangiz uchun to‘lov."}
                )
        return attrs


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = "__all__"
