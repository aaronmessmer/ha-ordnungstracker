"""Datenmodell des Inventars (Pflichtenheft 5 und 6.2).

Alles ist ein Knoten (``Node``) in einem Baum. Die Datei hält die Knoten flach in einem
Objekt und verweist über ``parent``. ``to_dict`` der Klassen liefert genau die Darstellung
der Datei: stabile Schlüsselreihenfolge, nur Angaben, die vom Standard abweichen.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

SCHEMA_VERSION = 1

UNSORTED_ID = "unsortiert"
TRASH_ID = "papierkorb"
SYSTEM_IDS: frozenset[str] = frozenset({UNSORTED_ID, TRASH_ID})
DEFAULT_ROOM_KIND = "raum"


class KindClass(StrEnum):
    """Fünf fest verankerte Klassen, damit die Logik weiß, womit sie es zu tun hat."""

    PLACE = "place"
    FURNITURE = "furniture"
    CONTAINER = "container"
    GROUP = "group"
    ITEM = "item"


# Klassen, die "Ort oder Behälter" sind (bei der Anzeige zuerst, nach Nummer sortiert).
PLACE_LIKE_CLASSES: frozenset[KindClass] = frozenset(
    {KindClass.PLACE, KindClass.FURNITURE, KindClass.CONTAINER}
)


class Condition(StrEnum):
    """Zustand eines Knotens (5.6)."""

    OK = "ok"
    MISSING = "missing"
    DEFECTIVE = "defective"
    TO_SELL = "to_sell"
    TO_GIVE_AWAY = "to_give_away"
    DISPOSED = "disposed"


class CheckoutType(StrEnum):
    """Art der Entnahme (5.7)."""

    LENT = "lent"
    OUT = "out"


class FieldType(StrEnum):
    """Typ eines eigenen Feldes (5.8)."""

    TEXT = "text"
    MULTILINE = "multiline"
    NUMBER = "number"
    DATE = "date"
    BOOL = "bool"
    CHOICE = "choice"
    LINK = "link"


class IntervalUnit(StrEnum):
    """Einheit eines Wartungsintervalls (5.9)."""

    DAYS = "days"
    WEEKS = "weeks"
    MONTHS = "months"
    YEARS = "years"


class ScopeType(StrEnum):
    """Geltungsbereich einer Felddefinition."""

    GLOBAL = "global"
    LOCAL = "local"


def _num(value: float) -> int | float:
    """Ganze Zahlen ohne Nachkommastellen ausgeben (``3`` statt ``3.0``)."""
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value


@dataclass(slots=True)
class Kind:
    """Eine Art (z. B. Kiste); gehört zu einer der fünf Klassen."""

    id: str
    name: str
    kind_class: KindClass
    icon: str = ""
    numbered: bool = False

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {"id": self.id, "name": self.name, "class": self.kind_class.value}
        if self.icon:
            d["icon"] = self.icon
        if self.numbered:
            d["numbered"] = True
        return d


@dataclass(slots=True)
class Person:
    """Person im Inventar, wahlweise mit ``person``-Entität von Home Assistant verknüpft."""

    id: str
    name: str
    ha_person: str | None = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {"id": self.id, "name": self.name}
        if self.ha_person:
            d["ha_person"] = self.ha_person
        return d


@dataclass(slots=True)
class FieldScope:
    """Geltungsbereich: ``global`` oder ``local`` (ein Knoten und alles darunter)."""

    type: ScopeType = ScopeType.GLOBAL
    node: str | None = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {"type": self.type.value}
        if self.node is not None:
            d["node"] = self.node
        return d


@dataclass(slots=True)
class FieldDef:
    """Definition eines eigenen Feldes (5.8)."""

    id: str
    name: str
    type: FieldType
    group: str = ""
    scope: FieldScope = field(default_factory=FieldScope)
    kinds: list[str] = field(default_factory=list)
    classes: list[KindClass] = field(default_factory=list)
    unit: str = ""
    options: list[str] = field(default_factory=list)
    remind_days_before: int | None = None
    builtin: bool = False
    hidden: bool = False

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {"id": self.id, "name": self.name, "type": self.type.value}
        if self.group:
            d["group"] = self.group
        d["scope"] = self.scope.to_dict()
        if self.kinds:
            d["kinds"] = list(self.kinds)
        if self.classes:
            d["classes"] = [c.value for c in self.classes]
        if self.unit:
            d["unit"] = self.unit
        if self.options:
            d["options"] = list(self.options)
        if self.remind_days_before is not None:
            d["remind_days_before"] = self.remind_days_before
        if self.builtin:
            d["builtin"] = True
        if self.hidden:
            d["hidden"] = True
        return d


@dataclass(slots=True)
class Checkout:
    """Entnahme: ausgeliehen (``lent``) oder ausgelagert (``out``), Stammplatz bleibt (5.7)."""

    type: CheckoutType
    to: str
    since: str
    until: str | None = None
    note: str = ""
    no_reminder: bool = False  # Langzeit-Ausleihe: nicht an die Rückgabe erinnern

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {"type": self.type.value, "to": self.to, "since": self.since}
        if self.until:
            d["until"] = self.until
        if self.note:
            d["note"] = self.note
        if self.no_reminder:
            d["no_reminder"] = True
        return d


@dataclass(slots=True)
class Interval:
    """Wartungsintervall, z. B. 6 Monate."""

    value: int
    unit: IntervalUnit

    def to_dict(self) -> dict[str, Any]:
        return {"value": self.value, "unit": self.unit.value}


@dataclass(slots=True)
class LogEntry:
    """Erledigungsprotokoll einer Wartungsaufgabe."""

    date: str
    note: str = ""

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {"date": self.date}
        if self.note:
            d["note"] = self.note
        return d


@dataclass(slots=True)
class MaintenanceTask:
    """Wartungsaufgabe eines Knotens (5.9)."""

    id: str
    title: str
    interval: Interval | None = None
    next_due: str | None = None
    note: str = ""
    log: list[LogEntry] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {"id": self.id, "title": self.title}
        if self.interval is not None:
            d["interval"] = self.interval.to_dict()
        if self.next_due:
            d["next_due"] = self.next_due
        if self.note:
            d["note"] = self.note
        if self.log:
            d["log"] = [e.to_dict() for e in self.log]
        return d


@dataclass(slots=True)
class TrashInfo:
    """Vermerk am obersten gelöschten Knoten im Papierkorb (5.13)."""

    at: str
    from_parent: str | None = None
    by: str = ""

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {"at": self.at}
        if self.from_parent:
            d["from"] = self.from_parent
        if self.by:
            d["by"] = self.by
        return d


@dataclass(slots=True)
class Node:
    """Ein Knoten im Baum: Raum, Regal, Kiste, Gruppe oder Ding (5.1, 5.4)."""

    id: str
    name: str
    kind: str
    parent: str | None = None
    number: int | None = None
    aliases: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    note: str = ""
    owner: str | None = None
    quantity: float | None = None
    unit: str = ""
    min_quantity: float | None = None
    condition: Condition = Condition.OK
    checkout: Checkout | None = None
    fields: dict[str, Any] = field(default_factory=dict)
    maintenance: list[MaintenanceTask] = field(default_factory=list)
    attachments: list[dict[str, Any]] = field(default_factory=list)
    created: str = ""
    modified: str = ""
    verified: str = ""
    trashed: TrashInfo | None = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {"name": self.name, "kind": self.kind}
        if self.parent:
            d["parent"] = self.parent
        if self.number is not None:
            d["number"] = self.number
        if self.aliases:
            d["aliases"] = list(self.aliases)
        if self.tags:
            d["tags"] = list(self.tags)
        if self.note:
            d["note"] = self.note
        if self.owner:
            d["owner"] = self.owner
        if self.quantity is not None:
            d["quantity"] = _num(self.quantity)
        if self.unit:
            d["unit"] = self.unit
        if self.min_quantity is not None:
            d["min_quantity"] = _num(self.min_quantity)
        if self.condition is not Condition.OK:
            d["condition"] = self.condition.value
        if self.checkout is not None:
            d["checkout"] = self.checkout.to_dict()
        if self.fields:
            d["fields"] = dict(self.fields)
        if self.maintenance:
            d["maintenance"] = [m.to_dict() for m in self.maintenance]
        if self.attachments:
            d["attachments"] = [dict(a) for a in self.attachments]
        if self.created:
            d["created"] = self.created
        if self.modified:
            d["modified"] = self.modified
        if self.verified:
            d["verified"] = self.verified
        if self.trashed is not None:
            d["trashed"] = self.trashed.to_dict()
        return d


@dataclass(slots=True)
class TemplateNode:
    """Vorgegebener Unterpunkt einer Vorlage."""

    name: str
    kind: str
    tags: list[str] = field(default_factory=list)
    quantity: float | None = None
    unit: str = ""
    fields: dict[str, Any] = field(default_factory=dict)
    children: list[TemplateNode] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {"name": self.name, "kind": self.kind}
        if self.tags:
            d["tags"] = list(self.tags)
        if self.quantity is not None:
            d["quantity"] = _num(self.quantity)
        if self.unit:
            d["unit"] = self.unit
        if self.fields:
            d["fields"] = dict(self.fields)
        if self.children:
            d["children"] = [c.to_dict() for c in self.children]
        return d


@dataclass(slots=True)
class Template:
    """Voreinstellung für neue Knoten (5.11)."""

    id: str
    name: str
    kind: str
    tags: list[str] = field(default_factory=list)
    owner: str | None = None
    fields: dict[str, Any] = field(default_factory=dict)
    children: list[TemplateNode] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {"id": self.id, "name": self.name, "kind": self.kind}
        if self.tags:
            d["tags"] = list(self.tags)
        if self.owner:
            d["owner"] = self.owner
        if self.fields:
            d["fields"] = dict(self.fields)
        if self.children:
            d["children"] = [c.to_dict() for c in self.children]
        return d


@dataclass(slots=True)
class ListEntry:
    """Eintrag einer Liste: Verweis auf einen Knoten oder freier Text (5.10)."""

    id: str
    node: str | None = None
    text: str = ""
    quantity: float | None = None
    note: str = ""
    checked: bool = False

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {"id": self.id}
        if self.node:
            d["node"] = self.node
        if self.text:
            d["text"] = self.text
        if self.quantity is not None:
            d["quantity"] = _num(self.quantity)
        if self.note:
            d["note"] = self.note
        if self.checked:
            d["checked"] = True
        return d


@dataclass(slots=True)
class PackList:
    """Benannte Sammlung quer zum Baum (Packliste, Set)."""

    id: str
    name: str
    entries: list[ListEntry] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {"id": self.id, "name": self.name}
        if self.entries:
            d["entries"] = [e.to_dict() for e in self.entries]
        return d


DEFAULT_LENT_DAYS = 30
DEFAULT_STALE_DAYS = 365
DEFAULT_TRASH_DAYS = 30


@dataclass(slots=True)
class Settings:
    """Einstellungen, die zum Inventar gehören (Schwellen für Erinnerungen und Papierkorb)."""

    lent_days: int = DEFAULT_LENT_DAYS
    stale_days: int = DEFAULT_STALE_DAYS
    trash_days: int = DEFAULT_TRASH_DAYS

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {}
        if self.lent_days != DEFAULT_LENT_DAYS:
            d["lent_days"] = self.lent_days
        if self.stale_days != DEFAULT_STALE_DAYS:
            d["stale_days"] = self.stale_days
        if self.trash_days != DEFAULT_TRASH_DAYS:
            d["trash_days"] = self.trash_days
        return d


@dataclass(slots=True)
class SampleInfo:
    """Merkt sich, was zu den Beispieldaten gehört, damit sie wieder entfernt werden können."""

    nodes: list[str] = field(default_factory=list)
    persons: list[str] = field(default_factory=list)
    templates: list[str] = field(default_factory=list)
    lists: list[str] = field(default_factory=list)
    synonyms: list[list[str]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {}
        for key in ("nodes", "persons", "templates", "lists"):
            value = getattr(self, key)
            if value:
                d[key] = list(value)
        if self.synonyms:
            d["synonyms"] = [list(g) for g in self.synonyms]
        return d


@dataclass(slots=True)
class Meta:
    """Kopfdaten der Datei."""

    created: str = ""
    modified: str = ""
    sample: SampleInfo | None = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {}
        if self.created:
            d["created"] = self.created
        if self.modified:
            d["modified"] = self.modified
        if self.sample is not None:
            d["sample"] = self.sample.to_dict()
        return d


@dataclass(slots=True)
class InventoryData:
    """Der gesamte Inhalt von ``inventar.json``."""

    schema_version: int = SCHEMA_VERSION
    meta: Meta = field(default_factory=Meta)
    settings: Settings = field(default_factory=Settings)
    kinds: dict[str, Kind] = field(default_factory=dict)
    persons: dict[str, Person] = field(default_factory=dict)
    fields: dict[str, FieldDef] = field(default_factory=dict)
    synonyms: list[list[str]] = field(default_factory=list)
    templates: dict[str, Template] = field(default_factory=dict)
    lists: dict[str, PackList] = field(default_factory=dict)
    nodes: dict[str, Node] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Darstellung wie in der Datei (Pflichtenheft 6.2)."""
        d: dict[str, Any] = {"schema_version": self.schema_version, "meta": self.meta.to_dict()}
        settings = self.settings.to_dict()
        if settings:
            d["settings"] = settings
        d["kinds"] = [k.to_dict() for k in self.kinds.values()]
        d["persons"] = [p.to_dict() for p in self.persons.values()]
        d["fields"] = [f.to_dict() for f in self.fields.values()]
        d["synonyms"] = [list(g) for g in self.synonyms]
        d["templates"] = [t.to_dict() for t in self.templates.values()]
        d["lists"] = [lst.to_dict() for lst in self.lists.values()]
        d["nodes"] = {nid: n.to_dict() for nid, n in self.nodes.items()}
        return d
