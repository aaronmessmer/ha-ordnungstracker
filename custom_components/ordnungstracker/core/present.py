"""JSON-taugliche Darstellungen für Oberfläche, Dienste und WebSocket (Pflichtenheft 8.1, 7.5).

Die Home-Assistant-Schicht reicht diese Strukturen unverändert weiter; so bleibt die Darstellung
an einer Stelle (und im Kern testbar).
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from .fields import field_view
from .model import Condition, Node
from .reminders import DueItem, node_hints

if TYPE_CHECKING:
    from .inventory import Inventory
    from .search import SearchHit


def kind_dict(inv: Inventory, kind_id: str) -> dict[str, Any]:
    kind = inv.data.kinds[kind_id]
    return {
        "id": kind.id,
        "name": kind.name,
        "class": kind.kind_class.value,
        "icon": kind.icon,
        "numbered": kind.numbered,
    }


def node_brief(inv: Inventory, node_id: str) -> dict[str, Any]:
    """Kurzfassung für Listen (Kinder, Treffer, Favoriten)."""
    node = inv.data.nodes[node_id]
    kind = inv.data.kinds[node.kind]
    direct, total = inv.tree.content_counts(node_id)
    return {
        "id": node.id,
        "name": node.name,
        "kind": node.kind,
        "kind_name": kind.name,
        "class": kind.kind_class.value,
        "icon": kind.icon,
        "number": node.number,
        "quantity": node.quantity,
        "unit": node.unit,
        "min_quantity": node.min_quantity,
        "condition": node.condition.value,
        "checked_out": node.checkout is not None,
        "archived": inv.tree.is_archived(node_id),
        "hints": [{"code": h.code, "text": h.text} for h in node_hints(inv, node_id)],
        "children": direct,
        "descendants": total,
    }


def _owner(inv: Inventory, node_id: str) -> dict[str, Any] | None:
    owner, inherited = inv.tree.effective_owner(node_id)
    if owner is None:
        return None
    return {"id": owner, "name": inv.data.persons[owner].name, "inherited": inherited}


def _fields(inv: Inventory, node_id: str) -> list[dict[str, Any]]:
    return [
        {
            "id": v.definition.id,
            "name": v.definition.name,
            "type": v.definition.type.value,
            "group": v.definition.group,
            "unit": v.definition.unit,
            "options": list(v.definition.options),
            "remind_days_before": v.definition.remind_days_before,
            "value": v.value,
            "assigned": v.assigned,
        }
        for v in field_view(inv.tree, node_id)
    ]


def node_detail(inv: Inventory, node_id: str, *, include_archived: bool = False) -> dict[str, Any]:
    """Alle Angaben eines Knotens samt Pfad, Feldern und sortiertem Inhalt (Knotenseite, 8.1)."""
    node: Node = inv.node(node_id)
    tree = inv.tree
    detail = node_brief(inv, node_id)
    checkout, source = tree.effective_checkout(node_id)
    detail.update(
        {
            "parent": node.parent,
            "path": [{"id": i, "name": inv.data.nodes[i].name} for i in tree.path_ids(node_id)],
            "aliases": list(node.aliases),
            "tags": list(node.tags),
            "note": node.note,
            "owner": node.owner,
            "effective_owner": _owner(inv, node_id),
            "checkout": node.checkout.to_dict() if node.checkout else None,
            "effective_checkout": (
                {**checkout.to_dict(), "source": source, "inherited": source != node_id} if checkout else None
            ),
            "fields": _fields(inv, node_id),
            "maintenance": [t.to_dict() for t in node.maintenance],
            "attachments": [dict(a) for a in node.attachments],
            "created": node.created,
            "modified": node.modified,
            "verified": node.verified,
            "trashed": node.trashed.to_dict() if node.trashed else None,
            "in_trash": tree.in_trash(node_id) or node_id == "papierkorb",
            "contents": [
                node_brief(inv, c) for c in tree.sorted_children(node_id, include_archived=include_archived)
            ],
            "suggested_kinds": tree.suggest_kinds(node_id),
            "disposed": node.condition is Condition.DISPOSED,
        }
    )
    return detail


def hit_dict(hit: SearchHit) -> dict[str, Any]:
    """Suchtreffer (7.5)."""
    return {
        "id": hit.node_id,
        "name": hit.name,
        "kind": hit.kind,
        "class": hit.kind_class.value,
        "number": hit.number,
        "path": [{"id": i, "name": n} for i, n in hit.path],
        "owner": hit.owner,
        "owner_inherited": hit.owner_inherited,
        "hints": [{"code": h.code, "text": h.text} for h in hit.hints],
        "matched_in": hit.matched_in,
        "archived": hit.archived,
    }


def due_dict(inv: Inventory, item: DueItem) -> dict[str, Any]:
    """Fälliger Eintrag mit Pfad (für Sensoren, Ereignisse, Ansicht „Fällig“)."""
    return {
        "category": item.category.value,
        "node_id": item.node_id,
        "name": item.node_name,
        "path": " › ".join(inv.tree.path_names(item.node_id)[:-1]),
        "detail": item.detail,
        "due": item.due,
        "days": item.days,
        "overdue": item.overdue,
        "key": item.key,
    }


def catalog(inv: Inventory) -> dict[str, Any]:
    """Arten, Personen, Felddefinitionen, Synonyme, Vorlagen, Einstellungen (Verwaltung, 8.13)."""
    data = inv.data
    return {
        "kinds": [kind_dict(inv, k) for k in data.kinds],
        "persons": [p.to_dict() for p in data.persons.values()],
        "fields": [f.to_dict() for f in data.fields.values()],
        "synonyms": [list(g) for g in data.synonyms],
        "templates": [t.to_dict() for t in data.templates.values()],
        "lists": [
            {"id": lst.id, "name": lst.name, "entries": len(lst.entries)} for lst in data.lists.values()
        ],
        "settings": {
            "lent_days": data.settings.lent_days,
            "stale_days": data.settings.stale_days,
            "trash_days": data.settings.trash_days,
        },
        "sample_loaded": data.meta.sample is not None,
    }
