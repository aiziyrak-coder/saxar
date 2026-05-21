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
    # Telegram: admin kiritadi @username; mijoz/hodim /start yoki havola bilan bog‘laydi
    telegram_chat_id = models.BigIntegerField(null=True, blank=True, db_index=True)
    telegram_username = models.CharField(
        max_length=64,
        blank=True,
        help_text="Telegram @username (sizsiz), admin paneldan",
    )

    def __str__(self) -> str:  # pragma: no cover - simple
        return f"{self.username} ({self.get_role_display()})"


class PlatformSettings(models.Model):
    """Singleton — SMS, integratsiyalar, xavfsizlik."""

    sms_enabled = models.BooleanField(default=False)
    sms_provider = models.CharField(max_length=32, default="eskiz")
    sms_sender_name = models.CharField(max_length=32, blank=True, default="4546")
    sms_eskiz_email = models.CharField(max_length=255, blank=True)
    sms_eskiz_password = models.CharField(max_length=255, blank=True)

    notify_order_status = models.BooleanField(default=True)
    notify_low_stock = models.BooleanField(default=True)
    notify_payment_received = models.BooleanField(default=True)

    payme_enabled = models.BooleanField(default=False)
    payme_merchant_id = models.CharField(max_length=64, blank=True)
    click_enabled = models.BooleanField(default=False)
    click_merchant_id = models.CharField(max_length=64, blank=True)
    uzum_enabled = models.BooleanField(default=False)
    uzum_merchant_id = models.CharField(max_length=64, blank=True)

    onec_enabled = models.BooleanField(default=False)
    onec_base_url = models.CharField(max_length=512, blank=True)
    onec_api_key = models.CharField(max_length=255, blank=True)
    didox_enabled = models.BooleanField(default=False)
    didox_api_url = models.CharField(max_length=512, blank=True)
    eaktiv_enabled = models.BooleanField(default=False)
    eaktiv_api_url = models.CharField(max_length=512, blank=True)

    maps_provider = models.CharField(max_length=16, default="yandex")
    soliq_api_enabled = models.BooleanField(default=False)

    session_idle_minutes = models.PositiveIntegerField(default=30)
    audit_log_retention_days = models.PositiveIntegerField(default=90)
    enforce_strong_password = models.BooleanField(default=True)
    allow_demo_login = models.BooleanField(default=False)

    default_b2b_markup_percent = models.PositiveIntegerField(default=15)
    credit_limit_new_client = models.PositiveIntegerField(default=5_000_000)
    credit_limit_trusted_client = models.PositiveIntegerField(default=50_000_000)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Platform settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_solo(cls) -> "PlatformSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

