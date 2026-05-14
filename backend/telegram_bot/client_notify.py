"""Mijozga buyurtma tasdiq/bekor xabarlari."""

from __future__ import annotations

from accounts.models import User
from sales.models import Order

from .formatting import tg_html
from . import services


def _should_notify_client(user: User) -> bool:
    return bool(getattr(user, "telegram_notify", True) and user.telegram_chat_id)


def notify_order_confirmed_to_client(order: Order) -> None:
    client = order.client
    if not _should_notify_client(client):
        return
    cid = client.telegram_chat_id
    if not cid:
        return
    name = tg_html(client.company_name or client.get_full_name() or client.email or client.username)
    text = (
        f"🎉 <b>Hurmatli {name}!</b>\n\n"
        f"Buyurtma <b>#{order.id}</b> adminlar tomonidan <b>tasdiqlandi</b>.\n"
        f"Summa: <b>{order.total_amount:,.0f}</b> so‘m.\n\n"
        "Mahsulotlaringiz tez orada yig‘iladi va yetkazib berish rejalashtiriladi. "
        "Savollar bo‘lsa, kompaniya bilan bog‘laning."
    )
    for chunk in _split_telegram_text(text):
        services.send_message(int(cid), chunk)


def notify_order_cancelled_to_client(order: Order) -> None:
    client = order.client
    if not _should_notify_client(client):
        return
    cid = client.telegram_chat_id
    if not cid:
        return
    name = tg_html(client.company_name or client.get_full_name() or client.email or client.username)
    text = (
        f"Hurmatli <b>{name}</b>,\n\n"
        f"Buyurtma <b>#{order.id}</b> admin tomonidan <b>bekor qilindi</b>.\n"
        f"Summa: {order.total_amount:,.0f} so‘m.\n\n"
        "Batafsil ma’lumot uchun administratorga murojaat qiling."
    )
    for chunk in _split_telegram_text(text):
        services.send_message(int(cid), chunk)


def _split_telegram_text(text: str, limit: int = 3900) -> list[str]:
    if len(text) <= limit:
        return [text]
    chunks: list[str] = []
    rest = text
    while rest:
        if len(rest) <= limit:
            chunks.append(rest)
            break
        cut = rest.rfind("\n", 0, limit)
        if cut < limit // 2:
            cut = limit
        chunks.append(rest[:cut])
        rest = rest[cut:].lstrip("\n")
    return chunks
