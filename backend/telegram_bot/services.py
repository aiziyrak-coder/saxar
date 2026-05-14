"""Telegram Bot API — qayta urinish, bo‘laklash, getChatMember."""

from __future__ import annotations

import json
import logging
import os
import time
import urllib.error
import urllib.request
from typing import Any

logger = logging.getLogger(__name__)

MAX_MESSAGE_LEN = 4096
SAFE_CHUNK = 3900


def get_bot_token() -> str | None:
    t = (os.environ.get("TELEGRAM_BOT_TOKEN") or "").strip()
    return t or None


def get_webhook_secret() -> str | None:
    s = (os.environ.get("TELEGRAM_WEBHOOK_SECRET") or "").strip()
    return s or None


def _chunk_text(text: str, limit: int = SAFE_CHUNK) -> list[str]:
    if len(text) <= limit:
        return [text]
    out: list[str] = []
    rest = text
    while rest:
        if len(rest) <= limit:
            out.append(rest)
            break
        cut = rest.rfind("\n", 0, limit)
        if cut < limit // 2:
            cut = limit
        out.append(rest[:cut])
        rest = rest[cut:].lstrip("\n")
    return out


def _tg_request_once(method: str, payload: dict[str, Any], timeout: int = 35) -> dict[str, Any]:
    token = get_bot_token()
    if not token:
        logger.warning("TELEGRAM_BOT_TOKEN o‘rnatilmagan")
        return {"ok": False, "description": "no token"}
    url = f"https://api.telegram.org/bot{token}/{method}"
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(body)
            if isinstance(parsed, dict):
                parsed.setdefault("http_status", e.code)
                return parsed
        except json.JSONDecodeError:
            pass
        return {"ok": False, "description": body, "http_status": e.code}
    except OSError as e:
        logger.error("Telegram tarmoq: %s", e)
        return {"ok": False, "description": str(e)}


def _tg_request(method: str, payload: dict[str, Any], *, timeout: int = 35, max_attempts: int = 4) -> dict[str, Any]:
    last: dict[str, Any] = {"ok": False, "description": "unknown"}
    for attempt in range(max_attempts):
        if attempt:
            time.sleep((0.45, 1.1, 2.2)[attempt - 1] if attempt <= 3 else 2.5)
        last = _tg_request_once(method, payload, timeout=timeout)
        if last.get("ok"):
            return last
        desc = str(last.get("description", "")).lower()
        http = last.get("http_status")
        retry = (
            "too many requests" in desc
            or "retry after" in desc
            or http == 429
            or http in (502, 503, 504)
            or "timeout" in desc
            or "timed out" in desc
            or "bad gateway" in desc
            or "service unavailable" in desc
        )
        if not retry:
            break
    return last


def send_message(
    chat_id: int | str,
    text: str,
    *,
    parse_mode: str | None = "HTML",
    reply_markup: dict[str, Any] | None = None,
    disable_web_page_preview: bool = True,
    reply_to_message_id: int | None = None,
) -> dict[str, Any]:
    last: dict[str, Any] = {"ok": True}
    chunks = _chunk_text(text.replace("\r\n", "\n"))
    for i, chunk in enumerate(chunks):
        payload: dict[str, Any] = {
            "chat_id": chat_id,
            "text": chunk,
            "disable_web_page_preview": disable_web_page_preview,
        }
        if parse_mode is not None:
            payload["parse_mode"] = parse_mode
        if reply_markup is not None and i == 0:
            payload["reply_markup"] = reply_markup
        if reply_to_message_id is not None and i == 0:
            payload["reply_to_message_id"] = reply_to_message_id
        last = _tg_request("sendMessage", payload)
        if not last.get("ok"):
            return last
    return last


def answer_callback_query(callback_query_id: str, text: str | None = None, show_alert: bool = False) -> dict[str, Any]:
    payload: dict[str, Any] = {"callback_query_id": callback_query_id}
    if text:
        payload["text"] = text[:200]
        payload["show_alert"] = show_alert
    return _tg_request("answerCallbackQuery", payload)


def edit_message_text(
    chat_id: int | str,
    message_id: int,
    text: str,
    *,
    parse_mode: str | None = "HTML",
    reply_markup: dict[str, Any] | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "chat_id": chat_id,
        "message_id": message_id,
        "text": text[: MAX_MESSAGE_LEN - 1],
    }
    if parse_mode is not None:
        payload["parse_mode"] = parse_mode
    if reply_markup is not None:
        payload["reply_markup"] = reply_markup
    return _tg_request("editMessageText", payload)


def edit_message_reply_markup(chat_id: int | str, message_id: int, reply_markup: dict[str, Any] | None) -> dict[str, Any]:
    payload: dict[str, Any] = {"chat_id": chat_id, "message_id": message_id}
    if reply_markup is not None:
        payload["reply_markup"] = reply_markup
    return _tg_request("editMessageReplyMarkup", payload)


def get_me() -> dict[str, Any]:
    return _tg_request("getMe", {})


def get_chat_member(chat_id: int | str, user_id: int) -> dict[str, Any]:
    return _tg_request("getChatMember", {"chat_id": chat_id, "user_id": user_id})


def user_can_moderate_in_group(chat_id: int | str, user_id: int) -> bool:
    """Guruhda faqat admin/creator buyurtmani tasdiqlashi (getChatMember)."""
    r = get_chat_member(chat_id, user_id)
    if not r.get("ok"):
        logger.warning("getChatMember xato: %s", r.get("description"))
        return False
    st = (r.get("result") or {}).get("status")
    return st in ("creator", "administrator")


def set_webhook(url: str, secret_token: str | None = None) -> dict[str, Any]:
    payload: dict[str, Any] = {"url": url, "allowed_updates": ["message", "callback_query"]}
    if secret_token:
        payload["secret_token"] = secret_token
    return _tg_request("setWebhook", payload)


def delete_webhook() -> dict[str, Any]:
    return _tg_request("deleteWebhook", {})


def get_webhook_info() -> dict[str, Any]:
    return _tg_request("getWebhookInfo", {})


def order_inline_keyboard(order_id: int) -> dict[str, Any]:
    return {
        "inline_keyboard": [
            [
                {"text": "✅ Tasdiqlash", "callback_data": f"ord:ok:{order_id}"},
                {"text": "❌ Bekor qilish", "callback_data": f"ord:no:{order_id}"},
            ]
        ]
    }
