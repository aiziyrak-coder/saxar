import json
import urllib.error
import urllib.request

from django.conf import settings
from rest_framework import permissions, serializers, views
from rest_framework.response import Response

from .models import PlatformSettings
from .permissions import IsAdminRole


class PlatformSettingsSerializer(serializers.ModelSerializer):
    sms_eskiz_password_configured = serializers.SerializerMethodField()
    onec_api_key_configured = serializers.SerializerMethodField()

    class Meta:
        model = PlatformSettings
        fields = [
            "sms_enabled",
            "sms_provider",
            "sms_sender_name",
            "sms_eskiz_email",
            "sms_eskiz_password_configured",
            "notify_order_status",
            "notify_low_stock",
            "notify_payment_received",
            "payme_enabled",
            "payme_merchant_id",
            "click_enabled",
            "click_merchant_id",
            "uzum_enabled",
            "uzum_merchant_id",
            "onec_enabled",
            "onec_base_url",
            "onec_api_key_configured",
            "didox_enabled",
            "didox_api_url",
            "eaktiv_enabled",
            "eaktiv_api_url",
            "maps_provider",
            "soliq_api_enabled",
            "session_idle_minutes",
            "audit_log_retention_days",
            "enforce_strong_password",
            "allow_demo_login",
            "default_b2b_markup_percent",
            "credit_limit_new_client",
            "credit_limit_trusted_client",
            "updated_at",
        ]
        read_only_fields = ["updated_at", "sms_eskiz_password_configured", "onec_api_key_configured"]

    def get_sms_eskiz_password_configured(self, obj: PlatformSettings) -> bool:
        return bool(obj.sms_eskiz_password)

    def get_onec_api_key_configured(self, obj: PlatformSettings) -> bool:
        return bool(obj.onec_api_key)


class PlatformSettingsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        return Response(PlatformSettingsSerializer(PlatformSettings.get_solo()).data)

    def put(self, request):
        solo = PlatformSettings.get_solo()
        data = dict(request.data)
        pwd = data.pop("sms_eskiz_password", None)
        key = data.pop("onec_api_key", None)
        ser = PlatformSettingsSerializer(solo, data=data, partial=True)
        ser.is_valid(raise_exception=True)
        for attr, val in ser.validated_data.items():
            setattr(solo, attr, val)
        if pwd is not None and pwd != "":
            solo.sms_eskiz_password = pwd
        if key is not None and key != "":
            solo.onec_api_key = key
        solo.save()
        return Response(PlatformSettingsSerializer(PlatformSettings.get_solo()).data)


class SmsTestSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    text = serializers.CharField(max_length=500, required=False, allow_blank=True)


def _eskiz_send(email: str, password: str, phone: str, text: str, from_name: str) -> tuple[bool, str]:
    try:
        token_req = urllib.request.Request(
            "https://notify.eskiz.uz/api/auth/login",
            data=json.dumps({"email": email, "password": password}).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(token_req, timeout=15) as resp:
            token_data = json.loads(resp.read().decode())
        token = (token_data.get("data") or {}).get("token") or token_data.get("token")
        if not token:
            return False, "Eskiz token olinmadi"
        sms_body = json.dumps({"mobile_phone": phone, "message": text, "from": from_name}).encode()
        sms_req = urllib.request.Request(
            "https://notify.eskiz.uz/api/message/sms/send",
            data=sms_body,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
            method="POST",
        )
        with urllib.request.urlopen(sms_req, timeout=15) as resp:
            if 200 <= resp.status < 300:
                return True, "Yuborildi"
        return False, "Eskiz javob xato"
    except urllib.error.HTTPError as e:
        return False, f"Eskiz HTTP {e.code}"
    except Exception as e:
        return False, str(e)


class PlatformSettingsPublicView(views.APIView):
    """Sessiya vaqtini barcha autentifikatsiya qilingan foydalanuvchilar olishi mumkin."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        solo = PlatformSettings.get_solo()
        return Response(
            {
                "session_idle_minutes": solo.session_idle_minutes,
                "default_b2b_markup_percent": solo.default_b2b_markup_percent,
            }
        )


class SmsTestView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def post(self, request):
        ser = SmsTestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        phone = "".join(c for c in ser.validated_data["phone"] if c.isdigit())
        if phone.startswith("8"):
            phone = "998" + phone[1:]
        if not phone.startswith("998"):
            phone = "998" + phone[-9:]
        text = ser.validated_data.get("text") or "Saxar ERP test xabari"
        solo = PlatformSettings.get_solo()
        if not solo.sms_enabled:
            return Response({"ok": False, "detail": "SMS o‘chirilgan. Sozlamalarda yoqing."}, status=400)
        if solo.sms_provider == "eskiz" and solo.sms_eskiz_email and solo.sms_eskiz_password:
            ok, detail = _eskiz_send(
                solo.sms_eskiz_email,
                solo.sms_eskiz_password,
                phone,
                text,
                solo.sms_sender_name or "4546",
            )
            return Response({"ok": ok, "detail": detail, "provider": "eskiz"})
        if settings.DEBUG:
            return Response({"ok": True, "detail": "DEBUG: SMS simulyatsiya", "provider": solo.sms_provider})
        return Response(
            {"ok": False, "detail": "SMS provayder sozlanmagan (Eskiz email/parol)."},
            status=400,
        )
