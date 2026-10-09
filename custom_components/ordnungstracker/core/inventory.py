"""Das Inventar mit allen Operationen (Pflichtenheft 5, 8).

Jede Änderung ist eine klar abgegrenzte Methode, die vorher prüft und erst dann ändert, und die
einen ``Change`` hinterlässt (für das Protokoll, den Suchindex und ein späteres Rückgängig).
Der Kern kennt Home Assistant nicht.
"""

from __future__ import annotations

import random
import re
from collections.abc import Callable, Iterable, Mapping
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any, Literal

from . import dates
from .dates import Clock
from .errors import (
    CycleError,
    InUseError,
    InvalidValueError,
    NotFoundError,
    NumberTakenError,
    SystemNodeError,
    TrashError,
)
from .fields import field_applies
from .ids import new_id
from .model import (
    SYSTEM_IDS,
    TRASH_ID,
    UNSORTED_ID,
    Checkout,
    CheckoutType,
    Condition,
    FieldDef,
    FieldScope,
    FieldType,
    Interval,
    IntervalUnit,
    InventoryData,
    Kind,
    KindClass,
    ListEntry,
    LogEntry,
    MaintenanceTask,
    Node,
    PackList,
    Person,
    ScopeType,
    Template,
    TemplateNode,
    TrashInfo,
)
from .parse import is_iso_date
from .textnorm import normalized
from .tree import Tree
from .validation import field_value_error, unusual_placement

NumberArg = int | Literal["auto"] | None


@dataclass(slots=True)
class Change:
    """Eine abgeschlossene Änderung (Eintrag im Änderungsprotokoll, Pflichtenheft 6.4)."""

    action: str
    time: str
    user: str = ""
    node_id: str | None = None
    node_name: str | None = None
    details: dict[str, Any] = field(default_factory=dict)
    # Knoten, deren Suchdatensatz neu berechnet werden muss; ``None`` = alle.
    touched: tuple[str, ...] | None = ()
    structure: bool = False
    hints: list[str] = field(default_factory=list)

    def to_journal(self) -> dict[str, Any]:
        """Zeile für ``verlauf.jsonl``."""
        entry: dict[str, Any] = {"time": self.time, "user": self.user, "action": self.action}
        if self.node_id is not None:
            entry["node"] = self.node_id
        if self.node_name is not None:
            entry["name"] = self.node_name
        if self.details:
            entry["details"] = self.details
        return entry


@dataclass(slots=True)
class ListGroup:
    """Gruppe einer Listenansicht nach Lagerort (Raum)."""

    place_id: str | None
    place_name: str
    entries: list[ListEntry] = field(default_factory=list)


_UPDATABLE = {
    "name", "kind", "number", "aliases", "tags", "note", "owner", "quantity", "unit",
    "min_quantity", "condition",
}  # fmt: skip
_SYSTEM_LOCKED = {"name", "kind", "number", "condition"}


def _clean_list(values: Iterable[str]) -> list[str]:
    """Texte zurechtstutzen, Leere und Doppelte (ohne Rücksicht auf Groß-/Kleinschreibung) entfernen."""
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        text = str(value).strip()
        if text and text.casefold() not in seen:
            seen.add(text.casefold())
            result.append(text)
    return result


def _slug(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", normalized(text).replace(" ", "_")).strip("_")
    return slug or "eintrag"


class Inventory:
    """Das gesamte Inventar im Speicher plus alle ändernden Operationen."""

    def __init__(
        self,
        data: InventoryData,
        *,
        clock: Clock = dates.system_clock,
        rng: random.Random | None = None,
    ) -> None:
        self.data = data
        self.clock = clock
        self.rng = rng
        self.actor = ""
        self.revision = 0
        self._tree: Tree | None = None
        self._changes: list[Change] = []
        self._listeners: list[Callable[[Change], None]] = []
        self.normalizations = self._normalize()

    # ------------------------------------------------------------------ Grundlagen --------
    @property
    def tree(self) -> Tree:
        if self._tree is None:
            self._tree = Tree(self.data)
        return self._tree

    def now(self) -> str:
        return self.clock().isoformat(timespec="seconds")

    def today(self) -> date:
        return self.clock().date()

    def subscribe(self, listener: Callable[[Change], None]) -> None:
        """Wird nach jeder Änderung aufgerufen (z. B. vom Suchindex)."""
        self._listeners.append(listener)

    def drain_changes(self) -> list[Change]:
        """Aufgelaufene Änderungen abholen (für das Protokoll)."""
        changes, self._changes = self._changes, []
        return changes

    def _record(
        self,
        action: str,
        node: Node | None = None,
        *,
        details: dict[str, Any] | None = None,
        touched: tuple[str, ...] | None = (),
        structure: bool = False,
        hints: list[str] | None = None,
    ) -> Change:
        if touched == () and node is not None:
            touched = (node.id,)
        change = Change(
            action=action,
            time=self.now(),
            user=self.actor,
            node_id=node.id if node else None,
            node_name=node.name if node else None,
            details=details or {},
            touched=touched,
            structure=structure,
            hints=hints or [],
        )
        if structure:
            self._tree = None
        self.revision += 1
        self.data.meta.modified = change.time
        self._changes.append(change)
        for listener in self._listeners:
            listener(change)
        return change

    def _normalize(self) -> list[str]:
        """Bringt ein geladenes Inventar in Normalform (ohne Datenverlust).

        * Dinge mit Unterpunkten werden zu Gruppen (5.2).
        * Direkt im Papierkorb liegende Knoten ohne Vermerk bekommen einen (Löschdatum = jetzt).
        """
        notes: list[str] = []
        tree = self.tree
        for node in self.data.nodes.values():
            kind = self.data.kinds.get(node.kind)
            if (
                kind is not None
                and kind.kind_class is KindClass.ITEM
                and tree.children_ids(node.id)
                and (group := self._group_kind_id()) is not None
            ):
                node.kind = group
                notes.append(f'"{node.name}" hat Unterpunkte und wurde zur Gruppe.')
            if node.parent == TRASH_ID and node.trashed is None:
                node.trashed = TrashInfo(at=self.now())
                notes.append(f'"{node.name}" im Papierkorb ohne Löschdatum: Datum auf jetzt gesetzt.')
        return notes

    def _group_kind_id(self) -> str | None:
        preferred = self.data.kinds.get("gruppe")
        if preferred is not None and preferred.kind_class is KindClass.GROUP:
            return preferred.id
        return next((k.id for k in self.data.kinds.values() if k.kind_class is KindClass.GROUP), None)

    def replace_data(self, data: InventoryData) -> None:
        """Inhalt komplett austauschen (Neuladen von der Platte, Zurückrollen)."""
        self.data = data
        self._tree = None
        self.revision += 1
        self.normalizations = self._normalize()
        reload = Change("reload", self.now(), touched=None, structure=True)
        for listener in self._listeners:
            listener(reload)

    # ------------------------------------------------------------------ Zugriff -----------
    def node(self, node_id: str) -> Node:
        try:
            return self.data.nodes[node_id]
        except KeyError:
            raise NotFoundError(
                f'Der Knoten "{node_id}" existiert nicht (mehr). Lade die Ansicht neu.',
                node_id=node_id,
            ) from None

    def kind_of(self, node_id: str) -> Kind:
        return self.data.kinds[self.node(node_id).kind]

    def find_by_number(self, number: int) -> Node | None:
        return next((n for n in self.data.nodes.values() if n.number == number), None)

    def used_numbers(self) -> set[int]:
        """Alle vergebenen Nummern, auch die von Knoten im Papierkorb (sie bleiben reserviert)."""
        return {n.number for n in self.data.nodes.values() if n.number is not None}

    def next_free_number(self) -> int:
        """Kleinste freie Nummer (5.3)."""
        used = self.used_numbers()
        candidate = 1
        while candidate in used:
            candidate += 1
        return candidate

    def _check_number(self, number: int, *, owner: str | None = None) -> None:
        if isinstance(number, bool) or not isinstance(number, int) or number < 1:
            raise InvalidValueError(
                "Eine Nummer muss eine positive ganze Zahl sein (1, 2, 3 …).", number=number
            )
        holder = self.find_by_number(number)
        if holder is not None and holder.id != owner:
            raise NumberTakenError(
                f'Die Nummer {number} ist schon an "{holder.name}" vergeben. '
                f"Wähle eine andere Nummer (nächste freie: {self.next_free_number()}).",
                number=number,
                holder=holder.id,
            )

    def require_active_parent(self, parent_id: str) -> Node:
        """Ziel, in dem etwas abgelegt werden darf (nicht im Papierkorb); sonst Fehler."""
        parent = self.node(parent_id)
        if parent.id == TRASH_ID or self.tree.in_trash(parent.id):
            raise TrashError(
                "Im Papierkorb kann nichts abgelegt werden. Stelle den Eintrag zuerst wieder her."
            )
        return parent

    def _ensure_group(self, parent: Node) -> str | None:
        """Wird ein Ding zum Elternknoten, wird es zur Gruppe (5.2). Liefert einen Hinweis."""
        kind = self.data.kinds[parent.kind]
        if kind.kind_class is not KindClass.ITEM:
            return None
        group = self._group_kind_id()
        if group is None:
            raise InvalidValueError(
                'Es gibt keine Art der Klasse "Gruppe". Lege in den Einstellungen zuerst eine an.'
            )
        parent.kind = group
        parent.modified = self.now()
        return f'"{parent.name}" ist jetzt eine Gruppe, weil es Unterpunkte hat.'

    # ------------------------------------------------------------------ Knoten ------------
    def create_node(
        self,
        name: str,
        kind: str,
        parent: str | None = None,
        *,
        number: NumberArg = None,
        aliases: Iterable[str] = (),
        tags: Iterable[str] = (),
        note: str = "",
        owner: str | None = None,
        quantity: float | None = None,
        unit: str = "",
        min_quantity: float | None = None,
        condition: Condition = Condition.OK,
        fields: Mapping[str, Any] | None = None,
    ) -> Node:
        """Neuen Knoten anlegen. Pflicht sind nur Name und Art (5.4)."""
        name = name.strip()
        if not name:
            raise InvalidValueError("Der Name darf nicht leer sein. Gib dem Eintrag einen Namen.")
        if kind not in self.data.kinds:
            raise NotFoundError(f'Die Art "{kind}" gibt es nicht.', kind=kind)
        if owner is not None and owner not in self.data.persons:
            raise NotFoundError(f'Die Person "{owner}" gibt es nicht.', person=owner)
        for label, value in (("Menge", quantity), ("Mindestbestand", min_quantity)):
            if value is not None and value < 0:
                raise InvalidValueError(f"{label} darf nicht negativ sein.")
        hints: list[str] = []
        parent_node: Node | None = None
        if parent is not None:
            parent_node = self.require_active_parent(parent)
        resolved_number: int | None
        if number == "auto":
            resolved_number = self.next_free_number()
        else:
            resolved_number = number
            if resolved_number is not None:
                self._check_number(resolved_number)
        node = Node(
            id=new_id(self.data.nodes, self.rng),
            name=name,
            kind=kind,
            parent=parent,
            number=resolved_number,
            aliases=_clean_list(aliases),
            tags=_clean_list(tags),
            note=note,
            owner=owner,
            quantity=quantity,
            unit=unit.strip(),
            min_quantity=min_quantity,
            condition=condition,
            created=self.now(),
            modified=self.now(),
        )
        self.data.nodes[node.id] = node
        self._tree = None
        if fields:
            try:
                for fid, value in fields.items():
                    self._set_field(node, fid, value)
            except Exception:
                del self.data.nodes[node.id]
                self._tree = None
                raise
        if parent_node is not None:
            # Erst jetzt, nachdem alles geprüft ist, wird ein Ding zur Gruppe (nichts bleibt halb geändert).
            if (hint := self._ensure_group(parent_node)) is not None:
                hints.append(hint)
            if (hint := unusual_placement(self.data, node, parent_node)) is not None:
                hints.append(hint)
        self._record(
            "create",
            node,
            details={"parent": parent, "kind": kind},
            structure=True,
            hints=hints,
            touched=(node.id, *([parent] if parent else [])),
        )
        return node

    def update_node(self, node_id: str, changes: Mapping[str, Any]) -> Node:
        """Angaben eines Knotens ändern; ``None`` (oder leer) löscht eine freiwillige Angabe."""
        node = self.node(node_id)
        unknown = set(changes) - _UPDATABLE
        if unknown:
            raise InvalidValueError(
                f"Unbekannte Angabe: {', '.join(sorted(unknown))}. Erlaubt sind: "
                f"{', '.join(sorted(_UPDATABLE))}.",
                keys=sorted(unknown),
            )
        if node_id in SYSTEM_IDS and (locked := _SYSTEM_LOCKED & set(changes)):
            raise SystemNodeError(
                f'"{node.name}" ist ein Systemknoten; {", ".join(sorted(locked))} lässt sich nicht ändern.',
                node_id=node_id,
            )
        # Erst alles prüfen und in einem Zwischenstand sammeln, dann übernehmen.
        new: dict[str, Any] = {}
        old: dict[str, Any] = {}
        hints: list[str] = []
        for key, raw in changes.items():
            value: Any = raw
            if key == "name":
                value = str(raw or "").strip()
                if not value:
                    raise InvalidValueError("Der Name darf nicht leer sein.")
            elif key == "kind":
                if raw not in self.data.kinds:
                    raise NotFoundError(f'Die Art "{raw}" gibt es nicht.', kind=raw)
                if self.data.kinds[raw].kind_class is KindClass.ITEM and self.tree.children_ids(node_id):
                    raise InvalidValueError(
                        f'"{node.name}" hat Unterpunkte und kann kein einzelnes Ding sein. '
                        "Wähle eine andere Art (z. B. Gruppe)."
                    )
            elif key == "number":
                if raw is not None:
                    self._check_number(raw, owner=node_id)
            elif key == "owner":
                value = raw or None
                if value is not None and value not in self.data.persons:
                    raise NotFoundError(f'Die Person "{value}" gibt es nicht.', person=value)
            elif key in ("aliases", "tags"):
                value = _clean_list(raw or [])
            elif key in ("quantity", "min_quantity"):
                if raw is not None and (isinstance(raw, bool) or not isinstance(raw, int | float) or raw < 0):
                    raise InvalidValueError("Menge und Mindestbestand müssen Zahlen ab 0 sein.")
            elif key == "condition":
                try:
                    value = Condition(raw)
                except ValueError:
                    raise InvalidValueError(
                        f'Unbekannter Zustand "{raw}". Erlaubt sind: {", ".join(c.value for c in Condition)}.'
                    ) from None
            elif key == "unit":
                value = str(raw or "").strip()
            elif key == "note":
                value = str(raw or "")
            new[key] = value
            old[key] = getattr(node, key)
        effective = {k: v for k, v in new.items() if old[k] != v}
        if not effective:
            return node
        for key, value in effective.items():
            setattr(node, key, value)
        if "kind" in effective and node.parent:
            parent = self.node(node.parent)
            if (hint := unusual_placement(self.data, node, parent)) is not None:
                hints.append(hint)
        node.modified = self.now()
        renamed = bool({"name", "kind", "number", "condition"} & effective.keys())
        touched = tuple(self.tree.subtree_ids(node_id)) if renamed else (node_id,)
        self._record(
            "update",
            node,
            details={
                "changes": {k: _json_value(v) for k, v in effective.items()},
                "old": {k: _json_value(old[k]) for k in effective},
            },
            touched=touched,
            hints=hints,
        )
        return node

    def set_condition(self, node_id: str, condition: Condition) -> Node:
        """Zustand setzen (5.6); ``disposed`` archiviert den Knoten samt Inhalt."""
        return self.update_node(node_id, {"condition": condition})

    # ------------------------------------------------------------------ Verschieben -------
    def move_nodes(self, node_ids: Iterable[str], new_parent: str | None) -> list[Node]:
        """Knoten samt Inhalt verschieben (8.4). Der Inhalt wandert immer mit.

        Alles wird vorab geprüft; bei einem Fehler ändert sich nichts. Ist ein ausgewählter
        Knoten Vorfahre eines anderen ausgewählten, wandert der untere mit ihm (Struktur bleibt).
        """
        ids = list(dict.fromkeys(node_ids))
        if not ids:
            raise InvalidValueError("Es wurde nichts zum Verschieben ausgewählt.")
        target: Node | None = None
        if new_parent is not None:
            target = self.require_active_parent(new_parent)
        selected = set(ids)
        moving: list[Node] = []
        for nid in ids:
            node = self.node(nid)
            if nid in SYSTEM_IDS:
                raise SystemNodeError(
                    f'"{node.name}" ist ein Systemknoten und lässt sich nicht verschieben.',
                    node_id=nid,
                )
            if self.tree.in_trash(nid) or node.parent == TRASH_ID:
                raise TrashError(
                    f'"{node.name}" liegt im Papierkorb. Stelle es zuerst wieder her.', node_id=nid
                )
            ancestors = self.tree.ancestors(nid)
            if any(a in selected for a in ancestors):
                continue  # wandert mit seinem Vorfahren
            if new_parent is not None and (nid == new_parent or nid in self.tree.ancestors(new_parent)):
                raise CycleError(
                    f'"{node.name}" kann nicht in sich selbst oder in einen eigenen Unterpunkt '
                    "verschoben werden.",
                    node_id=nid,
                )
            moving.append(node)
        hints: list[str] = []
        if target is not None and (hint := self._ensure_group(target)) is not None:
            hints.append(hint)
        for node in moving:
            old_path = self.tree.path_names(node.id)
            touched = tuple(self.tree.subtree_ids(node.id))
            node.parent = new_parent
            node_hints = list(hints)
            if target is not None and (h := unusual_placement(self.data, node, target)) is not None:
                node_hints.append(h)
            node.modified = self.now()
            self._tree = None
            self._record(
                "move",
                node,
                details={
                    "from": old_path,
                    "to": self.tree.path_names(node.id),
                    "old_parent": old_path[-2] if len(old_path) > 1 else None,
                },
                touched=touched,
                structure=True,
                hints=node_hints,
            )
            hints = []  # Gruppenhinweis nur einmal
        return moving

    # ------------------------------------------------------------------ Löschen -----------
    def delete_node(self, node_id: str, mode: Literal["trash", "lift"] = "trash") -> Node:
        """Löschen mit Papierkorb (8.5, 5.13).

        ``trash``: Knoten samt Inhalt in den Papierkorb. ``lift``: nur der Knoten kommt in den
        Papierkorb, sein Inhalt rückt eine Ebene nach oben.
        """
        node = self.node(node_id)
        if node_id in SYSTEM_IDS:
            raise SystemNodeError(f'"{node.name}" ist ein Systemknoten und lässt sich nicht löschen.')
        if node.parent == TRASH_ID or self.tree.in_trash(node_id):
            raise TrashError(
                f'"{node.name}" liegt schon im Papierkorb. Zum endgültigen Entfernen nutze '
                '"Endgültig löschen".'
            )
        if mode not in ("trash", "lift"):
            raise InvalidValueError('Der Modus muss "trash" oder "lift" sein.')
        touched = tuple(self.tree.subtree_ids(node_id))
        children = list(self.tree.children_ids(node_id))
        descendants = len(touched) - 1
        old_path = self.tree.path_names(node_id)
        hints: list[str] = []
        if mode == "lift":
            for child_id in children:
                self.data.nodes[child_id].parent = node.parent
                self.data.nodes[child_id].modified = self.now()
            if node.parent is not None and children:
                parent = self.node(node.parent)
                if (hint := self._ensure_group(parent)) is not None:
                    hints.append(hint)
        node.trashed = TrashInfo(at=self.now(), from_parent=node.parent, by=self.actor)
        node.parent = TRASH_ID
        node.modified = self.now()
        self._tree = None
        self._record(
            "delete",
            node,
            details={
                "mode": mode,
                "descendants": descendants,
                "path": old_path,
                "lifted": len(children) if mode == "lift" else 0,
            },
            touched=touched,
            structure=True,
            hints=hints,
        )
        return node

    def restore_node(self, node_id: str) -> Node:
        """Aus dem Papierkorb an den alten Platz zurücklegen, sonst nach „Unsortiert“ (5.13)."""
        node = self.node(node_id)
        if node.parent != TRASH_ID:
            raise TrashError(
                f'"{node.name}" liegt nicht direkt im Papierkorb. Stelle den obersten gelöschten '
                "Eintrag wieder her; sein Inhalt kommt dann mit."
            )
        origin = node.trashed.from_parent if node.trashed else None
        hints: list[str] = []
        destination = UNSORTED_ID
        if (
            origin is not None
            and origin in self.data.nodes
            and origin != TRASH_ID
            and not self.tree.in_trash(origin)
        ):
            destination = origin
        else:
            hints.append("Der alte Platz existiert nicht mehr; der Eintrag liegt jetzt in „Unsortiert“.")
        if (hint := self._ensure_group(self.node(destination))) is not None:
            hints.append(hint)
        node.parent = destination
        node.trashed = None
        node.modified = self.now()
        self._tree = None
        self._record(
            "restore",
            node,
            details={"to": self.tree.path_names(node.id)},
            touched=tuple(self.tree.subtree_ids(node.id)),
            structure=True,
            hints=hints,
        )
        return node

    def purge_node(self, node_id: str) -> int:
        """Einen Eintrag im Papierkorb endgültig entfernen; liefert die Zahl entfernter Knoten."""
        node = self.node(node_id)
        if node.parent != TRASH_ID:
            raise TrashError(
                f'"{node.name}" liegt nicht im Papierkorb. Lösche es zuerst (Papierkorb) und '
                "entferne es dann endgültig."
            )
        return self._purge([node_id])

    def empty_trash(self) -> int:
        """Papierkorb leeren."""
        return self._purge(list(self.tree.children_ids(TRASH_ID)))

    def purge_expired_trash(self) -> int:
        """Einträge entfernen, die länger als ``settings.trash_days`` im Papierkorb liegen."""
        limit = self.clock() - timedelta(days=self.data.settings.trash_days)
        expired: list[str] = []
        for nid in self.tree.children_ids(TRASH_ID):
            info = self.data.nodes[nid].trashed
            if info is None:
                continue
            deleted_at = dates.parse_stamp(info.at)
            if deleted_at.tzinfo is None:
                deleted_at = deleted_at.replace(tzinfo=limit.tzinfo)
            if deleted_at <= limit:
                expired.append(nid)
        return self._purge(expired, action="purge_expired")

    def _purge(self, top_ids: list[str], action: str = "purge") -> int:
        if not top_ids:
            return 0
        removed: set[str] = set()
        names: list[str] = []
        for nid in top_ids:
            names.append(self.data.nodes[nid].name)
            removed.update(self.tree.subtree_ids(nid))
        for nid in removed:
            del self.data.nodes[nid]
        self._tree = None
        # Verweise aufräumen (Regel 5): Listen, lokale Felddefinitionen, Beispielvermerke.
        for plist in self.data.lists.values():
            plist.entries = [e for e in plist.entries if e.node not in removed]
        for fid in [
            f.id
            for f in self.data.fields.values()
            if f.scope.type is ScopeType.LOCAL and f.scope.node in removed
        ]:
            self._drop_field_values(fid)
            del self.data.fields[fid]
        if (sample := self.data.meta.sample) is not None:
            sample.nodes = [n for n in sample.nodes if n not in removed]
        self._record(
            action,
            None,
            details={"count": len(removed), "names": names},
            touched=None,
            structure=True,
        )
        return len(removed)

    # ------------------------------------------------------------------ Felder ------------
    def _drop_field_values(self, field_id: str) -> None:
        for node in self.data.nodes.values():
            node.fields.pop(field_id, None)
        for tpl in self.data.templates.values():
            tpl.fields.pop(field_id, None)

            def strip(children: list[TemplateNode], fid: str = field_id) -> None:
                for child in children:
                    child.fields.pop(fid, None)
                    strip(child.children)

            strip(tpl.children)

    def _set_field(self, node: Node, field_id: str, value: Any) -> None:
        definition = self.data.fields.get(field_id)
        if definition is None:
            raise NotFoundError(f'Das Feld "{field_id}" gibt es nicht.', field=field_id)
        if value is None or value == "":
            node.fields.pop(field_id, None)
            return
        if not field_applies(self.tree, definition, node.id):
            raise InvalidValueError(
                f'Das Feld "{definition.name}" gilt für "{node.name}" nicht. Prüfe Geltungsbereich '
                "und Art des Feldes.",
                field=field_id,
            )
        if error := field_value_error(definition, value):
            raise InvalidValueError(f'Das Feld "{definition.name}" {error}.', field=field_id)
        if definition.type is FieldType.CHOICE and value not in definition.options:
            raise InvalidValueError(
                f'"{value}" steht nicht in der Auswahl von "{definition.name}": '
                f"{', '.join(definition.options)}.",
                field=field_id,
            )
        node.fields[field_id] = value

    def set_field_value(self, node_id: str, field_id: str, value: Any) -> Node:
        """Wert eines eigenen Feldes setzen; ``None`` löscht ihn."""
        node = self.node(node_id)
        old = node.fields.get(field_id)
        self._set_field(node, field_id, value)
        if node.fields.get(field_id) != old:
            node.modified = self.now()
            self._record(
                "field",
                node,
                details={
                    "field": field_id,
                    "old": _json_value(old),
                    "new": _json_value(node.fields.get(field_id)),
                },
            )
        return node

    def add_field_def(
        self,
        name: str,
        type: FieldType,
        *,
        group: str = "",
        scope_node: str | None = None,
        kinds: Iterable[str] = (),
        classes: Iterable[KindClass] = (),
        unit: str = "",
        options: Iterable[str] = (),
        remind_days_before: int | None = None,
        field_id: str | None = None,
    ) -> FieldDef:
        """Neue Felddefinition; mit ``scope_node`` lokal (dieser Knoten und alles darunter)."""
        name = name.strip()
        if not name:
            raise InvalidValueError("Ein Feld braucht einen Namen.")
        kinds = list(kinds)
        classes = list(classes)
        if scope_node is not None:
            self.node(scope_node)
        for kid in kinds:
            if kid not in self.data.kinds:
                raise NotFoundError(f'Die Art "{kid}" gibt es nicht.', kind=kid)
        opts = _clean_list(options)
        if type is FieldType.CHOICE and not opts:
            raise InvalidValueError("Ein Auswahlfeld braucht mindestens eine Option.")
        if remind_days_before is not None and (type is not FieldType.DATE or remind_days_before < 0):
            raise InvalidValueError("Eine Erinnerung (Tage vorher, ab 0) gibt es nur bei Datumsfeldern.")
        fid = field_id or self._unique_key(_slug(name), self.data.fields)
        if fid in self.data.fields:
            raise InvalidValueError(f'Die Feldkennung "{fid}" ist schon vergeben.')
        definition = FieldDef(
            id=fid,
            name=name,
            type=type,
            group=group.strip(),
            scope=FieldScope(ScopeType.LOCAL if scope_node else ScopeType.GLOBAL, scope_node),
            kinds=list(dict.fromkeys(kinds)),
            classes=list(dict.fromkeys(classes)),
            unit=unit.strip(),
            options=opts,
            remind_days_before=remind_days_before,
        )
        self.data.fields[fid] = definition
        self._record("field_def_add", None, details={"field": fid, "name": name}, touched=None)
        return definition

    def update_field_def(self, field_id: str, changes: Mapping[str, Any]) -> FieldDef:
        """Name, Gruppe, Einheit, Optionen, Erinnerung, Einschränkungen oder ``hidden`` ändern."""
        definition = self._field_def(field_id)
        allowed = {
            "name",
            "group",
            "unit",
            "options",
            "remind_days_before",
            "kinds",
            "classes",
            "hidden",
        }
        if unknown := set(changes) - allowed:
            raise InvalidValueError(f"Nicht änderbar: {', '.join(sorted(unknown))}.")
        old = definition.to_dict()
        for key, value in changes.items():
            if key == "name":
                if not str(value).strip():
                    raise InvalidValueError("Ein Feld braucht einen Namen.")
                definition.name = str(value).strip()
            elif key == "options":
                opts = _clean_list(value)
                if definition.type is FieldType.CHOICE and not opts:
                    raise InvalidValueError("Ein Auswahlfeld braucht mindestens eine Option.")
                definition.options = opts
            elif key == "remind_days_before":
                if value is not None and (definition.type is not FieldType.DATE or value < 0):
                    raise InvalidValueError("Eine Erinnerung gibt es nur bei Datumsfeldern (Tage ab 0).")
                definition.remind_days_before = value
            elif key == "kinds":
                for kid in value:
                    if kid not in self.data.kinds:
                        raise NotFoundError(f'Die Art "{kid}" gibt es nicht.', kind=kid)
                definition.kinds = list(dict.fromkeys(value))
            elif key == "classes":
                definition.classes = [KindClass(c) for c in dict.fromkeys(value)]
            elif key == "hidden":
                definition.hidden = bool(value)
            else:
                setattr(definition, key, str(value).strip())
        self._record(
            "field_def_update",
            None,
            details={"field": field_id, "old": old, "new": definition.to_dict()},
            touched=None,
        )
        return definition

    def delete_field_def(self, field_id: str) -> None:
        """Felddefinition samt allen Werten löschen; mitgelieferte lassen sich nur ausblenden."""
        definition = self._field_def(field_id)
        if definition.builtin:
            raise InUseError(
                f'"{definition.name}" ist ein mitgeliefertes Feld und lässt sich nicht löschen. '
                "Blende es stattdessen aus.",
                field=field_id,
            )
        self._drop_field_values(field_id)
        del self.data.fields[field_id]
        self._record(
            "field_def_delete",
            None,
            details={"field": field_id, "name": definition.name},
            touched=None,
        )

    def _field_def(self, field_id: str) -> FieldDef:
        try:
            return self.data.fields[field_id]
        except KeyError:
            raise NotFoundError(f'Das Feld "{field_id}" gibt es nicht.', field=field_id) from None

    # ------------------------------------------------------------------ Arten -------------
    def _unique_key(self, base: str, existing: Mapping[str, Any]) -> str:
        key, i = base, 2
        while key in existing:
            key = f"{base}_{i}"
            i += 1
        return key

    def add_kind(
        self,
        name: str,
        kind_class: KindClass,
        *,
        icon: str = "",
        numbered: bool = False,
        kind_id: str | None = None,
    ) -> Kind:
        """Eigene Art anlegen (z. B. „Schublade“ in der Klasse Möbel)."""
        name = name.strip()
        if not name:
            raise InvalidValueError("Eine Art braucht einen Namen.")
        kid = kind_id or self._unique_key(_slug(name), self.data.kinds)
        if kid in self.data.kinds:
            raise InvalidValueError(f'Die Art-Kennung "{kid}" ist schon vergeben.')
        kind = Kind(kid, name, KindClass(kind_class), icon, numbered)
        self.data.kinds[kid] = kind
        self._record("kind_add", None, details={"kind": kid, "name": name}, touched=())
        return kind

    def update_kind(self, kind_id: str, changes: Mapping[str, Any]) -> Kind:
        kind = self._kind(kind_id)
        if unknown := set(changes) - {"name", "icon", "numbered", "class"}:
            raise InvalidValueError(f"Nicht änderbar: {', '.join(sorted(unknown))}.")
        old = kind.to_dict()
        if "class" in changes:
            new_class = KindClass(changes["class"])
            if new_class is KindClass.ITEM and any(
                n.kind == kind_id and self.tree.children_ids(n.id) for n in self.data.nodes.values()
            ):
                raise InvalidValueError(
                    f'Es gibt "{kind.name}"-Einträge mit Unterpunkten; sie können keine einzelnen Dinge sein.'
                )
            if (
                kind.kind_class is KindClass.GROUP
                and new_class is not KindClass.GROUP
                and not any(
                    k.kind_class is KindClass.GROUP for k in self.data.kinds.values() if k.id != kind_id
                )
            ):
                raise InUseError("Es muss mindestens eine Art der Klasse „Gruppe“ geben.")
            kind.kind_class = new_class
        if "name" in changes:
            if not str(changes["name"]).strip():
                raise InvalidValueError("Eine Art braucht einen Namen.")
            kind.name = str(changes["name"]).strip()
        if "icon" in changes:
            kind.icon = str(changes["icon"] or "")
        if "numbered" in changes:
            kind.numbered = bool(changes["numbered"])
        self._record(
            "kind_update",
            None,
            details={"kind": kind_id, "old": old, "new": kind.to_dict()},
            touched=None,
        )
        return kind

    def delete_kind(self, kind_id: str, replacement: str | None = None) -> None:
        """Art löschen: nur wenn unbenutzt oder mit Ersatz (5.14 Regel 4)."""
        kind = self._kind(kind_id)
        users = [n for n in self.data.nodes.values() if n.kind == kind_id]
        template_use = any(
            t.kind == kind_id or _template_uses_kind(t.children, kind_id)
            for t in self.data.templates.values()
        )
        field_use = any(kind_id in f.kinds for f in self.data.fields.values())
        in_use = bool(users) or template_use or field_use
        if len(self.data.kinds) == 1:
            raise InUseError("Die letzte Art lässt sich nicht löschen.")
        if kind.kind_class is KindClass.GROUP and not any(
            k.kind_class is KindClass.GROUP for k in self.data.kinds.values() if k.id != kind_id
        ):
            raise InUseError("Es muss mindestens eine Art der Klasse „Gruppe“ geben.")
        if in_use:
            if replacement is None:
                raise InUseError(
                    f'Die Art "{kind.name}" wird noch verwendet ({len(users)} Einträge). Gib eine '
                    "Ersatz-Art an, auf die umgestellt wird.",
                    kind=kind_id,
                    count=len(users),
                )
            if replacement == kind_id or replacement not in self.data.kinds:
                raise NotFoundError(f'Die Ersatz-Art "{replacement}" gibt es nicht.', kind=replacement)
            if self.data.kinds[replacement].kind_class is KindClass.ITEM and any(
                self.tree.children_ids(n.id) for n in users
            ):
                raise InvalidValueError(
                    "Die Ersatz-Art ist ein einzelnes Ding, manche Einträge haben aber Unterpunkte."
                )
            for node in users:
                node.kind = replacement
            for tpl in self.data.templates.values():
                if tpl.kind == kind_id:
                    tpl.kind = replacement
                _replace_template_kind(tpl.children, kind_id, replacement)
            for definition in self.data.fields.values():
                if kind_id in definition.kinds:
                    definition.kinds = list(
                        dict.fromkeys(replacement if k == kind_id else k for k in definition.kinds)
                    )
        del self.data.kinds[kind_id]
        self._record(
            "kind_delete",
            None,
            details={"kind": kind_id, "name": kind.name, "replacement": replacement},
            touched=None,
        )

    def _kind(self, kind_id: str) -> Kind:
        try:
            return self.data.kinds[kind_id]
        except KeyError:
            raise NotFoundError(f'Die Art "{kind_id}" gibt es nicht.', kind=kind_id) from None

    # ------------------------------------------------------------------ Personen ----------
    def add_person(self, name: str, ha_person: str | None = None, person_id: str | None = None) -> Person:
        name = name.strip()
        if not name:
            raise InvalidValueError("Eine Person braucht einen Namen.")
        pid = person_id or self._unique_key(_slug(name), self.data.persons)
        if pid in self.data.persons:
            raise InvalidValueError(f'Die Personen-Kennung "{pid}" ist schon vergeben.')
        person = Person(pid, name, ha_person or None)
        self.data.persons[pid] = person
        self._record("person_add", None, details={"person": pid, "name": name}, touched=())
        return person

    def update_person(self, person_id: str, changes: Mapping[str, Any]) -> Person:
        person = self._person(person_id)
        if unknown := set(changes) - {"name", "ha_person"}:
            raise InvalidValueError(f"Nicht änderbar: {', '.join(sorted(unknown))}.")
        if "name" in changes:
            if not str(changes["name"]).strip():
                raise InvalidValueError("Eine Person braucht einen Namen.")
            person.name = str(changes["name"]).strip()
        if "ha_person" in changes:
            person.ha_person = changes["ha_person"] or None
        self._record("person_update", None, details={"person": person_id}, touched=())
        return person

    def delete_person(self, person_id: str) -> int:
        """Person löschen; die Zuordnung zu Knoten und Vorlagen entfällt (5.14 Regel 4)."""
        person = self._person(person_id)
        affected = [n for n in self.data.nodes.values() if n.owner == person_id]
        for node in affected:
            node.owner = None
        for tpl in self.data.templates.values():
            if tpl.owner == person_id:
                tpl.owner = None
        del self.data.persons[person_id]
        self._record(
            "person_delete",
            None,
            details={"person": person_id, "name": person.name, "cleared": len(affected)},
            touched=None,
        )
        return len(affected)

    def _person(self, person_id: str) -> Person:
        try:
            return self.data.persons[person_id]
        except KeyError:
            raise NotFoundError(f'Die Person "{person_id}" gibt es nicht.', person=person_id) from None

    # ------------------------------------------------------------------ Entnahme ----------
    def checkout_node(
        self,
        node_id: str,
        checkout_type: CheckoutType,
        to: str,
        *,
        since: str | None = None,
        until: str | None = None,
        note: str = "",
    ) -> Node:
        """Ausleihen (``lent``) oder entnehmen/auslagern (``out``); der Stammplatz bleibt (5.7)."""
        node = self.node(node_id)
        if node_id in SYSTEM_IDS:
            raise SystemNodeError("Systemknoten lassen sich nicht entnehmen.")
        to = to.strip()
        if not to:
            raise InvalidValueError("Gib an, an wen es ausgeliehen wurde bzw. wo es gerade ist.")
        since = since or self.today().isoformat()
        for label, value in (("seit", since), ("bis", until)):
            if value is not None and not is_iso_date(value):
                raise InvalidValueError(f'"{label}" muss ein Datum der Form JJJJ-MM-TT sein.')
        if until is not None and until < since:
            raise InvalidValueError('Das Rückgabedatum liegt vor dem Beginn ("bis" vor "seit").')
        node.checkout = Checkout(CheckoutType(checkout_type), to, since, until, note.strip())
        node.modified = self.now()
        self._record("checkout", node, details=node.checkout.to_dict())
        return node

    def return_node(self, node_id: str) -> Node:
        """Zurücklegen: die Entnahme endet, der Stammplatz war nie verloren."""
        node = self.node(node_id)
        if node.checkout is None:
            raise InvalidValueError(f'"{node.name}" ist gar nicht entnommen.')
        previous = node.checkout.to_dict()
        node.checkout = None
        node.modified = self.now()
        self._record("return", node, details={"was": previous})
        return node

    # ------------------------------------------------------------------ Menge -------------
    def set_quantity(self, node_id: str, quantity: float | None) -> Node:
        return self.update_node(node_id, {"quantity": quantity})

    def adjust_quantity(self, node_id: str, delta: float) -> Node:
        """Menge um ``delta`` ändern (Plus-/Minus-Knopf); sie sinkt nie unter 0 (8.7)."""
        node = self.node(node_id)
        current = node.quantity if node.quantity is not None else 0
        return self.update_node(node_id, {"quantity": max(0, current + delta)})

    # ------------------------------------------------------------------ Wartung -----------
    def add_maintenance(
        self,
        node_id: str,
        title: str,
        *,
        interval: Interval | None = None,
        next_due: str | None = None,
        note: str = "",
    ) -> MaintenanceTask:
        node = self.node(node_id)
        title = title.strip()
        if not title:
            raise InvalidValueError("Eine Wartungsaufgabe braucht einen Titel.")
        if next_due is not None and not is_iso_date(next_due):
            raise InvalidValueError('"Nächste Fälligkeit" muss ein Datum der Form JJJJ-MM-TT sein.')
        if interval is not None and interval.value < 1:
            raise InvalidValueError("Das Intervall muss mindestens 1 sein.")
        task = MaintenanceTask(
            new_id({t.id for t in node.maintenance}, self.rng), title, interval, next_due, note
        )
        node.maintenance.append(task)
        node.modified = self.now()
        self._record("maintenance_add", node, details={"task": task.id, "title": title})
        return task

    def _task(self, node: Node, task_id: str) -> MaintenanceTask:
        for task in node.maintenance:
            if task.id == task_id:
                return task
        raise NotFoundError(f'Die Wartungsaufgabe "{task_id}" gibt es bei "{node.name}" nicht.', task=task_id)

    def update_maintenance(self, node_id: str, task_id: str, changes: Mapping[str, Any]) -> MaintenanceTask:
        node = self.node(node_id)
        task = self._task(node, task_id)
        if unknown := set(changes) - {"title", "interval", "next_due", "note"}:
            raise InvalidValueError(f"Nicht änderbar: {', '.join(sorted(unknown))}.")
        if "title" in changes:
            if not str(changes["title"]).strip():
                raise InvalidValueError("Eine Wartungsaufgabe braucht einen Titel.")
            task.title = str(changes["title"]).strip()
        if "interval" in changes:
            interval = changes["interval"]
            if interval is not None and not isinstance(interval, Interval):
                interval = Interval(int(interval["value"]), IntervalUnit(interval["unit"]))
            if interval is not None and interval.value < 1:
                raise InvalidValueError("Das Intervall muss mindestens 1 sein.")
            task.interval = interval
        if "next_due" in changes:
            if changes["next_due"] is not None and not is_iso_date(changes["next_due"]):
                raise InvalidValueError('"Nächste Fälligkeit" muss ein Datum der Form JJJJ-MM-TT sein.')
            task.next_due = changes["next_due"]
        if "note" in changes:
            task.note = str(changes["note"] or "")
        node.modified = self.now()
        self._record("maintenance_update", node, details={"task": task_id})
        return task

    def remove_maintenance(self, node_id: str, task_id: str) -> None:
        node = self.node(node_id)
        task = self._task(node, task_id)
        node.maintenance.remove(task)
        node.modified = self.now()
        self._record("maintenance_remove", node, details={"task": task_id, "title": task.title})

    def complete_maintenance(
        self, node_id: str, task_id: str, *, on: str | None = None, note: str = ""
    ) -> MaintenanceTask:
        """Erledigt: Protokolleintrag; mit Intervall wird die nächste Fälligkeit berechnet (5.9)."""
        node = self.node(node_id)
        task = self._task(node, task_id)
        done = on or self.today().isoformat()
        if not is_iso_date(done):
            raise InvalidValueError("Das Datum muss die Form JJJJ-MM-TT haben.")
        task.log.append(LogEntry(done, note.strip()))
        task.next_due = (
            dates.add_interval(dates.to_date(done), task.interval).isoformat() if task.interval else None
        )
        node.modified = self.now()
        self._record(
            "maintenance_done",
            node,
            details={"task": task_id, "date": done, "next_due": task.next_due},
        )
        return task

    # ------------------------------------------------------------------ Inventur ----------
    def verify_nodes(self, node_ids: Iterable[str]) -> int:
        """Bei der Inventur als vorhanden bestätigt: Datum der Prüfung setzen (8.9).

        War ein Knoten als „vermisst“ markiert, gilt er damit wieder als ``ok``.
        """
        ids = list(dict.fromkeys(node_ids))
        nodes = [self.node(i) for i in ids]
        stamp = self.now()
        for node in nodes:
            node.verified = stamp
            if node.condition is Condition.MISSING:
                node.condition = Condition.OK
            node.modified = stamp
        if nodes:
            self._record(
                "verify",
                None,
                details={"count": len(nodes), "nodes": ids},
                touched=tuple(ids),
            )
        return len(nodes)

    def mark_missing(self, node_ids: Iterable[str]) -> int:
        """Bei der Inventur nicht gefunden: Zustand „vermisst“ (8.9)."""
        ids = list(dict.fromkeys(node_ids))
        nodes = [self.node(i) for i in ids]
        for node in nodes:
            node.condition = Condition.MISSING
            node.modified = self.now()
        if nodes:
            self._record(
                "mark_missing",
                None,
                details={"count": len(nodes), "nodes": ids},
                touched=tuple(ids),
            )
        return len(nodes)

    def apply_stocktake(self, results: Mapping[str, Literal["present", "missing"]]) -> tuple[int, int]:
        """Ergebnis einer Inventur übernehmen: ``(bestätigt, vermisst)``. „Woanders“ ist ein Verschieben."""
        present = [i for i, r in results.items() if r == "present"]
        missing = [i for i, r in results.items() if r == "missing"]
        bad = [r for r in results.values() if r not in ("present", "missing")]
        if bad:
            raise InvalidValueError('Das Ergebnis muss "present" oder "missing" sein.')
        for nid in [*present, *missing]:
            self.node(nid)
        return self.verify_nodes(present), self.mark_missing(missing)

    # ------------------------------------------------------------------ Listen ------------
    def create_list(self, name: str) -> PackList:
        name = name.strip()
        if not name:
            raise InvalidValueError("Eine Liste braucht einen Namen.")
        plist = PackList(new_id(self.data.lists, self.rng), name)
        self.data.lists[plist.id] = plist
        self._record("list_create", None, details={"list": plist.id, "name": name}, touched=())
        return plist

    def get_list(self, list_id: str) -> PackList:
        try:
            return self.data.lists[list_id]
        except KeyError:
            raise NotFoundError(f'Die Liste "{list_id}" gibt es nicht.', list=list_id) from None

    def rename_list(self, list_id: str, name: str) -> PackList:
        plist = self.get_list(list_id)
        if not name.strip():
            raise InvalidValueError("Eine Liste braucht einen Namen.")
        plist.name = name.strip()
        self._record("list_rename", None, details={"list": list_id, "name": plist.name}, touched=())
        return plist

    def delete_list(self, list_id: str) -> None:
        plist = self.get_list(list_id)
        del self.data.lists[list_id]
        self._record("list_delete", None, details={"list": list_id, "name": plist.name}, touched=())

    def add_list_entry(
        self,
        list_id: str,
        *,
        node: str | None = None,
        text: str = "",
        quantity: float | None = None,
        note: str = "",
    ) -> ListEntry:
        """Eintrag als Verweis auf einen Knoten oder als freier Text (5.10)."""
        plist = self.get_list(list_id)
        text = text.strip()
        if (node is None) == (not text):
            raise InvalidValueError("Ein Listeneintrag braucht entweder einen Knoten oder einen Text.")
        if node is not None:
            self.node(node)
        entry = ListEntry(new_id({e.id for e in plist.entries}, self.rng), node, text, quantity, note.strip())
        plist.entries.append(entry)
        self._record("list_entry_add", None, details={"list": list_id, "entry": entry.id}, touched=())
        return entry

    def _entry(self, plist: PackList, entry_id: str) -> ListEntry:
        for entry in plist.entries:
            if entry.id == entry_id:
                return entry
        raise NotFoundError(f'Den Listeneintrag "{entry_id}" gibt es nicht.', entry=entry_id)

    def update_list_entry(self, list_id: str, entry_id: str, changes: Mapping[str, Any]) -> ListEntry:
        plist = self.get_list(list_id)
        entry = self._entry(plist, entry_id)
        if unknown := set(changes) - {"text", "quantity", "note", "checked"}:
            raise InvalidValueError(f"Nicht änderbar: {', '.join(sorted(unknown))}.")
        if "text" in changes:
            if entry.node is not None:
                raise InvalidValueError("Bei einem Verweis auf einen Knoten gibt es keinen eigenen Text.")
            if not str(changes["text"]).strip():
                raise InvalidValueError("Der Text darf nicht leer sein.")
            entry.text = str(changes["text"]).strip()
        if "quantity" in changes:
            entry.quantity = changes["quantity"]
        if "note" in changes:
            entry.note = str(changes["note"] or "").strip()
        if "checked" in changes:
            entry.checked = bool(changes["checked"])
        self._record("list_entry_update", None, details={"list": list_id, "entry": entry_id}, touched=())
        return entry

    def remove_list_entry(self, list_id: str, entry_id: str) -> None:
        plist = self.get_list(list_id)
        plist.entries.remove(self._entry(plist, entry_id))
        self._record("list_entry_remove", None, details={"list": list_id, "entry": entry_id}, touched=())

    def reset_list(self, list_id: str) -> int:
        """Alle Haken zurücksetzen (5.10)."""
        plist = self.get_list(list_id)
        count = sum(1 for e in plist.entries if e.checked)
        for entry in plist.entries:
            entry.checked = False
        self._record("list_reset", None, details={"list": list_id, "count": count}, touched=())
        return count

    def list_grouped(self, list_id: str) -> list[ListGroup]:
        """Listenansicht nach Lagerort gruppiert: Raum für Raum zusammensuchen (5.10).

        Gruppiert wird nach dem nächsten Vorfahren der Klasse „Ort“ (Raum). Einträge ohne Ort
        (freier Text, Dinge ohne Raum) stehen am Ende.
        """
        plist = self.get_list(list_id)
        tree = self.tree
        groups: dict[str | None, ListGroup] = {}
        for entry in plist.entries:
            place: str | None = None
            if entry.node is not None:
                for ancestor in [entry.node, *tree.ancestors(entry.node)]:
                    if self.data.kinds[self.data.nodes[ancestor].kind].kind_class is KindClass.PLACE:
                        place = ancestor
                        break
            group = groups.get(place)
            if group is None:
                name = self.data.nodes[place].name if place else "Ohne Ort"
                group = groups[place] = ListGroup(place, name)
            group.entries.append(entry)
        ordered = sorted(
            (g for g in groups.values() if g.place_id is not None),
            key=lambda g: g.place_name.casefold(),
        )
        if None in groups:
            ordered.append(groups[None])
        return ordered

    # ------------------------------------------------------------------ Vorlagen ----------
    def add_template(
        self,
        name: str,
        kind: str,
        *,
        tags: Iterable[str] = (),
        owner: str | None = None,
        fields: Mapping[str, Any] | None = None,
        children: Iterable[TemplateNode] = (),
    ) -> Template:
        name = name.strip()
        if not name:
            raise InvalidValueError("Eine Vorlage braucht einen Namen.")
        if kind not in self.data.kinds:
            raise NotFoundError(f'Die Art "{kind}" gibt es nicht.', kind=kind)
        if owner is not None and owner not in self.data.persons:
            raise NotFoundError(f'Die Person "{owner}" gibt es nicht.', person=owner)
        child_list = list(children)
        if bad := _template_unknown_kind(child_list, self.data.kinds):
            raise NotFoundError(f'Die Art "{bad}" in der Vorlage gibt es nicht.', kind=bad)
        tpl = Template(
            new_id(self.data.templates, self.rng),
            name,
            kind,
            _clean_list(tags),
            owner,
            dict(fields or {}),
            child_list,
        )
        self.data.templates[tpl.id] = tpl
        self._record("template_add", None, details={"template": tpl.id, "name": name}, touched=())
        return tpl

    def delete_template(self, template_id: str) -> None:
        tpl = self._template(template_id)
        del self.data.templates[template_id]
        self._record("template_delete", None, details={"template": template_id, "name": tpl.name}, touched=())

    def _template(self, template_id: str) -> Template:
        try:
            return self.data.templates[template_id]
        except KeyError:
            raise NotFoundError(f'Die Vorlage "{template_id}" gibt es nicht.', template=template_id) from None

    def create_from_template(
        self,
        template_id: str,
        parent: str | None,
        name: str | None = None,
        *,
        number: NumberArg = None,
    ) -> Node:
        """Neuen Knoten samt vorgegebener Unterpunkte aus einer Vorlage anlegen (8.2)."""
        tpl = self._template(template_id)
        kind = self.data.kinds[tpl.kind]
        if number is None and kind.numbered:
            number = "auto"
        before = set(self.data.nodes)
        try:
            root = self.create_node(
                name or tpl.name,
                tpl.kind,
                parent,
                number=number,
                tags=tpl.tags,
                owner=tpl.owner,
                fields=tpl.fields,
            )
            self._instantiate_children(root, tpl.children)
        except Exception:
            self._discard_nodes(set(self.data.nodes) - before)
            raise
        return root

    def _discard_nodes(self, node_ids: set[str]) -> None:
        """Halb angelegte Knoten wieder entfernen (nur nach einem Fehler in einer Sammel-Operation)."""
        if not node_ids:
            return
        for nid in node_ids:
            self.data.nodes.pop(nid, None)
        self._changes = [c for c in self._changes if c.node_id not in node_ids]
        self._tree = None
        self.revision += 1
        rollback = Change("rollback", self.now(), touched=None, structure=True)
        for listener in self._listeners:
            listener(rollback)

    def _instantiate_children(self, parent: Node, children: list[TemplateNode]) -> None:
        for child in children:
            node = self.create_node(
                child.name,
                child.kind,
                parent.id,
                tags=child.tags,
                quantity=child.quantity,
                unit=child.unit,
                fields=child.fields,
            )
            self._instantiate_children(node, child.children)

    # ------------------------------------------------------------------ Synonyme ----------
    def set_synonyms(self, groups: Iterable[Iterable[str]]) -> list[list[str]]:
        """Globale Synonymgruppen ersetzen (5.12); Gruppen mit weniger als zwei Begriffen entfallen."""
        cleaned = [g for g in (_clean_list(group) for group in groups) if len(g) >= 2]
        self.data.synonyms = cleaned
        self._record("synonyms", None, details={"groups": len(cleaned)}, touched=None)
        return cleaned

    # ------------------------------------------------------------------ Einstellungen -----
    def update_settings(self, **changes: int) -> None:
        allowed = {"lent_days", "stale_days", "trash_days"}
        if unknown := set(changes) - allowed:
            raise InvalidValueError(f"Unbekannte Einstellung: {', '.join(sorted(unknown))}.")
        for key, value in changes.items():
            if isinstance(value, bool) or not isinstance(value, int) or value < 1:
                raise InvalidValueError(f"{key} muss eine ganze Zahl ab 1 sein.")
            setattr(self.data.settings, key, value)
        self._record("settings", None, details=dict(changes), touched=())


def _json_value(value: Any) -> Any:
    """Werte für das Protokoll in JSON-taugliche Form bringen."""
    if hasattr(value, "value") and not isinstance(value, bool | int | float | str):
        return value.value
    if hasattr(value, "to_dict"):
        return value.to_dict()
    return value


def _template_uses_kind(children: list[TemplateNode], kind_id: str) -> bool:
    return any(c.kind == kind_id or _template_uses_kind(c.children, kind_id) for c in children)


def _replace_template_kind(children: list[TemplateNode], old: str, new: str) -> None:
    for child in children:
        if child.kind == old:
            child.kind = new
        _replace_template_kind(child.children, old, new)


def _template_unknown_kind(children: list[TemplateNode], kinds: Mapping[str, Kind]) -> str | None:
    for child in children:
        if child.kind not in kinds:
            return child.kind
        if (bad := _template_unknown_kind(child.children, kinds)) is not None:
            return bad
    return None
