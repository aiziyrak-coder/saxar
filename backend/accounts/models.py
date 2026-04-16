from django.contrib.auth.models import AbstractUser
from django.db import models


class UserRoles(models.TextChoices):
    ADMIN = "admin", "Super Admin / Direktor"
    ACCOUNTANT = "accountant", "Buxgalter"
    WAREHOUSE = "warehouse", "Ombor mudiri"
    AGENT = "agent", "Agent (Distributor)"
    DRIVER = "driver", "Logistika (Dastavkachi)"
    B2B = "b2b", "Mijoz (Magazin)"
    PRODUCTION = "production", "Ishlab chiqarish"


class User(AbstractUser):
    role = models.CharField(max_length=20, choices=UserRoles.choices, default=UserRoles.B2B)
    phone = models.CharField(max_length=20, blank=True)
    stir = models.CharField("STIR/INN", max_length=15, blank=True)
    company_name = models.CharField(max_length=255, blank=True)
    region = models.CharField(max_length=100, blank=True)
    address = models.CharField(max_length=255, blank=True)

    def __str__(self) -> str:  # pragma: no cover - simple
        return f"{self.username} ({self.get_role_display()})"

