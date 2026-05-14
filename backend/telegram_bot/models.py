from django.db import models


class TelegramSettings(models.Model):
    """Bitta qator (pk=1) — admin panel orqali tahrirlanadi."""

    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    admin_group_id = models.BigIntegerField(
        default=-1003852134921,
        help_text="Asosiy admin guruh (buyurtma/tolov bildirishnomalari)",
    )
    notify_new_orders = models.BooleanField(default=True)
    notify_payments = models.BooleanField(default=True)
    notify_expenses = models.BooleanField(default=True)
    notify_order_status = models.BooleanField(default=True)
    bot_username = models.CharField(
        max_length=64,
        blank=True,
        help_text="getMe dan to‘ldiriladi yoki qo‘lda (@sizsiz)",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Telegram sozlamalari"

    def __str__(self) -> str:
        return "TelegramSettings"

    @classmethod
    def get_solo(cls) -> "TelegramSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
