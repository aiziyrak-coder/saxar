from rest_framework import serializers
from .models import User


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
        ]


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
            **validated_data,
        )
        user.set_password(password)
        user.save()
        return user

