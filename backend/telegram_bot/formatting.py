"""Telegram HTML parse_mode uchun matnni xavfsiz qilish."""

from django.utils.html import escape as django_escape


def tg_html(s: object | None) -> str:
    """Foydalanuvchi kiritgan matn — Telegram HTML uchun."""
    if s is None:
        return ""
    return django_escape(str(s), quote=False)
