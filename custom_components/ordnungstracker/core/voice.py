"""Antworten für die Sprachabfrage (Pflichtenheft 9.7), nur lesend.

Reiner Text: Der Kern kennt weder Assist noch Home Assistant. Die Antworten nutzen dieselbe Suche wie die
Oberfläche und sind für das Vorlesen gebaut (keine Pfeile, keine Datumsangaben in Ziffern).
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from .model import Condition, KindClass
from .search import SearchFilter

if TYPE_CHECKING:
    from .inventory import Inventory
    from .search import SearchIndex

MAX_PLACES = 3
MAX_CONTENT = 10

_CONTAINERS = frozenset({KindClass.PLACE, KindClass.FURNITURE, KindClass.CONTAINER, KindClass.GROUP})


def spoken_name(inv: Inventory, node_id: str) -> str:
    """„Kiste 14 Basteln“ bei nummerierten Knoten, sonst der Name."""
    node = inv.data.nodes[node_id]
    if node.number is None:
        return node.name
    kind = inv.data.kinds.get(node.kind)
    return " ".join(part for part in (kind.name if kind else "", str(node.number), node.name) if part)


def _place(inv: Inventory, node_id: str) -> str:
    """Der Ort eines Knotens, vom Nächsten zum Entferntesten: „Kiste 14 Basteln, Regal B, Keller“."""
    ids = inv.tree.path_ids(node_id)[:-1]
    if not ids:
        return ""
    return ", ".join(spoken_name(inv, i) for i in reversed(ids))


def _checkout_text(inv: Inventory, node_id: str) -> str:
    checkout, _source = inv.tree.effective_checkout(node_id)
    if checkout is None:
        return ""
    if checkout.type.value == "lent":
        return f"ausgeliehen an {checkout.to}"
    return f"gerade entnommen: {checkout.to}"


def _one(inv: Inventory, node_id: str) -> str:
    name = inv.data.nodes[node_id].name
    place = _place(inv, node_id)
    text = f"{name} liegt in {place}." if place else f"{name} liegt auf der obersten Ebene."
    note = _checkout_text(inv, node_id)
    if note:
        text += f" Aber es ist {note}."
    return text


def answer_where(inv: Inventory, index: SearchIndex, query: str) -> str:
    """„Wo ist {Ding}?“ → bester Treffer mit Pfad, bei mehreren die ersten drei, bei Entnahme der Hinweis."""
    query = query.strip()
    if not query:
        return "Wonach soll ich suchen?"
    result = index.search(query, SearchFilter(), MAX_PLACES)
    if not result.hits:
        return f"Ich habe „{query}“ nicht gefunden."
    if result.total == 1 or len(result.hits) == 1:
        return _one(inv, result.hits[0].node_id)
    lines = [_one(inv, hit.node_id) for hit in result.hits]
    more = result.total - len(result.hits)
    head = f"Ich habe {result.total} Treffer. " if more > 0 else f"Ich habe {len(lines)} Treffer. "
    return head + " ".join(f"{i}. {line}" for i, line in enumerate(lines, 1))


def _contents(inv: Inventory, node_id: str) -> str:
    label = spoken_name(inv, node_id)
    children = [
        c for c in inv.tree.sorted_children(node_id) if inv.data.nodes[c].condition is not Condition.DISPOSED
    ]
    if not children:
        return f"{label} ist leer."
    parts = []
    for child_id in children[:MAX_CONTENT]:
        child = inv.data.nodes[child_id]
        amount = f"{child.quantity:g} " if child.quantity is not None and child.quantity != 1 else ""
        parts.append(f"{amount}{child.name}")
    count = len(children)
    text = f"In {label} ist ein Eintrag: " if count == 1 else f"In {label} sind {count} Einträge: "
    text += ", ".join(parts)
    if count > MAX_CONTENT:
        text += f" und {count - MAX_CONTENT} weitere"
    return text + "."


def answer_contents_by_number(inv: Inventory, number: int) -> str:
    """„Was ist in Kiste {Nummer}?“"""
    node = inv.find_by_number(number)
    if node is None or node.id not in inv.data.nodes:
        return f"Eine Kiste mit der Nummer {number} gibt es nicht."
    return _contents(inv, node.id)


def answer_contents_by_name(inv: Inventory, index: SearchIndex, query: str) -> str:
    """„Was ist in {Name}?“ → Inhalt des besten Treffers, der Inhalt haben kann."""
    query = query.strip()
    if not query:
        return "Wessen Inhalt soll ich nennen?"
    flt = SearchFilter(classes=_CONTAINERS)
    result = index.search(query, flt, 1)
    if not result.hits:
        return f"Ich habe keinen Behälter und keinen Ort namens „{query}“ gefunden."
    return _contents(inv, result.hits[0].node_id)
