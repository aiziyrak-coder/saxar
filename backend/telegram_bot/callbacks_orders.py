"""Guruhda buyurtma inline tugmalari (tasdiq / bekor)."""

from __future__ import annotations

import logging
import re

from django.db import transaction

from sales.models import Order

from .client_notify import notify_order_cancelled_to_client, notify_order_confirmed_to_client
from .models import TelegramSettings
from . import services

logger = logging.getLogger(__name__)


def _admin_group_id() -> int:
    return int(TelegramSettings.get_solo().admin_group_id)


def handle_order_callback(cq: dict) -> bool:
    """True agar shu callback qayta ishlangan bo‘lsa."""
    cq_id = cq.get("id")
    from_user = cq.get("from") or {}
    tg_uid = int(from_user.get("id") or 0)
    data = (cq.get("data") or "").strip()
    msg = cq.get("message") or {}
    chat = msg.get("chat") or {}
    message_id = msg.get("message_id")

    def answer(text: str | None = None, alert: bool = False) -> None:
        if cq_id:
            services.answer_callback_query(cq_id, text, alert)

    if not data or message_id is None:
        answer()
        return False

    m = re.match(r"^ord:(ok|no):(\d+)$", data)
    if not m:
        return False

    chat_id = chat.get("id")
    if chat_id is None:
        answer()
        return True

    try:
        expected = int(_admin_group_id())
    except (TypeError, ValueError):
        expected = 0

    if int(chat_id) != int(expected):
        logger.warning("callback noto‘g‘ri chat %s", chat_id)
        answer("Bu guruh uchun emas", True)
        return True

    solo = TelegramSettings.get_solo()
    if getattr(solo, "require_group_admin_for_callbacks", True) and tg_uid:
        if not services.user_can_moderate_in_group(chat_id, tg_uid):
            answer("Faqat guruh adminlari tasdiqlashi mumkin. Bot guruhda admin huquqlariga ega bo‘lishi kerak.", True)
            return True

    action, oid_s = m.group(1), m.group(2)
    order_id = int(oid_s)
    base_text = (msg.get("text") or msg.get("caption") or "").strip()
    admin_name_plain = (from_user.get("first_name") or from_user.get("username") or "Admin").strip() or "Admin"

    with transaction.atomic():
        order = Order.objects.select_for_update().filter(id=order_id).select_related("client").first()
        if not order:
            answer("Buyurtma topilmadi", True)
            services.send_message(chat_id, f"❌ Buyurtma #{order_id} topilmadi.", parse_mode=None)
            return True

        if action == "ok":
            if order.status == "cancelled":
                answer("Buyurtma allaqachon bekor qilingan", True)
                return True
            if order.status != "pending":
                answer(f"Hozirgi holat: {order.get_status_display()}", True)
                return True
            order._skip_telegram_status_broadcast = True  # noqa: SLF001
            order.status = "picking"
            order.save(update_fields=["status"])
            del order._skip_telegram_status_broadcast
            new_text = (
                f"{base_text}\n\n"
                f"✅ Tasdiqlandi — {admin_name_plain}\n"
                f"Buyurtma yig‘ilish bosqichiga o‘tkazildi."
            )
            r = services.edit_message_text(
                chat_id,
                message_id,
                new_text[:3900],
                parse_mode=None,
                reply_markup={"inline_keyboard": []},
            )
            if not r.get("ok"):
                logger.warning("edit_message_text: %s", r)
                services.send_message(
                    int(chat_id),
                    new_text[:3900],
                    parse_mode=None,
                    reply_to_message_id=int(message_id),
                )
            order = Order.objects.select_related("client").get(pk=order.pk)
            notify_order_confirmed_to_client(order)
            answer("Buyurtma tasdiqlandi")
            return True

        if order.status == "cancelled":
            answer("Allaqachon bekor qilingan", True)
            return True
        if order.status != "pending":
            answer("Faqat kutilayotgan buyurtma bekor qilinadi.", True)
            return True
        order._skip_telegram_status_broadcast = True  # noqa: SLF001
        order.status = "cancelled"
        order.save(update_fields=["status"])
        del order._skip_telegram_status_broadcast
        new_text = f"{base_text}\n\n❌ Bekor qilindi — {admin_name_plain}"
        r = services.edit_message_text(
            chat_id,
            message_id,
            new_text[:3900],
            parse_mode=None,
            reply_markup={"inline_keyboard": []},
        )
        if not r.get("ok"):
            logger.warning("edit_message_text: %s", r)
            services.send_message(
                int(chat_id),
                new_text[:3900],
                parse_mode=None,
                reply_to_message_id=int(message_id),
            )
        order = Order.objects.select_related("client").get(pk=order.pk)
        notify_order_cancelled_to_client(order)
        answer("Bekor qilindi")
        return True
