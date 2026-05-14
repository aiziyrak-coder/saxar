"""Webhook uchun yengil tezlik cheklovi va takroriy update filtri (Django cache)."""

from __future__ import annotations

import logging
import time
from typing import Any

logger = logging.getLogger(__name__)


def _cache():
    from django.core.cache import cache

    return cache


def is_duplicate_update(update_id: Any) -> bool:
    """True bo‘lsa, bu update allaqachon qayta ishlangan (Telegram qayta yuborishi)."""
    if update_id is None:
        return False
    try:
        key = f"tg:upd:{int(update_id)}"
        cache = _cache()
        if cache.add(key, 1, timeout=86400):
            return False
        return True
    except Exception as e:  # pragma: no cover - cache misconfig
        logger.warning("telegram ratelimit cache: %s", e)
        return False


def private_chat_rate_limited(chat_id: int, *, limit: int = 45, window_sec: int = 60) -> bool:
    """True bo‘lsa, chat uchun limitdan oshib ketgan."""
    try:
        bucket = int(time.time() // window_sec)
        key = f"tg:rl:{chat_id}:{bucket}"
        cache = _cache()
        n = cache.get(key, 0)
        if int(n) >= limit:
            return True
        cache.set(key, int(n) + 1, timeout=window_sec + 5)
        return False
    except Exception as e:  # pragma: no cover
        logger.warning("telegram ratelimit: %s", e)
        return False
