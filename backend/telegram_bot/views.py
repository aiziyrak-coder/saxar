from rest_framework import permissions, serializers, status, views
from rest_framework.response import Response

from accounts.models import User
from accounts.permissions import IsAdminRole

from .linking import make_start_link_arg
from .models import TelegramSettings
from . import services


class TelegramSettingsSerializer(serializers.ModelSerializer):
    bot_token_configured = serializers.SerializerMethodField()
    webhook_secret_configured = serializers.SerializerMethodField()

    class Meta:
        model = TelegramSettings
        fields = [
            "admin_group_id",
            "notify_new_orders",
            "notify_payments",
            "notify_expenses",
            "notify_order_status",
            "bot_username",
            "bot_token_configured",
            "webhook_secret_configured",
            "updated_at",
        ]
        read_only_fields = ["bot_username", "updated_at", "bot_token_configured", "webhook_secret_configured"]

    def get_bot_token_configured(self, obj: TelegramSettings) -> bool:
        return bool(services.get_bot_token())

    def get_webhook_secret_configured(self, obj: TelegramSettings) -> bool:
        return bool(services.get_webhook_secret())


class TelegramSettingsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        solo = TelegramSettings.get_solo()
        me = services.get_me()
        if me.get("ok") and me.get("result", {}).get("username"):
            un = me["result"]["username"]
            if solo.bot_username != un:
                solo.bot_username = un
                solo.save(update_fields=["bot_username"])
        return Response(TelegramSettingsSerializer(solo).data)

    def put(self, request):
        solo = TelegramSettings.get_solo()
        ser = TelegramSettingsSerializer(solo, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(TelegramSettingsSerializer(TelegramSettings.get_solo()).data)


class TelegramInviteLinkView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        solo = TelegramSettings.get_solo()
        bot = (solo.bot_username or "").strip().lstrip("@")
        if not bot:
            me = services.get_me()
            if me.get("ok"):
                bot = (me.get("result") or {}).get("username") or ""
        if not bot:
            return Response(
                {"detail": "Bot username aniqlanmadi. TELEGRAM_BOT_TOKEN va getMe ni tekshiring."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        arg = make_start_link_arg(request.user.id)
        url = f"https://t.me/{bot}?start={arg}"
        return Response({"invite_url": url, "start_param": arg})


class TelegramUserBindSerializer(serializers.Serializer):
    telegram_username = serializers.CharField(max_length=64, allow_blank=True, required=True)


class TelegramUserBindView(views.APIView):
    """Admin: mijoz/hodim akkauntiga Telegram @username yozadi (sizsiz)."""

    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def patch(self, request, user_id: int):
        ser = TelegramUserBindSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        raw = ser.validated_data["telegram_username"].strip().lstrip("@")
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({"detail": "Foydalanuvchi topilmadi"}, status=status.HTTP_404_NOT_FOUND)
        if raw:
            dup = User.objects.exclude(pk=user.pk).filter(telegram_username__iexact=raw).exists()
            if dup:
                return Response(
                    {"detail": "Bu Telegram username boshqa foydalanuvchida allaqachon ishlatilmoqda."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        user.telegram_username = raw
        if raw == "":
            user.telegram_chat_id = None
        user.save(update_fields=["telegram_username", "telegram_chat_id"])
        return Response(
            {
                "id": user.id,
                "telegram_username": user.telegram_username,
                "telegram_chat_id": user.telegram_chat_id,
            }
        )
