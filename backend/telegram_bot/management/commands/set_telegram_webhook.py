"""Masalan: python manage.py set_telegram_webhook https://api.saxar.uz/api/telegram/webhook/"""

from django.core.management.base import BaseCommand

from telegram_bot import services
from telegram_bot.models import TelegramSettings


class Command(BaseCommand):
    help = "Telegram setWebhook (TELEGRAM_BOT_TOKEN va ixtiyoriy TELEGRAM_WEBHOOK_SECRET kerak)"

    def add_arguments(self, parser):
        parser.add_argument("url", type=str, help="To'liq webhook URL (masalan https://api.../api/telegram/webhook/)")

    def handle(self, *args, **options):
        url = options["url"].strip()
        secret = services.get_webhook_secret()
        if not services.get_bot_token():
            self.stderr.write("TELEGRAM_BOT_TOKEN o'rnatilmagan.")
            return
        r = services.set_webhook(url, secret)
        if r.get("ok"):
            self.stdout.write(self.style.SUCCESS(f"Webhook o'rnatildi: {url}"))
            me = services.get_me()
            if me.get("ok"):
                un = me["result"].get("username")
                self.stdout.write(f"Bot: @{un}")
                solo = TelegramSettings.get_solo()
                if un and solo.bot_username != un:
                    solo.bot_username = un
                    solo.save(update_fields=["bot_username"])
        else:
            self.stderr.write(str(r))
