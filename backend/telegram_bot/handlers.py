"""Webhook uchun eski importlar: mantiq ``dispatcher`` va ``linking`` modullarida."""

from __future__ import annotations

from typing import Any

from .linking import make_start_link_arg, parse_start_link_arg

__all__ = ["make_start_link_arg", "parse_start_link_arg", "handle_message", "handle_callback_query"]


def handle_message(update: dict[str, Any]) -> None:
    from .dispatcher import dispatch_message

    dispatch_message(update)


def handle_callback_query(update: dict[str, Any]) -> None:
    from .dispatcher import dispatch_callback_query

    dispatch_callback_query(update)
