from rest_framework import serializers
from .models import User, UserRoles


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "phone",
            "stir",
            "company_name",
            "region",
            "address",
            "telegram_username",
            "telegram_chat_id",
            "is_active",
            "first_name",
            "last_name",
        ]
        read_only_fields = ["telegram_chat_id"]


class RegisterB2BSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "password",
            "phone",
            "stir",
            "company_name",
            "region",
            "address",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        email = validated_data["email"]
        user = User.objects.create_user(
            username=email,
            email=email,
            role="b2b",
            is_active=False,
            **validated_data,
        )
        user.set_password(password)
        user.save()
        return user


class AdminUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=UserRoles.choices)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "role",
            "phone",
            "first_name",
            "last_name",
            "is_active",
            "telegram_username",
            "stir",
            "company_name",
            "region",
            "address",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = (validated_data.pop("password", "") or "").strip()
        if not password:
            raise serializers.ValidationError({"password": "Parol majburiy."})
        email = validated_data.get("email") or validated_data.get("username", "")
        if "@" not in str(email):
            email = f"{validated_data.get('phone', 'user')}@saxar.local".replace(" ", "")
        validated_data.setdefault("username", email)
        validated_data["email"] = email
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

