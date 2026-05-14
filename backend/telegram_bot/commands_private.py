"""Shaxsiy chatdagi buyruqlar: /start, /help, buyurtmalar, profil."""

from __future__ import annotations

import logging
import re
from typing import Any

from django.db.models import Q

from accounts.models import User
from sales.models import Order

from .formatting import tg_html
from .linking import cmd_token, link_by_start_arg, normalize_username, start_arg_from_text
from . import services

logger = logging.getLogger(__name__)


def _reply(chat_id: int, text: str, *, parse_mode: str | None = "HTML") -> None:
    services.send_message(chat_id, text, parse_mode=parse_mode)


def handle_private_message(update: dict[str, Any]) -> None:
    msg = update.get("message") or {}
    chat = msg.get("chat") or {}
    from_user = msg.get("from") or {}
    text_raw = (msg.get("text") or "").strip()
    chat_id = chat.get("id")
    if chat_id is None:
        return
    if chat.get("type") != "private":
        return

    tg_user_id = int(from_user.get("id") or 0)
    tg_username = normalize_username(from_user.get("username"))

    if not text_raw:
        _reply(
            int(chat_id),
            "👋 <b>Saxar</b> boti.\n\n"
            "Matnli buyruqlar uchun <code>/help</code> ni yuboring.",
        )
        return

    token = cmd_token(text_raw)

    if token == "/help":
        _reply(
            int(chat_id),
            "<b>Saxar bot — yordam</b>\n\n"
            "• <code>/start</code> — akkauntni bot bilan bog‘lash (admin username yoki shaxsiy havola beradi).\n"
            "• <code>/buyurtmalar</code> — oxirgi buyurtmalar ro‘yxati.\n"
            "• <code>/buyurtma 12</code> — bitta buyurtma qisqacha.\n"
            "• <code>/profil</code> — bog‘langan akkaunt.\n"
            "• Buyurtma va to‘lov xabarlari shu chatga keladi.\n\n"
            "Savollar: kompaniya administratori.",
        )
        return

    if token == "/start":
        arg = start_arg_from_text(text_raw)
        ok, outcome = link_by_start_arg(int(chat_id), tg_user_id, tg_username, arg)
        if ok:
            _reply(
                int(chat_id),
                "✅ <b>Akkaunt muvaffaqiyatli bog‘landi.</b>\n\n"
                "Buyurtma holati va to‘lovlar bo‘yicha xabarlar shu yerga yuboriladi.",
            )
            return
        if outcome == "taken":
            _reply(
                int(chat_id),
                "⚠️ Bu Telegram akkaunti boshqa foydalanuvchiga bog‘langan. Administrator bilan bog‘laning.",
            )
            return
        if outcome == "multi":
            _reply(
                int(chat_id),
                "⚠️ Bir xil username bilan bir nechta akkaunt topildi. "
                "Iltimos, administrator yuborgan havoladan foydalaning (<code>/start link_...</code>).",
            )
            return
        if outcome == "none":
            if tg_username:
                _reply(
                    int(chat_id),
                    "ℹ️ Admin panelda profilingizga Telegram "
                    f"username <code>@{tg_html(tg_username)}</code> kiritilmagan yoki boshqa chatga bog‘langan.\n\n"
                    "Administrator sizga shaxsiy havola yuborishi mumkin.",
                )
            else:
                _reply(
                    int(chat_id),
                    "ℹ️ Telegramda <b>username</b> yo‘q — admin yuborgan "
                    "<code>/start link_...</code> havolasidan foydalaning.",
                )
            return
        if outcome == "no_username":
            _reply(
                int(chat_id),
                "ℹ️ Telegramda <b>username</b> yo‘q — admin yuborgan "
                "<code>/start link_...</code> havolasidan foydalaning.",
            )
            return
        if outcome == "bad_format":
            _reply(int(chat_id), "❌ Havola formati noto‘g‘ri.")
            return
        if outcome == "no_user":
            _reply(int(chat_id), "❌ Havola noto‘g‘ri yoki akkaunt topilmadi.")
            return
        logger.warning("telegram /start unknown outcome=%s", outcome)
        _reply(int(chat_id), "❌ Bog‘lashda xatolik. Administratorga murojaat qiling.")
        return

    if token == "/profil":
        u = User.objects.filter(telegram_chat_id=tg_user_id).first()
        if not u:
            _reply(
                int(chat_id),
                "ℹ️ Hali akkaunt bog‘lanmagan. <code>/start</code> yoki admin havolasidan foydalaning.",
            )
            return
        un = tg_html(u.telegram_username or "—")
        _reply(
            int(chat_id),
            "<b>Profilingiz</b>\n\n"
            f"Login: <code>{tg_html(u.username)}</code>\n"
            f"Rol: {tg_html(u.get_role_display())}\n"
            f"Telegram @username (panel): <code>@{un}</code>\n"
            f"Kompaniya: {tg_html(u.company_name or '—')}",
        )
        return

    if token == "/buyurtmalar":
        u = User.objects.filter(telegram_chat_id=tg_user_id).first()
        if not u:
            _reply(int(chat_id), "ℹ️ Avval <code>/start</code> bilan bog‘laning.")
            return
        qs = (
            Order.objects.filter(Q(client=u) | Q(agent=u) | Q(driver=u))
            .distinct()
            .order_by("-created_at")[:12]
        )
        rows = list(qs)
        if not rows:
            _reply(int(chat_id), "Hozircha sizga tegishli buyurtmalar yo‘q.")
            return
        lines = ["<b>Oxirgi buyurtmalar</b>\n"]
        for o in rows:
            lines.append(
                f"• <code>#{o.id}</code> — {tg_html(o.get_status_display())} — "
                f"{o.total_amount:,.0f} so‘m — <code>/buyurtma {o.id}</code>"
            )
        _reply(int(chat_id), "\n".join(lines))
        return

    if token == "/buyurtma":
        m = re.match(r"^/buyurtma(?:@\w+)?\s+(\d+)\s*$", text_raw, re.I)
        u = User.objects.filter(telegram_chat_id=tg_user_id).first()
        if not u:
            _reply(int(chat_id), "ℹ️ Avval <code>/start</code> bilan bog‘laning.")
            return
        if not m:
            _reply(int(chat_id), "Format: <code>/buyurtma 12</code>")
            return
        oid = int(m.group(1))
        o = (
            Order.objects.filter(Q(client=u) | Q(agent=u) | Q(driver=u))
            .filter(pk=oid)
            .select_related("client")
            .first()
        )
        if not o:
            _reply(int(chat_id), f"Buyurtma <code>#{oid}</code> topilmadi yoki sizga tegishli emas.")
            return
        _reply(
            int(chat_id),
            f"<b>Buyurtma #{o.id}</b>\n"
            f"Holat: {tg_html(o.get_status_display())}\n"
            f"Summa: <b>{o.total_amount:,.0f}</b> so‘m\n"
            f"To‘langan: {o.paid_amount:,.0f} so‘m\n"
            f"Mijoz: {tg_html(o.client.company_name or o.client.username)}",
        )
        return

    _reply(
        int(chat_id),
        "👋 <b>Saxar</b> platformasi boti.\n\n"
        "Buyruqlar: <code>/help</code>\n"
        "Bog‘lash: <code>/start</code> (admin havolasi yoki username sozlangan bo‘lsa).",
    )
