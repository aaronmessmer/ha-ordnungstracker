"""Schnellerfassung: Text mit einer Zeile pro Ding (Pflichtenheft 8.3).

* Vorangestellte Menge wird erkannt: ``3x Batterien AA``, ``2 Rollen Klebeband``.
* Eingerückte Zeilen werden Unterpunkte der vorigen, weniger eingerückten Zeile.
* Wahlweise trennen Kommas Einträge ("Schere, Kleber, Buntpapier"), außer innerhalb von Zahlen.
* ``format_preview`` zeigt vor dem Speichern, was angelegt würde.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from .model import KindClass, Node

if TYPE_CHECKING:
    from .inventory import Inventory

_NUM = r"\d+(?:[.,]\d+)?"
_BULLET = re.compile(r"^[-*•–]\s+")
_QTY_X_SPACE = re.compile(rf"^({_NUM})\s*[x×]\s+(.+)$", re.IGNORECASE)
_QTY_X_ATTACHED = re.compile(rf"^({_NUM})[x×]\s*(.+)$", re.IGNORECASE)
_QTY_PLAIN = re.compile(rf"^({_NUM})\s+(.+)$")
_COMMA_SPLIT = re.compile(r"(?<!\d),|,(?!\d)")

# Einheiten, die direkt nach der Menge stehen dürfen ("2 Rollen Klebeband").
UNITS = frozenset(
    {
        "stück", "stk", "stk.", "paar", "rolle", "rollen", "packung", "packungen", "pack", "packs",
        "päckchen", "pckg", "flasche", "flaschen", "dose", "dosen", "beutel", "tüte", "tüten",
        "set", "sets", "karton", "kartons", "glas", "gläser", "tube", "tuben", "kg", "g", "l",
        "ml", "m", "cm", "mm", "liter", "meter", "gramm", "kilo", "schachtel", "schachteln",
        "bogen", "blatt", "satz", "sack", "säcke", "eimer",
    }
)  # fmt: skip


@dataclass(slots=True)
class QuickEntry:
    """Ein erkannter Eintrag der Schnellerfassung."""

    name: str
    quantity: float | None = None
    unit: str = ""
    children: list[QuickEntry] = field(default_factory=list)

    def count(self) -> int:
        return 1 + sum(c.count() for c in self.children)


def _to_number(text: str) -> float:
    value = float(text.replace(",", "."))
    return int(value) if value.is_integer() else value


def parse_item(text: str) -> QuickEntry | None:
    """Eine Zeile (ohne Einrückung) in Menge, Einheit und Name zerlegen."""
    text = _BULLET.sub("", text.strip()).strip()
    if not text:
        return None
    for pattern in (_QTY_X_SPACE, _QTY_X_ATTACHED):
        match = pattern.match(text)
        if match:
            return QuickEntry(match.group(2).strip(), _to_number(match.group(1)))
    match = _QTY_PLAIN.match(text)
    if match:
        quantity = _to_number(match.group(1))
        rest = match.group(2).strip()
        first, _, remainder = rest.partition(" ")
        if remainder.strip() and first.casefold() in UNITS:
            return QuickEntry(remainder.strip(), quantity, first)
        return QuickEntry(rest, quantity)
    return QuickEntry(text)


def parse_quickadd(text: str, *, split_commas: bool = False) -> list[QuickEntry]:
    """Text in eine Baumstruktur aus ``QuickEntry`` überführen."""
    roots: list[QuickEntry] = []
    stack: list[tuple[int, QuickEntry]] = []
    for raw_line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
        if not raw_line.strip():
            continue
        expanded = raw_line.expandtabs(4)
        indent = len(expanded) - len(expanded.lstrip(" "))
        body = expanded.strip()
        parts = list(_COMMA_SPLIT.split(body)) if split_commas else [body]
        for part in parts:
            entry = parse_item(part)
            if entry is None:
                continue
            while stack and stack[-1][0] >= indent:
                stack.pop()
            if stack:
                stack[-1][1].children.append(entry)
            else:
                roots.append(entry)
            stack.append((indent, entry))  # Geschwister aus einer Zeile stehen auf gleicher Ebene
    return roots


def format_preview(entries: list[QuickEntry]) -> list[str]:
    """Vorschau als Textzeilen: was würde angelegt werden?"""
    lines: list[str] = []

    def walk(items: list[QuickEntry], depth: int) -> None:
        for item in items:
            qty = ""
            if item.quantity is not None:
                qty = f"{item.quantity:g}× " if not item.unit else f"{item.quantity:g} {item.unit} "
            lines.append("  " * depth + f"• {qty}{item.name}")
            walk(item.children, depth + 1)

    walk(entries, 0)
    return lines


def apply_quickadd(inv: Inventory, parent_id: str, entries: list[QuickEntry]) -> list[Node]:
    """Die erkannten Einträge unterhalb von ``parent_id`` anlegen.

    Einträge mit Unterpunkten werden Gruppen, die übrigen Dinge. Prüft das Ziel vorab, damit
    nicht halb angelegt wird.
    """
    inv.require_active_parent(parent_id)
    item_kind = _kind_for(inv, KindClass.ITEM, "ding")
    group_kind = _kind_for(inv, KindClass.GROUP, "gruppe")
    created: list[Node] = []

    def walk(items: list[QuickEntry], parent: str) -> None:
        for entry in items:
            node = inv.create_node(
                entry.name,
                group_kind if entry.children else item_kind,
                parent,
                quantity=entry.quantity,
                unit=entry.unit,
            )
            created.append(node)
            walk(entry.children, node.id)

    walk(entries, parent_id)
    return created


def _kind_for(inv: Inventory, kind_class: KindClass, preferred: str) -> str:
    kind = inv.data.kinds.get(preferred)
    if kind is not None and kind.kind_class is kind_class:
        return kind.id
    for candidate in inv.data.kinds.values():
        if candidate.kind_class is kind_class:
            return candidate.id
    raise ValueError(f"Keine Art der Klasse {kind_class.value} vorhanden")  # pragma: no cover
