"""Lesbare JSON-Ausgabe (Pflichtenheft 6.2).

Zwei Leerzeichen Einrückung, Umlaute unverändert, Reihenfolge der Schlüssel wie im Objekt.
Kurze Objekte und Listen stehen in einer Zeile (``{ "id": "x", "name": "Y" }``), damit die
Datei überschaubar bleibt und beim Verschieben genau eine Zeile ändert.
"""

from __future__ import annotations

import json
from typing import Any

_WIDTH = 120
_MAX_INLINE_WITH_CHILDREN = 60
_MAX_INLINE_ITEMS = 30  # größere Behälter nie auf einer Zeile (spart das Probieren)


def _scalar(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def _inline(value: Any) -> str:
    if isinstance(value, dict):
        if not value:
            return "{}"
        inner = ", ".join(f"{_scalar(k)}: {_inline(v)}" for k, v in value.items())
        return "{ " + inner + " }"
    if isinstance(value, list):
        return "[" + ", ".join(_inline(v) for v in value) + "]"
    return _scalar(value)


def _has_nested(value: Any) -> bool:
    children = value.values() if isinstance(value, dict) else value
    return any(isinstance(v, dict | list) and v for v in children)


def _wrapped_scalars(items: list[Any], pad: str, indent: int) -> str:
    """Lange Listen einfacher Werte: mehrere pro Zeile, damit die Datei kurz bleibt."""
    lines: list[str] = []
    current = ""
    for item in items:
        piece = _scalar(item)
        if current and len(pad) + len(current) + len(piece) + 2 > _WIDTH:
            lines.append(pad + current.rstrip())
            current = ""
        current += piece + ", "
    lines.append(pad + current.rstrip().rstrip(","))
    return "[\n" + "\n".join(lines) + "\n" + " " * indent + "]"


def _dump(value: Any, indent: int, prefix_len: int) -> str:
    """``prefix_len``: Zeichen, die in der Zeile schon vor dem Wert stehen."""
    if not isinstance(value, dict | list):
        return _scalar(value)
    if not value:
        return _inline(value)
    if indent > 0 and len(value) <= _MAX_INLINE_ITEMS:
        compact = _inline(value)
        if prefix_len + len(compact) <= _WIDTH and (
            not _has_nested(value) or len(compact) <= _MAX_INLINE_WITH_CHILDREN
        ):
            return compact
    pad = " " * (indent + 2)
    if isinstance(value, list) and not _has_nested(value):
        return _wrapped_scalars(value, pad, indent)
    if isinstance(value, dict):
        lines = []
        for key, item in value.items():
            head = f"{_scalar(key)}: "
            lines.append(pad + head + _dump(item, indent + 2, len(pad) + len(head)))
        return "{\n" + ",\n".join(lines) + "\n" + " " * indent + "}"
    lines = [pad + _dump(item, indent + 2, len(pad)) for item in value]
    return "[\n" + ",\n".join(lines) + "\n" + " " * indent + "]"


def dumps(value: Any) -> str:
    """Wert als lesbares JSON mit abschließendem Zeilenumbruch."""
    return _dump(value, 0, 0) + "\n"
