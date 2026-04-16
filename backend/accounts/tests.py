"""
Accounts moduli: model va JWT kirish testlari.
"""
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

User = get_user_model()


class UserModelTests(TestCase):
    """User modeli"""

    def test_create_user(self):
        user = User.objects.create_user(
            username="test@example.com",
            email="test@example.com",
            password="testpass123",
            role="b2b",
        )
        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.username, "test@example.com")
        self.assertEqual(user.role, "b2b")
        self.assertTrue(user.check_password("testpass123"))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            username="admin@example.com",
            email="admin@example.com",
            password="adminpass123",
        )
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_user_str(self):
        user = User.objects.create_user(
            username="test@example.com",
            email="test@example.com",
            password="testpass123",
            role="b2b",
        )
        self.assertIn("test@example.com", str(user))


class AuthenticationAPITests(APITestCase):
    """JWT va himoyalangan marshrutlar"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="test@example.com",
            email="test@example.com",
            password="testpass123",
            role="b2b",
        )

    def test_login_success(self):
        response = self.client.post(
            "/api/accounts/auth/login/",
            {"username": "test@example.com", "password": "testpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_failure(self):
        response = self.client.post(
            "/api/accounts/auth/login/",
            {"username": "test@example.com", "password": "wrongpassword"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_endpoint_without_auth(self):
        response = self.client.get("/api/orders/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PermissionTests(APITestCase):
    """Rol bo'yicha API (joriy ViewSet qoidalari bilan mos)"""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username="admin@example.com",
            email="admin@example.com",
            password="adminpass123",
        )
        self.admin.role = "admin"
        self.admin.save(update_fields=["role"])
        self.b2b_user = User.objects.create_user(
            username="b2b@example.com",
            email="b2b@example.com",
            password="b2bpass123",
            role="b2b",
        )

    def test_admin_can_access_users_by_role(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/accounts/users/role/b2b/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_b2b_access_users_by_role_policy(self):
        self.client.force_authenticate(user=self.b2b_user)
        response = self.client.get("/api/accounts/users/role/admin/")
        self.assertIn(
            response.status_code,
            [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN],
        )


class HealthCheckTests(TestCase):
    def test_health_ok(self):
        client = APIClient()
        response = client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body.get("status"), "ok")
        self.assertEqual(body.get("database"), "ok")
