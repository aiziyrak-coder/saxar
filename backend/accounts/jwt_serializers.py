from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class ActiveUserTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Nofaol (tasdiqlanmagan) foydalanuvchilar JWT ololmaydi."""

    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_active:
            raise AuthenticationFailed(
                "Hisob faol emas. Admin tasdig‘ini kuting yoki operator bilan bog‘laning.",
                code="user_inactive",
            )
        return data
