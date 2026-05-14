from django.urls import path

from .webhook_views import TelegramWebhookView
from .views import TelegramInviteLinkView, TelegramSettingsView, TelegramUserBindView

urlpatterns = [
    path("webhook/", TelegramWebhookView.as_view(), name="telegram_webhook"),
    path("settings/", TelegramSettingsView.as_view(), name="telegram_settings"),
    path("invite-link/", TelegramInviteLinkView.as_view(), name="telegram_invite_link"),
    path("user/<int:user_id>/telegram/", TelegramUserBindView.as_view(), name="telegram_user_bind"),
]
