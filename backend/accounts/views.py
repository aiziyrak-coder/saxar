from rest_framework import generics, permissions
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer, RegisterB2BSerializer


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

    def get_queryset(self):
        role = self.kwargs.get("role")
        return User.objects.filter(role=role)

