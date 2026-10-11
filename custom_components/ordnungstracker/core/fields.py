"""Eigene Felder mit Geltungsbereich (Pflichtenheft 5.8)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .model import FieldDef, ScopeType
from .tree import Tree


def field_applies(tree: Tree, definition: FieldDef, node_id: str) -> bool:
    """Gilt die Felddefinition für den Knoten?

    Geltungsbereich (global, oder lokal im Knoten und allem darunter) und – falls angegeben –
    die Einschränkung auf Arten oder Klassen müssen passen.
    """
    node = tree.data.nodes[node_id]
    if definition.scope.type is ScopeType.LOCAL:
        scope_node = definition.scope.node
        if scope_node is None:
            return False
        if node_id != scope_node and scope_node not in tree.ancestors(node_id):
            return False
    if definition.kinds and node.kind not in definition.kinds:
        return False
    if definition.classes:
        kind = tree.data.kinds.get(node.kind)
        if kind is None or kind.kind_class not in definition.classes:
            return False
    return True


def applicable_fields(tree: Tree, node_id: str, *, include_hidden: bool = False) -> list[FieldDef]:
    """Alle für den Knoten geltenden Felddefinitionen (ohne ausgeblendete, sofern nicht verlangt)."""
    return [
        d
        for d in tree.data.fields.values()
        if (include_hidden or not d.hidden) and field_applies(tree, d, node_id)
    ]


@dataclass(slots=True)
class FieldValue:
    """Ein Feld eines Knotens samt Wert; ``assigned=False`` = nicht mehr zugeordnet (ausgegraut)."""

    definition: FieldDef
    value: Any
    assigned: bool


def field_view(tree: Tree, node_id: str) -> list[FieldValue]:
    """Felder eines Knotens für die Anzeige.

    Zuerst die geltenden Felder (mit oder ohne Wert), danach die Werte, deren Feld für diesen
    Knoten nicht mehr gilt – sie bleiben erhalten und werden als "nicht mehr zugeordnet"
    gekennzeichnet (5.8).
    """
    node = tree.data.nodes[node_id]
    result: list[FieldValue] = []
    applicable_ids: set[str] = set()
    for definition in applicable_fields(tree, node_id):
        applicable_ids.add(definition.id)
        result.append(FieldValue(definition, node.fields.get(definition.id), True))
    for fid, value in node.fields.items():
        orphan = tree.data.fields.get(fid)
        if orphan is not None and not orphan.hidden and fid not in applicable_ids:
            result.append(FieldValue(orphan, value, False))
    return result
