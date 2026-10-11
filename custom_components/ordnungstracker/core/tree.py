"""Baumoperationen über die flache Knotenliste (Pflichtenheft 5.1, 5.5, 5.13, 8.1)."""

from __future__ import annotations

from collections.abc import Iterator

from .model import TRASH_ID, Checkout, Condition, InventoryData, KindClass, Node
from .textnorm import sort_key

PLACE_LIKE = (KindClass.PLACE, KindClass.FURNITURE, KindClass.CONTAINER)

# Welche Klassen in einem Elternknoten dieser Klasse am häufigsten vorkommen (Reihenfolge = Vorschlag).
_CHILD_CLASSES: dict[KindClass, list[KindClass]] = {
    KindClass.PLACE: [KindClass.FURNITURE, KindClass.CONTAINER, KindClass.ITEM, KindClass.GROUP],
    KindClass.FURNITURE: [KindClass.CONTAINER, KindClass.ITEM, KindClass.GROUP],
    KindClass.CONTAINER: [KindClass.ITEM, KindClass.GROUP, KindClass.CONTAINER],
    KindClass.GROUP: [KindClass.ITEM, KindClass.GROUP],
    KindClass.ITEM: [KindClass.ITEM, KindClass.GROUP],
}


class Tree:
    """Lesende Sicht auf den Baum; Kinder-Index wird einmal aufgebaut.

    Nach strukturellen Änderungen (anlegen, verschieben, löschen) muss ein neues ``Tree``
    erzeugt werden; ``Inventory`` kümmert sich darum.
    """

    def __init__(self, data: InventoryData) -> None:
        self.data = data
        self._children: dict[str | None, list[str]] = {}
        for node in data.nodes.values():
            parent = node.parent if node.parent in data.nodes else None
            self._children.setdefault(parent, []).append(node.id)

    # -- Navigation -----------------------------------------------------------------------
    def children_ids(self, node_id: str | None) -> list[str]:
        """Kinder in Dateireihenfolge (``None`` = oberste Ebene)."""
        return self._children.get(node_id, [])

    def ancestors(self, node_id: str) -> list[str]:
        """Vorfahren von unten nach oben (ohne den Knoten selbst)."""
        result: list[str] = []
        seen = {node_id}
        current = self.data.nodes[node_id].parent
        while current is not None and current in self.data.nodes and current not in seen:
            result.append(current)
            seen.add(current)
            current = self.data.nodes[current].parent
        return result

    def path_ids(self, node_id: str) -> list[str]:
        """Vom obersten Vorfahren bis zum Knoten selbst."""
        return [*reversed(self.ancestors(node_id)), node_id]

    def path_names(self, node_id: str) -> list[str]:
        return [self.data.nodes[i].name for i in self.path_ids(node_id)]

    def descendants(self, node_id: str) -> Iterator[str]:
        """Alle Nachkommen (Tiefensuche, ohne den Knoten selbst)."""
        stack = list(reversed(self.children_ids(node_id)))
        while stack:
            current = stack.pop()
            yield current
            stack.extend(reversed(self.children_ids(current)))

    def subtree_ids(self, node_id: str) -> list[str]:
        return [node_id, *self.descendants(node_id)]

    def depth(self, node_id: str) -> int:
        return len(self.ancestors(node_id))

    def is_ancestor(self, candidate: str, of: str) -> bool:
        """Ist ``candidate`` ein echter Vorfahre von ``of``?"""
        return candidate in self.ancestors(of)

    # -- Zustände abgeleitet vom Pfad -----------------------------------------------------
    def in_trash(self, node_id: str) -> bool:
        """Liegt der Knoten im Papierkorb (er selbst nicht eingeschlossen)?"""
        return TRASH_ID in self.ancestors(node_id)

    def is_archived(self, node_id: str) -> bool:
        """Ist der Knoten oder ein Vorfahre entsorgt/weggegeben (``disposed``)?"""
        nodes = self.data.nodes
        if nodes[node_id].condition is Condition.DISPOSED:
            return True
        return any(nodes[a].condition is Condition.DISPOSED for a in self.ancestors(node_id))

    def is_active(self, node_id: str) -> bool:
        """Zählt der Knoten in Suche und Statistik mit? (Nicht im Papierkorb, nicht archiviert.)"""
        return node_id != TRASH_ID and not self.in_trash(node_id) and not self.is_archived(node_id)

    # -- Vererbung ------------------------------------------------------------------------
    def effective_owner(self, node_id: str) -> tuple[str | None, bool]:
        """Wirksamer Besitzer und ob er geerbt ist (5.5): ``(person_id, inherited)``."""
        nodes = self.data.nodes
        if nodes[node_id].owner:
            return nodes[node_id].owner, False
        for ancestor in self.ancestors(node_id):
            if nodes[ancestor].owner:
                return nodes[ancestor].owner, True
        return None, False

    def effective_checkout(self, node_id: str) -> tuple[Checkout | None, str | None]:
        """Entnahme des Knotens oder des nächsten Vorfahren: ``(checkout, node_id_der_entnahme)``.

        Eine Entnahme gilt auch für den Inhalt eines Behälters (5.7).
        """
        nodes = self.data.nodes
        for current in [node_id, *self.ancestors(node_id)]:
            if nodes[current].checkout is not None:
                return nodes[current].checkout, current
        return None, None

    # -- Anzeige --------------------------------------------------------------------------
    def sorted_children(self, node_id: str | None, *, include_archived: bool = False) -> list[str]:
        """Kinder in Anzeigereihenfolge (8.1).

        Orte, Möbel und Behälter zuerst, nach Nummer (ohne Nummer danach) und Name; dann Gruppen
        und Dinge nach Name. Archivierte erscheinen nur auf Wunsch.
        """
        nodes = self.data.nodes
        kinds = self.data.kinds

        def key(nid: str) -> tuple[int, int, tuple[tuple[int, int | str], ...]]:
            node = nodes[nid]
            kind = kinds.get(node.kind)
            place_like = kind is not None and kind.kind_class in PLACE_LIKE
            if place_like:
                return (0, node.number if node.number is not None else 10**9, sort_key(node.name))
            return (1, 0, sort_key(node.name))

        ids = [
            i
            for i in self.children_ids(node_id)
            if include_archived or nodes[i].condition is not Condition.DISPOSED
        ]
        return sorted(ids, key=key)

    def content_counts(self, node_id: str) -> tuple[int, int]:
        """Anzahl direkter und gesamter (aktiver) Inhalte eines Knotens (8.1)."""
        nodes = self.data.nodes
        direct = [i for i in self.children_ids(node_id) if nodes[i].condition is not Condition.DISPOSED]
        total = 0
        stack = list(direct)
        while stack:
            current = stack.pop()
            total += 1
            stack.extend(
                c for c in self.children_ids(current) if nodes[c].condition is not Condition.DISPOSED
            )
        return len(direct), total

    def suggest_kinds(self, parent_id: str | None) -> list[str]:
        """Arten für einen neuen Knoten in ``parent_id``, die wahrscheinlichste zuerst (8.2).

        Was der Elternknoten schon enthält, hat Vorrang (die häufigste Art seiner Kinder); sonst
        entscheidet seine Klasse: in einem Raum eher Regal oder Kiste, in einer Kiste eher Ding,
        auf oberster Ebene eher ein Raum. Alle vorhandenen Arten werden zurückgegeben.
        """
        kinds = self.data.kinds
        by_class: dict[KindClass, list[str]] = {}
        for kind in kinds.values():
            by_class.setdefault(kind.kind_class, []).append(kind.id)
        if parent_id is None:
            order = [KindClass.PLACE, KindClass.FURNITURE, KindClass.CONTAINER]
        else:
            parent_class = kinds[self.data.nodes[parent_id].kind].kind_class
            order = _CHILD_CLASSES[parent_class]
        ranked: list[str] = []
        if parent_id is not None:
            counts: dict[str, int] = {}
            for child in self.children_ids(parent_id):
                counts[self.data.nodes[child].kind] = counts.get(self.data.nodes[child].kind, 0) + 1
            ranked += sorted(counts, key=lambda k: (-counts[k], list(kinds).index(k)))
        for kind_class in [*order, *KindClass]:
            ranked += by_class.get(kind_class, [])
        return list(dict.fromkeys(ranked))

    def suggest_kind(self, parent_id: str | None) -> str:
        """Die am besten passende Art für einen neuen Knoten in ``parent_id`` (8.2)."""
        return self.suggest_kinds(parent_id)[0]

    def node(self, node_id: str) -> Node:
        return self.data.nodes[node_id]
