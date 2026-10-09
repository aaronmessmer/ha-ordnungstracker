"""Einlesen der Inventardatei: aus rohem JSON wird ``InventoryData``.

Der Parser bricht beim ersten Fehler nicht ab, sondern sammelt alle Befunde (``Problem``) mit
Knotenname und Klartext, damit die Reparaturmeldung in Home Assistant genau sagen kann, was
in der Datei nicht stimmt (Pflichtenheft 6.3). Unbekannte Schlüssel gelten als Fehler: Ein
Tippfehler wie ``numer`` würde sonst stillschweigend Daten verlieren.
"""

from __future__ import annotations

import re
from datetime import date, datetime
from enum import StrEnum
from typing import Any, TypeVar

from .errors import Problem
from .model import (
    SCHEMA_VERSION,
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
    Meta,
    Node,
    PackList,
    Person,
    SampleInfo,
    ScopeType,
    Settings,
    Template,
    TemplateNode,
    TrashInfo,
)

_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
E = TypeVar("E", bound=StrEnum)

_NODE_KEYS = {
    "name", "kind", "parent", "number", "aliases", "tags", "note", "owner", "quantity", "unit",
    "min_quantity", "condition", "checkout", "fields", "maintenance", "attachments", "created",
    "modified", "verified", "trashed",
}  # fmt: skip
_TOP_KEYS = {
    "$schema", "schema_version", "meta", "settings", "kinds", "persons", "fields", "synonyms",
    "templates", "lists", "nodes",
}  # fmt: skip


def is_iso_date(value: object) -> bool:
    """Ist ``value`` ein Datum der Form ``JJJJ-MM-TT``?"""
    if not isinstance(value, str) or not _DATE_RE.match(value):
        return False
    try:
        date.fromisoformat(value)
    except ValueError:
        return False
    return True


def is_iso_datetime(value: object) -> bool:
    """Ist ``value`` ein ISO-Zeitstempel (Datum mit Uhrzeit)?"""
    if not isinstance(value, str) or "T" not in value:
        return False
    try:
        datetime.fromisoformat(value)
    except ValueError:
        return False
    return True


class _Parser:
    def __init__(self) -> None:
        self.problems: list[Problem] = []

    # -- Hilfen ---------------------------------------------------------------------------
    def err(self, code: str, message: str, node_id: str | None = None, node_name: str | None = None) -> None:
        self.problems.append(Problem(code, message, node_id, node_name))

    def obj(self, value: Any, where: str, node_id: str | None = None) -> dict[str, Any] | None:
        if not isinstance(value, dict):
            self.err("format", f"{where}: Erwartet wird ein Objekt (in geschweiften Klammern).", node_id)
            return None
        return value

    def lst(self, value: Any, where: str, node_id: str | None = None) -> list[Any] | None:
        if not isinstance(value, list):
            self.err("format", f"{where}: Erwartet wird eine Liste (in eckigen Klammern).", node_id)
            return None
        return value

    def keys(self, d: dict[str, Any], allowed: set[str], where: str, node_id: str | None = None) -> None:
        for key in d:
            if key not in allowed:
                self.err(
                    "unknown_key",
                    f'{where}: Unbekannte Angabe "{key}". Tippfehler? Erlaubt sind: '
                    f"{', '.join(sorted(allowed))}.",
                    node_id,
                )

    def text(
        self,
        d: dict[str, Any],
        key: str,
        where: str,
        *,
        required: bool = False,
        default: str = "",
        node_id: str | None = None,
    ) -> str:
        if key not in d:
            if required:
                self.err("missing", f'{where}: Die Angabe "{key}" fehlt.', node_id)
            return default
        value = d[key]
        if not isinstance(value, str):
            self.err("type", f'{where}: "{key}" muss Text sein.', node_id)
            return default
        if required and not value.strip():
            self.err("empty", f'{where}: "{key}" darf nicht leer sein.', node_id)
        return value

    def opt_text(self, d: dict[str, Any], key: str, where: str, node_id: str | None = None) -> str | None:
        if key not in d or d[key] is None:
            return None
        value = self.text(d, key, where, node_id=node_id)
        return value or None

    def integer(
        self,
        d: dict[str, Any],
        key: str,
        where: str,
        node_id: str | None = None,
        *,
        minimum: int = 0,
    ) -> int | None:
        if key not in d:
            return None
        value = d[key]
        if isinstance(value, bool) or not isinstance(value, int):
            self.err("type", f'{where}: "{key}" muss eine ganze Zahl sein.', node_id)
            return None
        if value < minimum:
            self.err("range", f'{where}: "{key}" muss mindestens {minimum} sein.', node_id)
            return None
        return value

    def number(self, d: dict[str, Any], key: str, where: str, node_id: str | None = None) -> float | None:
        if key not in d:
            return None
        value = d[key]
        if isinstance(value, bool) or not isinstance(value, int | float):
            self.err("type", f'{where}: "{key}" muss eine Zahl sein.', node_id)
            return None
        if value < 0:
            self.err("range", f'{where}: "{key}" darf nicht negativ sein.', node_id)
            return None
        return float(value) if isinstance(value, float) else value

    def boolean(self, d: dict[str, Any], key: str, where: str, node_id: str | None = None) -> bool:
        if key not in d:
            return False
        value = d[key]
        if not isinstance(value, bool):
            self.err("type", f'{where}: "{key}" muss true oder false sein.', node_id)
            return False
        return value

    def str_list(self, d: dict[str, Any], key: str, where: str, node_id: str | None = None) -> list[str]:
        if key not in d:
            return []
        value = self.lst(d[key], f'{where}: "{key}"', node_id)
        if value is None:
            return []
        result: list[str] = []
        for item in value:
            if not isinstance(item, str):
                self.err("type", f'{where}: In "{key}" sind nur Texte erlaubt.', node_id)
            else:
                result.append(item)
        return result

    def date_value(self, d: dict[str, Any], key: str, where: str, node_id: str | None = None) -> str | None:
        if key not in d or d[key] is None:
            return None
        value = d[key]
        if not is_iso_date(value):
            self.err(
                "date",
                f'{where}: "{key}" muss ein Datum der Form JJJJ-MM-TT sein (ist: {value!r}).',
                node_id,
            )
            return None
        return str(value)

    def stamp(self, d: dict[str, Any], key: str, where: str, node_id: str | None = None) -> str:
        if key not in d:
            return ""
        value = d[key]
        if not (is_iso_datetime(value) or is_iso_date(value)):
            self.err(
                "datetime",
                f'{where}: "{key}" muss ein Zeitstempel der Form JJJJ-MM-TTThh:mm:ss+hh:mm sein.',
                node_id,
            )
            return ""
        return str(value)

    def enum(
        self,
        d: dict[str, Any],
        key: str,
        cls: type[E],
        where: str,
        *,
        default: E | None = None,
        node_id: str | None = None,
    ) -> E | None:
        if key not in d:
            if default is None:
                self.err("missing", f'{where}: Die Angabe "{key}" fehlt.', node_id)
            return default
        try:
            return cls(d[key])
        except ValueError:
            allowed = ", ".join(m.value for m in cls)
            self.err("enum", f'{where}: "{key}" ist "{d[key]}", erlaubt sind: {allowed}.', node_id)
            return default

    # -- Bausteine ------------------------------------------------------------------------
    def kind(self, raw: Any, index: int) -> Kind | None:
        where = f"Art Nr. {index + 1}"
        d = self.obj(raw, where)
        if d is None:
            return None
        self.keys(d, {"id", "name", "class", "icon", "numbered"}, where)
        kid = self.text(d, "id", where, required=True)
        where = f'Art "{kid}"'
        name = self.text(d, "name", where, required=True)
        cls = self.enum(d, "class", KindClass, where)
        if cls is None or not kid:
            return None
        return Kind(kid, name, cls, self.text(d, "icon", where), self.boolean(d, "numbered", where))

    def person(self, raw: Any, index: int) -> Person | None:
        where = f"Person Nr. {index + 1}"
        d = self.obj(raw, where)
        if d is None:
            return None
        self.keys(d, {"id", "name", "ha_person"}, where)
        pid = self.text(d, "id", where, required=True)
        name = self.text(d, "name", where, required=True)
        return Person(pid, name, self.opt_text(d, "ha_person", where)) if pid else None

    def field_def(self, raw: Any, index: int) -> FieldDef | None:
        where = f"Felddefinition Nr. {index + 1}"
        d = self.obj(raw, where)
        if d is None:
            return None
        allowed = {
            "id", "name", "type", "group", "scope", "kinds", "classes", "unit", "options",
            "remind_days_before", "builtin", "hidden",
        }  # fmt: skip
        self.keys(d, allowed, where)
        fid = self.text(d, "id", where, required=True)
        where = f'Felddefinition "{fid}"'
        name = self.text(d, "name", where, required=True)
        ftype = self.enum(d, "type", FieldType, where)
        scope = FieldScope()
        if "scope" in d:
            sd = self.obj(d["scope"], f'{where}: "scope"')
            if sd is not None:
                self.keys(sd, {"type", "node"}, f'{where}: "scope"')
                st = self.enum(sd, "type", ScopeType, f'{where}: "scope"', default=ScopeType.GLOBAL)
                scope = FieldScope(st or ScopeType.GLOBAL, self.opt_text(sd, "node", where))
        classes: list[KindClass] = []
        for c in self.str_list(d, "classes", where):
            try:
                classes.append(KindClass(c))
            except ValueError:
                self.err("enum", f'{where}: Unbekannte Klasse "{c}" in "classes".')
        if ftype is None or not fid:
            return None
        return FieldDef(
            id=fid,
            name=name,
            type=ftype,
            group=self.text(d, "group", where),
            scope=scope,
            kinds=self.str_list(d, "kinds", where),
            classes=classes,
            unit=self.text(d, "unit", where),
            options=self.str_list(d, "options", where),
            remind_days_before=self.integer(d, "remind_days_before", where),
            builtin=self.boolean(d, "builtin", where),
            hidden=self.boolean(d, "hidden", where),
        )

    def checkout(self, raw: Any, where: str, node_id: str) -> Checkout | None:
        d = self.obj(raw, f'{where}: "checkout"', node_id)
        if d is None:
            return None
        w = f'{where}: "checkout"'
        self.keys(d, {"type", "to", "since", "until", "note", "no_reminder"}, w, node_id)
        ctype = self.enum(d, "type", CheckoutType, w, node_id=node_id)
        to = self.text(d, "to", w, required=True, node_id=node_id)
        since = self.date_value(d, "since", w, node_id)
        if since is None:
            self.err("missing", f'{w}: Die Angabe "since" (seit wann) fehlt.', node_id)
        if ctype is None or since is None:
            return None
        return Checkout(
            ctype,
            to,
            since,
            self.date_value(d, "until", w, node_id),
            self.text(d, "note", w, node_id=node_id),
            self.boolean(d, "no_reminder", w, node_id),
        )

    def maintenance_task(self, raw: Any, where: str, node_id: str) -> MaintenanceTask | None:
        d = self.obj(raw, f"{where}: Wartungsaufgabe", node_id)
        if d is None:
            return None
        w = f"{where}: Wartungsaufgabe"
        self.keys(d, {"id", "title", "interval", "next_due", "note", "log"}, w, node_id)
        tid = self.text(d, "id", w, required=True, node_id=node_id)
        title = self.text(d, "title", w, required=True, node_id=node_id)
        interval: Interval | None = None
        if "interval" in d:
            idict = self.obj(d["interval"], f'{w}: "interval"', node_id)
            if idict is not None:
                self.keys(idict, {"value", "unit"}, f'{w}: "interval"', node_id)
                value = self.integer(idict, "value", f'{w}: "interval"', node_id, minimum=1)
                unit = self.enum(idict, "unit", IntervalUnit, f'{w}: "interval"', node_id=node_id)
                if value is not None and unit is not None:
                    interval = Interval(value, unit)
        log: list[LogEntry] = []
        if "log" in d:
            for entry in self.lst(d["log"], f'{w}: "log"', node_id) or []:
                ed = self.obj(entry, f"{w}: Protokolleintrag", node_id)
                if ed is None:
                    continue
                self.keys(ed, {"date", "note"}, f"{w}: Protokolleintrag", node_id)
                when = self.date_value(ed, "date", f"{w}: Protokolleintrag", node_id)
                if when is None:
                    self.err("missing", f"{w}: Protokolleintrag ohne Datum.", node_id)
                    continue
                log.append(LogEntry(when, self.text(ed, "note", w, node_id=node_id)))
        return MaintenanceTask(
            tid,
            title,
            interval,
            self.date_value(d, "next_due", w, node_id),
            self.text(d, "note", w, node_id=node_id),
            log,
        )

    def node(self, nid: str, raw: Any) -> Node | None:
        d = self.obj(raw, f'Knoten "{nid}"', nid)
        if d is None:
            return None
        name = d.get("name") if isinstance(d.get("name"), str) else nid
        where = f'Knoten "{name}" ({nid})'
        self.keys(d, _NODE_KEYS, where, nid)
        node_name = self.text(d, "name", where, required=True, node_id=nid)
        kind = self.text(d, "kind", where, required=True, node_id=nid)
        number = self.integer(d, "number", where, nid, minimum=1)
        condition = self.enum(d, "condition", Condition, where, default=Condition.OK, node_id=nid)
        checkout = self.checkout(d["checkout"], where, nid) if d.get("checkout") is not None else None
        fields: dict[str, Any] = {}
        if "fields" in d:
            fd = self.obj(d["fields"], f'{where}: "fields"', nid)
            if fd is not None:
                fields = dict(fd)
        maintenance = (
            [
                t
                for t in (
                    self.maintenance_task(m, where, nid)
                    for m in (self.lst(d["maintenance"], f'{where}: "maintenance"', nid) or [])
                )
                if t is not None
            ]
            if "maintenance" in d
            else []
        )
        attachments: list[dict[str, Any]] = []
        if "attachments" in d:
            for a in self.lst(d["attachments"], f'{where}: "attachments"', nid) or []:
                ad = self.obj(a, f"{where}: Anhang", nid)
                if ad is not None:
                    attachments.append(dict(ad))
        trashed: TrashInfo | None = None
        if d.get("trashed") is not None:
            td = self.obj(d["trashed"], f'{where}: "trashed"', nid)
            if td is not None:
                self.keys(td, {"at", "from", "by"}, f'{where}: "trashed"', nid)
                trashed = TrashInfo(
                    self.stamp(td, "at", f'{where}: "trashed"', nid),
                    self.opt_text(td, "from", where, nid),
                    self.text(td, "by", where, node_id=nid),
                )
        return Node(
            id=nid,
            name=node_name,
            kind=kind,
            parent=self.opt_text(d, "parent", where, nid),
            number=number,
            aliases=self.str_list(d, "aliases", where, nid),
            tags=self.str_list(d, "tags", where, nid),
            note=self.text(d, "note", where, node_id=nid),
            owner=self.opt_text(d, "owner", where, nid),
            quantity=self.number(d, "quantity", where, nid),
            unit=self.text(d, "unit", where, node_id=nid),
            min_quantity=self.number(d, "min_quantity", where, nid),
            condition=condition or Condition.OK,
            checkout=checkout,
            fields=fields,
            maintenance=maintenance,
            attachments=attachments,
            created=self.stamp(d, "created", where, nid),
            modified=self.stamp(d, "modified", where, nid),
            verified=self.stamp(d, "verified", where, nid),
            trashed=trashed,
        )

    def template_node(self, raw: Any, where: str) -> TemplateNode | None:
        d = self.obj(raw, where)
        if d is None:
            return None
        self.keys(d, {"name", "kind", "tags", "quantity", "unit", "fields", "children"}, where)
        name = self.text(d, "name", where, required=True)
        kind = self.text(d, "kind", where, required=True)
        children = [
            c
            for i, c in enumerate(
                self.template_node(x, f"{where} > Unterpunkt {i + 1}")
                for i, x in enumerate(self.lst(d.get("children", []), where) or [])
            )
            if c is not None
        ]
        fields = self.obj(d.get("fields", {}), f'{where}: "fields"') or {}
        return TemplateNode(
            name,
            kind,
            self.str_list(d, "tags", where),
            self.number(d, "quantity", where),
            self.text(d, "unit", where),
            dict(fields),
            children,
        )

    def template(self, raw: Any, index: int) -> Template | None:
        where = f"Vorlage Nr. {index + 1}"
        d = self.obj(raw, where)
        if d is None:
            return None
        self.keys(d, {"id", "name", "kind", "tags", "owner", "fields", "children"}, where)
        tid = self.text(d, "id", where, required=True)
        where = f'Vorlage "{tid}"'
        name = self.text(d, "name", where, required=True)
        kind = self.text(d, "kind", where, required=True)
        children = [
            c
            for c in (
                self.template_node(x, f"{where} > Unterpunkt {i + 1}")
                for i, x in enumerate(self.lst(d.get("children", []), where) or [])
            )
            if c is not None
        ]
        fields = self.obj(d.get("fields", {}), f'{where}: "fields"') or {}
        if not tid:
            return None
        return Template(
            tid,
            name,
            kind,
            self.str_list(d, "tags", where),
            self.opt_text(d, "owner", where),
            dict(fields),
            children,
        )

    def pack_list(self, raw: Any, index: int) -> PackList | None:
        where = f"Liste Nr. {index + 1}"
        d = self.obj(raw, where)
        if d is None:
            return None
        self.keys(d, {"id", "name", "entries"}, where)
        lid = self.text(d, "id", where, required=True)
        where = f'Liste "{lid}"'
        name = self.text(d, "name", where, required=True)
        entries: list[ListEntry] = []
        for i, e in enumerate(self.lst(d.get("entries", []), where) or []):
            ew = f"{where}, Eintrag {i + 1}"
            ed = self.obj(e, ew)
            if ed is None:
                continue
            self.keys(ed, {"id", "node", "text", "quantity", "note", "checked"}, ew)
            eid = self.text(ed, "id", ew, required=True)
            node = self.opt_text(ed, "node", ew)
            text = self.text(ed, "text", ew)
            if node is None and not text.strip():
                self.err("empty", f'{ew}: Ein Eintrag braucht entweder "node" oder "text".')
            entries.append(
                ListEntry(
                    eid,
                    node,
                    text,
                    self.number(ed, "quantity", ew),
                    self.text(ed, "note", ew),
                    self.boolean(ed, "checked", ew),
                )
            )
        return PackList(lid, name, entries) if lid else None


def parse_inventory(raw: Any) -> tuple[InventoryData | None, list[Problem]]:
    """Rohes JSON -> ``InventoryData``; liefert zusätzlich alle gefundenen Befunde.

    Bei Befunden ist das Ergebnis unbrauchbar und darf nicht verwendet werden.
    """
    p = _Parser()
    top = p.obj(raw, "Die Datei")
    if top is None:
        return None, p.problems
    p.keys(top, _TOP_KEYS, "Die Datei")
    version = p.integer(top, "schema_version", "Die Datei", minimum=1)
    if version is None:
        if "schema_version" not in top:
            p.err("missing", 'Die Datei: "schema_version" fehlt.')
        version = SCHEMA_VERSION

    data = InventoryData(schema_version=version)

    if "meta" in top:
        md = p.obj(top["meta"], '"meta"')
        if md is not None:
            p.keys(md, {"created", "modified", "sample"}, '"meta"')
            data.meta = Meta(p.stamp(md, "created", '"meta"'), p.stamp(md, "modified", '"meta"'))
            if md.get("sample") is not None:
                sd = p.obj(md["sample"], '"meta": "sample"')
                if sd is not None:
                    p.keys(
                        sd,
                        {"nodes", "persons", "templates", "lists", "synonyms"},
                        '"meta": "sample"',
                    )
                    data.meta.sample = SampleInfo(
                        p.str_list(sd, "nodes", '"meta": "sample"'),
                        p.str_list(sd, "persons", '"meta": "sample"'),
                        p.str_list(sd, "templates", '"meta": "sample"'),
                        p.str_list(sd, "lists", '"meta": "sample"'),
                        [
                            list(g)
                            for g in sd.get("synonyms", [])
                            if isinstance(g, list) and all(isinstance(x, str) for x in g)
                        ],
                    )

    if "settings" in top:
        sd = p.obj(top["settings"], '"settings"')
        if sd is not None:
            p.keys(sd, {"lent_days", "stale_days", "trash_days"}, '"settings"')
            defaults = Settings()
            data.settings = Settings(
                p.integer(sd, "lent_days", '"settings"', minimum=1) or defaults.lent_days,
                p.integer(sd, "stale_days", '"settings"', minimum=1) or defaults.stale_days,
                p.integer(sd, "trash_days", '"settings"', minimum=1) or defaults.trash_days,
            )

    def collect(key: str, parse: Any, target: dict[str, Any], label: str) -> None:
        if key not in top:
            return
        items = p.lst(top[key], f'"{key}"')
        for i, item in enumerate(items or []):
            obj = parse(item, i)
            if obj is None:
                continue
            if obj.id in target:
                p.err(
                    "duplicate",
                    f'{label} "{obj.id}" kommt mehrfach vor. Jede Kennung darf nur einmal vergeben sein.',
                )
                continue
            target[obj.id] = obj

    collect("kinds", p.kind, data.kinds, "Die Art")
    collect("persons", p.person, data.persons, "Die Person")
    collect("fields", p.field_def, data.fields, "Die Felddefinition")
    collect("templates", p.template, data.templates, "Die Vorlage")
    collect("lists", p.pack_list, data.lists, "Die Liste")

    if "synonyms" in top:
        groups = p.lst(top["synonyms"], '"synonyms"')
        for i, g in enumerate(groups or []):
            if not isinstance(g, list) or not all(isinstance(x, str) for x in g):
                p.err("format", f'"synonyms": Gruppe {i + 1} muss eine Liste von Texten sein.')
            else:
                data.synonyms.append(list(g))

    if "nodes" in top:
        nd = p.obj(top["nodes"], '"nodes"')
        for nid, raw_node in (nd or {}).items():
            if not isinstance(nid, str) or not nid:
                p.err("format", '"nodes": Eine Kennung ist leer.')
                continue
            node = p.node(nid, raw_node)
            if node is not None:
                data.nodes[nid] = node
    else:
        p.err("missing", 'Die Datei: "nodes" fehlt.')

    if p.problems:
        return None, p.problems
    return data, []
