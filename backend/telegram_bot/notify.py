"""Guruh va mijozlarga bildirishnomalar (signal / view dan chaqiriladi)."""

from __future__ import annotations

import logging
from decimal import Decimal

from finance.models import Expense, Payment
from sales.models import Order

from .formatting import tg_html
from .models import TelegramSettings
from . import services

logger = logging.getLogger(__name__)


def _group_id() -> int | None:
    if not services.get_bot_token():
        return None
    try:
        return int(TelegramSettings.get_solo().admin_group_id)
    except (TypeError, ValueError):
        return None


def _fmt_money(x: Decimal | float) -> str:
    try:
        return f"{Decimal(str(x)):,.0f}"
    except Exception:
        return str(x)


def notify_new_order(order: Order) -> None:
    """Eski chaqiriqlar uchun — ichida ID bo‘yicha qayta yuklaydi."""
    notify_new_order_by_id(order.pk)


def notify_new_order_by_id(order_id: int) -> None:
    """Buyurtma va barcha qatorlar DB ga yozilgach chaqiring (on_commit)."""
    if not TelegramSettings.get_solo().notify_new_orders:
        return
    gid = _group_id()
    if gid is None:
        return
    order = (
        Order.objects.filter(pk=order_id)
        .prefetch_related("items__product")
        .select_related("client")
        .first()
    )
    if not order:
        return
    client = order.client
    cname = tg_html(client.company_name or client.email or client.username)
    tun = tg_html(client.telegram_username) if client.telegram_username else ""
    lines = []
    for it in order.items.all()[:20]:
        lines.append(
            f"• {tg_html(it.product.name)} × {tg_html(it.quantity)} = {_fmt_money(it.total)}"
        )
    more = ""
    n_items = order.items.count()
    if n_items > 20:
        more = f"\n… va yana {n_items - 20} qator"
    if n_items == 0:
        lines.append("<i>(Mahsulot qatorlari hozircha yo‘q — API ni tekshiring)</i>")
    markup = services.order_inline_keyboard(order.id) if order.status == "pending" else None
    text = (
        f"🛒 <b>Yangi buyurtma</b> <code>#{order.id}</code>\n"
        f"Mijoz: <b>{cname}</b>\n"
        f"Telegram: {('@' + tun) if tun else '—'}\n"
        f"Jami: <b>{_fmt_money(order.total_amount)}</b> so‘m\n"
        f"Holat: {tg_html(order.get_status_display())}\n\n"
        f"<b>Mahsulotlar:</b>\n" + "\n".join(lines) + more + "\n\n"
        + ("Quyidagi tugmalar orqali tasdiqlang." if markup else "")
    )
    r = services.send_message(gid, text, reply_markup=markup)
    if not r.get("ok"):
        logger.warning("notify_new_order telegram: %s", r)


def notify_order_status_change(order: Order, old_status: str) -> None:
    if not TelegramSettings.get_solo().notify_order_status:
        return
    gid = _group_id()
    if gid is None:
        return
    if old_status == order.status:
        return
    old_label = dict(Order.STATUS_CHOICES).get(old_status, old_status)
    text = (
        f"📦 Buyurtma <code>#{order.id}</code>\n"
        f"Holat o‘zgarishi: <i>{tg_html(old_label)}</i>\n"
        f"→ <b>{tg_html(order.get_status_display())}</b>"
    )
    services.send_message(gid, text)
    cid = order.client.telegram_chat_id
    if cid:
        name = tg_html(order.client.company_name or order.client.email or order.client.username)
        nice = (
            f"Salom, <b>{name}</b>! 👋\n\n"
            f"Sizning buyurtmangiz <b>#{order.id}</b> bo‘yicha yangilanish:\n"
            f"✨ Yangi holat: <b>{tg_html(order.get_status_display())}</b>\n\n"
            "Savollar bo‘lsa, biz bilan bog‘laning."
        )
        services.send_message(int(cid), nice)


def notify_payment(payment: Payment) -> None:
    if not TelegramSettings.get_solo().notify_payments:
        return
    gid = _group_id()
    if gid is None:
        return
    payment = Payment.objects.filter(pk=payment.pk).select_related("client", "order").first()
    if not payment:
        return
    ord_txt = f"Buyurtma #{payment.order_id}" if payment.order_id else "Buyurtmasiz"
    c = payment.client
    cname = tg_html(c.company_name or c.email or c.username)
    desc = tg_html(payment.description) if payment.description else ""
    text = (
        f"💳 <b>To‘lov qabul qilindi</b>\n"
        f"Mijoz: <b>{cname}</b>\n"
        f"{ord_txt}\n"
        f"Summa: <b>{_fmt_money(payment.amount)}</b> {tg_html(payment.currency)}\n"
        f"Turi: {tg_html(payment.get_type_display())}\n"
        f"{desc}"
    )
    services.send_message(gid, text)
    cid = payment.client.telegram_chat_id
    if cid:
        name = tg_html(c.company_name or c.email or c.username)
        services.send_message(
            int(cid),
            f"✅ <b>{name}</b>, to‘lovingiz qayd etildi.\n"
            f"Summa: <b>{_fmt_money(payment.amount)}</b> {tg_html(payment.currency)}.\n"
            f"({ord_txt})\n\nRahmat ishonchingiz uchun!",
        )


def notify_expense(expense: Expense) -> None:
    if not TelegramSettings.get_solo().notify_expenses:
        return
    gid = _group_id()
    if gid is None:
        return
    text = (
        f"📤 <b>Xarajat</b>\n"
        f"Kategoriya: {tg_html(expense.category)}\n"
        f"Summa: <b>{_fmt_money(expense.amount)}</b>\n"
        f"{tg_html(expense.description) if expense.description else ''}\n"
        f"Sana: {tg_html(expense.date)}"
    )
    services.send_message(gid, text)
