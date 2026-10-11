"""Fälligkeiten, Hinweise und Kalendertermine (Pflichtenheft 5.7, 5.9, 8.8, 9.5, 9.6).

Alle Berechnungen beziehen sich auf ``Inventory.today()`` und sind damit an Datumsgrenzen
prüfbar. Archivierte Knoten und der Papierkorb zählen nicht.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from enum import StrEnum
from typing import TYPE_CHECKING

from . import dates
from .fields import field_applies
from .model import SYSTEM_IDS, CheckoutType, Condition, FieldType, Node

if TYPE_CHECKING:
    from .inventory import Inventory


class Category(StrEnum):
    """Rubriken der Ansicht „Fällig“ (8.8)."""

    EXPIRING = "expiring"
    CHECKOUT_OVERDUE = "checkout_overdue"
    BELOW_MIN = "below_min"
    MAINTENANCE = "maintenance_due"
    MISSING = "missing"


@dataclass(frozen=True, slots=True)
class DueItem:
    """Ein fälliger Eintrag. ``days`` = Tage bis zum Termin (negativ = überfällig)."""

    category: Category
    node_id: str
    node_name: str
    detail: str
    detail_id: str
    due: str | None
    days: int | None
    overdue: bool

    @property
    def key(self) -> str:
        """Stabiler Schlüssel, um bereits gemeldete Einträge wiederzuerkennen (9.6)."""
        return f"{self.category.value}|{self.node_id}|{self.detail_id}|{self.due or ''}"


@dataclass(frozen=True, slots=True)
class Hint:
    """Kennzeichnung eines Treffers (7.5)."""

    code: str
    text: str


@dataclass(frozen=True, slots=True)
class CalendarEvent:
    """Termin für den Kalender (9.5)."""

    day: date
    title: str
    node_id: str
    category: str


@dataclass(frozen=True, slots=True)
class CheckoutInfo:
    """Eintrag der Übersicht „Entnommen“ (8.6)."""

    node_id: str
    node_name: str
    type: CheckoutType
    to: str
    since: str
    until: str | None
    days_out: int
    overdue: bool


def _active_nodes(inv: Inventory) -> list[Node]:
    tree = inv.tree
    return [n for n in inv.data.nodes.values() if n.id not in SYSTEM_IDS and tree.is_active(n.id)]


def _reminder_dates(inv: Inventory, node: Node) -> list[tuple[str, str, str]]:
    """``(feld_id, feldname, datum)`` aller Datumsfelder mit Erinnerung, die für den Knoten gelten."""
    result: list[tuple[str, str, str]] = []
    for fid, value in node.fields.items():
        definition = inv.data.fields.get(fid)
        if (
            definition is None
            or definition.type is not FieldType.DATE
            or definition.remind_days_before is None
            or definition.hidden
            or not isinstance(value, str)
            or not field_applies(inv.tree, definition, node.id)
        ):
            continue
        result.append((fid, definition.name, value))
    return result


def collect_due(inv: Inventory) -> list[DueItem]:
    """Alles Fällige in fünf Rubriken, dringendste zuerst (8.8)."""
    today = inv.today()
    settings = inv.data.settings
    items: list[DueItem] = []
    for node in _active_nodes(inv):
        for fid, fname, value in _reminder_dates(inv, node):
            definition = inv.data.fields[fid]
            days = (dates.to_date(value) - today).days
            if days <= (definition.remind_days_before or 0):
                items.append(
                    DueItem(Category.EXPIRING, node.id, node.name, fname, fid, value, days, days < 0)
                )
        checkout = node.checkout
        if checkout is not None:
            if checkout.until is not None:
                days = (dates.to_date(checkout.until) - today).days
                if days < 0:
                    items.append(
                        DueItem(
                            Category.CHECKOUT_OVERDUE,
                            node.id,
                            node.name,
                            checkout.to,
                            "return",
                            checkout.until,
                            days,
                            True,
                        )
                    )
            elif checkout.type is CheckoutType.LENT and not checkout.no_reminder:
                away = (today - dates.to_date(checkout.since)).days
                if away > settings.lent_days:
                    items.append(
                        DueItem(
                            Category.CHECKOUT_OVERDUE,
                            node.id,
                            node.name,
                            checkout.to,
                            "lent_long",
                            None,
                            -away,
                            True,
                        )
                    )
        if node.quantity is not None and node.min_quantity is not None and node.quantity < node.min_quantity:
            items.append(DueItem(Category.BELOW_MIN, node.id, node.name, "", "quantity", None, None, False))
        for task in node.maintenance:
            if task.next_due is not None:
                days = (dates.to_date(task.next_due) - today).days
                if days <= 0:
                    items.append(
                        DueItem(
                            Category.MAINTENANCE,
                            node.id,
                            node.name,
                            task.title,
                            task.id,
                            task.next_due,
                            days,
                            days < 0,
                        )
                    )
        if node.condition is Condition.MISSING:
            items.append(DueItem(Category.MISSING, node.id, node.name, "", "missing", None, None, False))
    order = {c: i for i, c in enumerate(Category)}
    items.sort(
        key=lambda i: (
            order[i.category],
            i.days if i.days is not None else 0,
            i.node_name.casefold(),
        )
    )
    return items


def due_by_category(inv: Inventory) -> dict[Category, list[DueItem]]:
    """``collect_due`` nach Rubrik gruppiert (alle fünf Schlüssel sind vorhanden)."""
    grouped: dict[Category, list[DueItem]] = {c: [] for c in Category}
    for item in collect_due(inv):
        grouped[item.category].append(item)
    return grouped


def new_due_items(current: list[DueItem], reported: set[str]) -> tuple[list[DueItem], set[str]]:
    """Neu fällig gewordene Einträge und der fortgeschriebene Merker (9.6).

    Was nicht mehr fällig ist, fällt aus dem Merker und kann später erneut gemeldet werden.
    """
    current_keys = {i.key for i in current}
    new = [i for i in current if i.key not in reported]
    return new, current_keys


def list_checkouts(inv: Inventory) -> list[CheckoutInfo]:
    """Alles, was gerade nicht an seinem Platz ist, am längsten Entnommenes zuerst (8.6)."""
    today = inv.today()
    result: list[CheckoutInfo] = []
    for node in _active_nodes(inv):
        c = node.checkout
        if c is None:
            continue
        overdue = c.until is not None and dates.to_date(c.until) < today
        result.append(
            CheckoutInfo(
                node.id,
                node.name,
                c.type,
                c.to,
                c.since,
                c.until,
                (today - dates.to_date(c.since)).days,
                overdue,
            )
        )
    result.sort(key=lambda r: (-r.days_out, r.node_name.casefold()))
    return result


def calendar_events(inv: Inventory, start: date, end: date) -> list[CalendarEvent]:
    """Alle Termine zwischen ``start`` und ``end`` (einschließlich): Ablauf, Garantie, Rückgabe, Wartung."""
    events: list[CalendarEvent] = []

    def add(day_text: str, title: str, node: Node, category: str) -> None:
        day = dates.to_date(day_text)
        if start <= day <= end:
            events.append(CalendarEvent(day, title, node.id, category))

    for node in _active_nodes(inv):
        for fid, fname, value in _reminder_dates(inv, node):
            add(value, f"{fname}: {node.name}", node, f"field:{fid}")
        if node.checkout is not None and node.checkout.until is not None:
            add(node.checkout.until, f"Rückgabe: {node.name} ({node.checkout.to})", node, "return")
        for task in node.maintenance:
            if task.next_due is not None:
                add(task.next_due, f"Wartung: {task.title} ({node.name})", node, "maintenance")
    events.sort(key=lambda e: (e.day, e.title.casefold()))
    return events


def stale_nodes(inv: Inventory) -> set[str]:
    """Aktive Knoten, die „lange nicht bestätigt“ wurden (Filter für das Ausmisten, 8.9).

    Maßgeblich ist die letzte Bestätigung, sonst das Anlegedatum.
    """
    limit = inv.today().toordinal() - inv.data.settings.stale_days
    result: set[str] = set()
    for node in _active_nodes(inv):
        reference = node.verified or node.created
        if reference and dates.to_date(reference).toordinal() <= limit:
            result.add(node.id)
    return result


def node_hints(inv: Inventory, node_id: str) -> list[Hint]:
    """Kennzeichnungen eines Knotens für Suchtreffer und Anzeige (7.5)."""
    node = inv.data.nodes[node_id]
    today = inv.today()
    hints: list[Hint] = []
    checkout, source = inv.tree.effective_checkout(node_id)
    if checkout is not None:
        verb = "ausgeliehen an" if checkout.type is CheckoutType.LENT else "entnommen:"
        text = f"{verb} {checkout.to} seit {checkout.since}"
        if source != node_id:
            text = f"Teil von „{inv.data.nodes[source].name}“ – {text}" if source else text
        hints.append(Hint("checked_out", text))
    if node.condition is Condition.MISSING:
        hints.append(Hint("missing", "vermisst"))
    elif node.condition is Condition.DEFECTIVE:
        hints.append(Hint("defective", "defekt"))
    elif node.condition is Condition.TO_SELL:
        hints.append(Hint("to_sell", "zu verkaufen"))
    elif node.condition is Condition.TO_GIVE_AWAY:
        hints.append(Hint("to_give_away", "zu verschenken"))
    if node.quantity is not None and node.min_quantity is not None and node.quantity < node.min_quantity:
        hints.append(Hint("below_min", f"unter Mindestbestand ({node.quantity:g} von {node.min_quantity:g})"))
    for fid, fname, value in _reminder_dates(inv, node):
        definition = inv.data.fields[fid]
        days = (dates.to_date(value) - today).days
        if days < 0:
            hints.append(Hint("expired", f"{fname} überschritten ({value})"))
        elif days <= (definition.remind_days_before or 0):
            hints.append(Hint("expiring", f"{fname} in {days} Tagen ({value})"))
    return hints
