"""Rasm maydonlari: serverga yuklangan yo‘l (/media/...) yoki tashqi URL."""

import re


def normalize_media_path(value: str | None) -> str:
    if value is None:
        return ""
    v = str(value).strip()
    if not v:
        return ""
    if re.match(r"^https?://", v, re.IGNORECASE):
        return v[:500]
    if v.startswith("//"):
        return ("https:" + v)[:500]
    if v.startswith("/media/"):
        return v[:500]
    if v.startswith("media/"):
        return f"/{v}"[:500]
    if v.startswith("uploads/"):
        return f"/media/{v}"[:500]
    return v[:500]
