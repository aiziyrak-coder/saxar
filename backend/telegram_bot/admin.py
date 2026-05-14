from django.contrib import admin

from .models import TelegramSettings


@admin.register(TelegramSettings)
class TelegramSettingsAdmin(admin.ModelAdmin):
    list_display = ("id", "admin_group_id", "notify_new_orders", "bot_username", "updated_at")
