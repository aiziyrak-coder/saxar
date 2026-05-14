"""Webhook yangilanishlarini yo‘naltirish."""

from __future__ import annotations

import logging
from typing import Any

from . import callbacks_orders
from . import commands_private
from . import ratelimit
from . import services

logger = logging.getLogger(__name__)


def dispatch_message(update: dict[str, Any]) -> None:
    if ratelimit.is_duplicate_update(update.get("update_id")):
        return
    msg = update.get("message") or {}
    chat = msg.get("chat") or {}
    chat_id = chat.get("id")
    if chat_id is None:
        return
    if chat.get("type") == "private" and ratelimit.private_chat_rate_limited(int(chat_id)):
        logger.info("telegram rate limit chat_id=%s", chat_id)
        services.send_message(
            int(chat_id),
            "⏳ Juda ko‘p so‘rov yuborildi. Bir necha soniyadan keyin qayta urinib ko‘ring.",
            parse_mode=None,
        )
        return
    commands_private.handle_private_message(update)


def dispatch_callback_query(update: dict[str, Any]) -> None:
    if ratelimit.is_duplicate_update(update.get("update_id")):
        return
    cq = update.get("callback_query") or {}
    msg = cq.get("message") or {}
    chat = msg.get("chat") or {}
    chat_id = chat.get("id")
    if chat_id is not None and ratelimit.private_chat_rate_limited(int(chat_id)):
        cq_id = cq.get("id")
        if cq_id:
            services.answer_callback_query(str(cq_id), "Juda ko‘p so‘rov. Biroz kuting.", True)
        return

    if callbacks_orders.handle_order_callback(cq):
        return
    cq_id = cq.get("id")
    if cq_id:
        services.answer_callback_query(str(cq_id))
