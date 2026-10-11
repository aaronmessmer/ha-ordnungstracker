"""Kennzahlen der Übersichtsseite und der Sensoren (Pflichtenheft 8.11, 9.5)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from .defaults import default_kinds
from .model import SYSTEM_IDS, TRASH_ID, UNSORTED_ID, Condition, KindClass
from .reminders import Category, collect_due, list_checkouts

if TYPE_CHECKING:
    from .inventory import Inventory


@dataclass(slots=True)
class Overview:
    """Zahlen für die Startseite."""

    containers: int = 0
    items: int = 0
    empty_containers: list[str] = field(default_factory=list)
    unsorted: int = 0
    checked_out: int = 0
    checked_out_overdue: int = 0
    due: dict[str, int] = field(default_factory=dict)
    next_free_number: int = 1
    total_value: float | None = None
    value_per_place: dict[str, float] = field(default_factory=dict)


def _price(inv: Inventory, node_id: str) -> float | None:
    value = inv.data.nodes[node_id].fields.get("price")
    if isinstance(value, bool) or not isinstance(value, int | float) or "price" not in inv.data.fields:
        return None
    return float(value)


def build_overview(inv: Inventory) -> Overview:
    """Zählt aktive Knoten (nicht im Papierkorb, nicht archiviert).

    *Dinge* sind Knoten der Klasse ``item``, *Behälter* solche der Klasse ``container``.
    Der Preis eines Knotens gilt für den Knoten als Ganzes (nicht je Stück).
    """
    tree = inv.tree
    data = inv.data
    over = Overview(next_free_number=inv.next_free_number())
    prices: list[tuple[str, float]] = []
    for node in data.nodes.values():
        if node.id in SYSTEM_IDS or not tree.is_active(node.id):
            continue
        kind_class = data.kinds[node.kind].kind_class
        if kind_class is KindClass.ITEM:
            over.items += 1
        elif kind_class is KindClass.CONTAINER:
            over.containers += 1
        if kind_class in (KindClass.CONTAINER, KindClass.FURNITURE) and not any(
            data.nodes[c].condition is not Condition.DISPOSED for c in tree.children_ids(node.id)
        ):
            over.empty_containers.append(node.id)
        price = _price(inv, node.id)
        if price is not None:
            prices.append((node.id, price))
    over.unsorted = sum(
        1
        for nid in tree.subtree_ids(UNSORTED_ID)[1:]
        if data.nodes[nid].condition is not Condition.DISPOSED
        and data.kinds[data.nodes[nid].kind].kind_class is not KindClass.GROUP
    )
    checkouts = list_checkouts(inv)
    over.checked_out = len(checkouts)
    over.checked_out_overdue = sum(1 for c in checkouts if c.overdue)
    over.due = {c.value: 0 for c in Category}
    for item in collect_due(inv):
        over.due[item.category.value] += 1
    if prices:
        over.total_value = sum(p for _, p in prices)
        for node_id, price in prices:
            place = next(
                (
                    a
                    for a in [node_id, *tree.ancestors(node_id)]
                    if data.kinds[data.nodes[a].kind].kind_class is KindClass.PLACE
                ),
                None,
            )
            key = data.nodes[place].name if place else "Ohne Raum"
            over.value_per_place[key] = over.value_per_place.get(key, 0.0) + price
    return over


def diagnostics_summary(inv: Inventory) -> dict[str, Any]:
    """Zahlen und Struktur für die Diagnose (9.8) – **ohne** Namen, Notizen oder sonstige Inhalte."""
    tree = inv.tree
    data = inv.data
    by_class: dict[str, int] = {}
    for node in data.nodes.values():
        key = data.kinds[node.kind].kind_class.value
        by_class[key] = by_class.get(key, 0) + 1
    depths = [tree.depth(nid) for nid in data.nodes]
    return {
        "schema_version": data.schema_version,
        "nodes": len(data.nodes),
        "nodes_by_class": dict(sorted(by_class.items())),
        "max_depth": max(depths, default=0),
        "in_trash": len(tree.subtree_ids(TRASH_ID)) - 1,
        "archived": sum(1 for n in data.nodes if tree.is_archived(n)),
        "numbered": sum(1 for n in data.nodes.values() if n.number is not None),
        "with_owner": sum(1 for n in data.nodes.values() if n.owner is not None),
        "checked_out": sum(1 for n in data.nodes.values() if n.checkout is not None),
        "with_maintenance": sum(1 for n in data.nodes.values() if n.maintenance),
        "kinds": len(data.kinds),
        "custom_kinds": sum(1 for k in data.kinds if k not in {d.id for d in default_kinds()}),
        "persons": len(data.persons),
        "fields": len(data.fields),
        "custom_fields": sum(1 for f in data.fields.values() if not f.builtin),
        "local_fields": sum(1 for f in data.fields.values() if f.scope.type.value == "local"),
        "synonym_groups": len(data.synonyms),
        "templates": len(data.templates),
        "lists": len(data.lists),
        "list_entries": sum(len(lst.entries) for lst in data.lists.values()),
        "sample_loaded": data.meta.sample is not None,
        "settings": data.settings.to_dict(),
    }
