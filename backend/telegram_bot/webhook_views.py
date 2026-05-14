import json
import logging

from django.conf import settings as dj_settings
from django.http import HttpResponse, JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from . import dispatcher
from . import services

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class TelegramWebhookView(View):
    """POST /api/telegram/webhook/ — Telegram `secret_token` bilan himoyalangan."""

    def post(self, request, *args, **kwargs):
        if not services.get_bot_token():
            return HttpResponse(status=503)
        secret = services.get_webhook_secret()
        if secret:
            got = request.headers.get("X-Telegram-Bot-Api-Secret-Token") or ""
            if got != secret:
                logger.warning("telegram webhook: noto'g'ri secret token")
                return HttpResponse(status=403)
        elif not dj_settings.DEBUG:
            logger.warning("telegram webhook: TELEGRAM_WEBHOOK_SECRET majburiy (DEBUG=0)")
            return HttpResponse(status=503)

        try:
            body = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return HttpResponse(status=400)

        try:
            if "message" in body:
                dispatcher.dispatch_message(body)
            elif "callback_query" in body:
                dispatcher.dispatch_callback_query(body)
        except Exception:
            logger.exception("telegram webhook handler xatosi")
        return JsonResponse({"ok": True})
