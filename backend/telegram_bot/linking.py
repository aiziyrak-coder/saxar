"""Telegram akkauntni ERP user bilan bog‘lash (/start havola va username)."""

from __future__ import annotations

import hashlib
import hmac
import logging
from urllib.parse import unquote

from django.conf import settings as dj_settings
from django.db import transaction

from accounts.models import User

logger = logging.getLogger(__name__)


def _sign_user_id(user_id: int) -> str:
    digest = hmac.new(
        dj_settings.SECRET_KEY.encode("utf-8"),
        str(user_id).encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return digest[:16]


def make_start_link_arg(user_id: int) -> str:
    return f"link_{user_id}_{_sign_user_id(user_id)}"


def parse_start_link_arg(arg: str) -> int | None:
    if not arg or not arg.startswith("link_"):
        return None
    body = arg[5:]
    idx = body.rfind("_")
    if idx <= 0:
        return None
    uid_s, sig = body[:idx], body[idx + 1 :]
    try:
        uid = int(uid_s)
    except ValueError:
        return None
    if not hmac.compare_digest(_sign_user_id(uid), sig):
        return None
    return uid


def normalize_username(u: str | None) -> str:
    if not u:
        return ""
    return u.strip().lstrip("@").lower()


def start_arg_from_text(text: str) -> str:
    parts = text.split(maxsplit=1)
    return unquote(parts[1].strip()) if len(parts) > 1 else ""


def cmd_token(text: str) -> str:
    """`/start@BotName` → `/start`"""
    part = text.split(maxsplit=1)[0].strip()
    return part.split("@", 1)[0].lower()


def link_by_start_arg(chat_id: int, tg_user_id: int, tg_username: str, arg: str) -> tuple[bool, str]:
    """
    Returns (success, outcome) outcome in {'linked','bad_link','no_user','bad_format','multi','none','no_username'}
    """
    if not arg:
        if not tg_username:
            return False, "no_username"
        user = (
            User.objects.filter(telegram_username__iexact=tg_username)
            .exclude(telegram_chat_id__isnull=True)
            .first()
        )
        if user and user.telegram_chat_id and int(user.telegram_chat_id) != int(tg_user_id):
            return False, "taken"
        qs = User.objects.filter(telegram_username__iexact=tg_username).filter(telegram_chat_id__isnull=True)
        if qs.count() == 1:
            u = qs.first()
            if u:
                User.objects.filter(telegram_chat_id=tg_user_id).exclude(pk=u.pk).update(telegram_chat_id=None)
                u.telegram_chat_id = tg_user_id
                u.save(update_fields=["telegram_chat_id"])
                logger.info("telegram linked user chat_id=%s", tg_user_id)
                return True, "linked"
        if qs.count() > 1:
            return False, "multi"
        return False, "none"

    uid = parse_start_link_arg(arg)
    if not uid:
        return False, "bad_format"
    with transaction.atomic():
        user = User.objects.filter(id=uid).select_for_update().first()
        if not user:
            return False, "no_user"
        User.objects.filter(telegram_chat_id=tg_user_id).exclude(pk=user.pk).update(telegram_chat_id=None)
        User.objects.filter(pk=user.pk).update(
            telegram_chat_id=tg_user_id,
            telegram_username=tg_username or user.telegram_username,
        )
    logger.info("telegram linked user chat_id=%s", tg_user_id)
    return True, "linked"
