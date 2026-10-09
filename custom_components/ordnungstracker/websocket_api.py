"""WebSocket-Befehle der Oberfläche (Pflichtenheft 9.3).

Alle Befehle heißen ``ordnungstracker/<aktion>``. Schreibende Befehle laufen über
``OrdnungsTrackerRuntime.async_mutate`` und vermerken den aufrufenden Benutzer im Protokoll.
Fehler des Kerns werden mit stabilem ``code`` und deutscher Meldung zurückgegeben.
Beschreibung: docs/API.md.
"""

from __future__ import annotations

import dataclasses
from collections.abc import Awaitable, Callable
from datetime import date
from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from . import todo_transfer
from .const import DOMAIN, SIGNED_URL_SECONDS
from .core import export, present
from .core.errors import InvalidValueError, InventoryError, NotFoundError
from .core.inventory import Inventory
from .core.model import (
    CheckoutType,
    Condition,
    FieldType,
    Interval,
    IntervalUnit,
    KindClass,
    TemplateNode,
)
from .core.overview import build_overview
from .core.quickadd import QuickEntry, apply_quickadd, format_preview, parse_quickadd
from .core.reminders import calendar_events
from .core.sample import load_sample, remove_sample
from .core.search import SearchFilter
from .runtime import OrdnungsTrackerRuntime
from .views import get_runtime, signed_url

_REGISTERED = f"{DOMAIN}_ws_registered"
Handler = Callable[[OrdnungsTrackerRuntime, "websocket_api.ActiveConnection", dict[str, Any]], Awaitable[Any]]

_STR = str
_OPT_STR = vol.Any(None, str)
_OPT_NUM = vol.Any(None, int, float)
_FILTER = {
    vol.Optional("kinds"): [str],
    vol.Optional("classes"): [vol.In([c.value for c in KindClass])],
    vol.Optional("within"): str,
    vol.Optional("owner"): str,
    vol.Optional("tag"): str,
    vol.Optional("condition"): vol.In([c.value for c in Condition]),
    vol.Optional("checked_out"): bool,
    vol.Optional("has_number"): bool,
    vol.Optional("empty"): bool,
    vol.Optional("stale"): bool,
    vol.Optional("include_archived"): bool,
}


def _filter(raw: dict[str, Any] | None) -> SearchFilter:
    raw = raw or {}
    return SearchFilter(
        kinds=frozenset(raw["kinds"]) if "kinds" in raw else None,
        classes=frozenset(KindClass(c) for c in raw["classes"]) if "classes" in raw else None,
        within=raw.get("within"),
        owner=raw.get("owner"),
        tag=raw.get("tag"),
        condition=Condition(raw["condition"]) if "condition" in raw else None,
        checked_out=raw.get("checked_out"),
        has_number=raw.get("has_number"),
        empty=raw.get("empty"),
        stale=raw.get("stale"),
        include_archived=raw.get("include_archived", False),
    )


def _user_id(connection: websocket_api.ActiveConnection) -> str | None:
    return connection.user.id if connection.user else None


def _brief(inv: Inventory, node_id: str) -> dict[str, Any]:
    return present.node_brief(inv, node_id)


def _interval(raw: dict[str, Any] | None) -> Interval | None:
    if raw is None:
        return None
    return Interval(int(raw["value"]), IntervalUnit(raw["unit"]))


def _template_nodes(raw: list[dict[str, Any]]) -> list[TemplateNode]:
    return [
        TemplateNode(
            name=r["name"],
            kind=r["kind"],
            tags=list(r.get("tags", [])),
            quantity=r.get("quantity"),
            unit=r.get("unit", ""),
            fields=dict(r.get("fields", {})),
            children=_template_nodes(r.get("children", [])),
        )
        for r in raw
    ]


def _entries(entries: list[QuickEntry]) -> list[dict[str, Any]]:
    return [
        {"name": e.name, "quantity": e.quantity, "unit": e.unit, "children": _entries(e.children)}
        for e in entries
    ]


def _date(value: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise InvalidValueError(f'"{value}" ist kein Datum der Form JJJJ-MM-TT.') from None


# ---------------------------------------------------------------------------------------
# Lesende Befehle: fn(runtime, connection, msg) -> Ergebnis
# ---------------------------------------------------------------------------------------
async def _status(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    store = rt.store
    return {
        "revision": rt.inventory.revision,
        "nodes": len(rt.inventory.data.nodes),
        "unsaved_changes": store.dirty,
        "writes_blocked": store.blocked_reason,
        "save_error": str(store.save_error) if store.save_error else None,
        "sample_loaded": rt.inventory.data.meta.sample is not None,
        "inventory_empty": set(rt.inventory.data.nodes) <= {"unsortiert", "papierkorb"},
        "user_id": _user_id(conn),
        "todo_entity": rt.entry.options.get("todo_entity"),
    }


async def _overview(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    inv = rt.inventory
    user = _user_id(conn) or ""
    over = dataclasses.asdict(build_overview(inv))
    over["empty_containers"] = [_brief(inv, i) for i in over["empty_containers"][:50]]
    return {
        "overview": over,
        "favorites": [_brief(inv, i) for i in rt.user_data.favorites(user) if i in inv.data.nodes],
        "recent": [_brief(inv, i) for i in rt.user_data.recent(user) if i in inv.data.nodes],
    }


async def _node(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    inv = rt.inventory
    if msg.get("node_id") is None:  # oberste Ebene
        roots = inv.tree.sorted_children(None, include_archived=msg["include_archived"])
        return {"id": None, "contents": [_brief(inv, i) for i in roots if i != "papierkorb"]}
    detail = present.node_detail(inv, msg["node_id"], include_archived=msg["include_archived"])
    user = _user_id(conn)
    if msg["track"] and user and not detail["in_trash"]:
        await rt.user_data.async_add_recent(user, msg["node_id"])
    return detail


async def _by_number(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    holder = rt.inventory.find_by_number(msg["number"])
    if holder is None:
        raise NotFoundError(f"Es gibt keinen Eintrag mit der Nummer {msg['number']}.", number=msg["number"])
    return present.node_detail(rt.inventory, holder.id)


async def _search(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    assert rt.index is not None
    result = rt.index.search(msg["query"], _filter(msg.get("filters")), msg["limit"])
    return {
        "total": result.total,
        "number_hit": result.number_hit,
        "hits": [present.hit_dict(h) for h in result.hits],
    }


async def _due(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    assert rt.snapshot is not None
    return {"categories": rt.snapshot.by_category, "counts": rt.snapshot.overview.due}


async def _checkouts(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    assert rt.snapshot is not None
    return [
        {
            "id": c.node_id,
            "name": c.node_name,
            "type": c.type.value,
            "to": c.to,
            "since": c.since,
            "until": c.until,
            "days_out": c.days_out,
            "overdue": c.overdue,
            "path": rt.inventory.tree.path_names(c.node_id)[:-1],
        }
        for c in rt.snapshot.checkouts
    ]


async def _catalog(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    return present.catalog(rt.inventory)


async def _trash(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    inv = rt.inventory
    return [
        {
            **_brief(inv, i),
            "trashed": inv.data.nodes[i].trashed.to_dict() if inv.data.nodes[i].trashed else None,
        }
        for i in inv.tree.children_ids("papierkorb")
    ]


async def _journal(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    return await rt.store.async_journal(msg.get("node_id"), msg["limit"], msg["offset"])


async def _calendar(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    events = calendar_events(rt.inventory, _date(msg["start"]), _date(msg["end"]))
    return [
        {"date": e.day.isoformat(), "title": e.title, "node_id": e.node_id, "category": e.category}
        for e in events
    ]


async def _list_get(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    inv = rt.inventory
    plist = inv.get_list(msg["list_id"])
    groups = inv.list_grouped(plist.id)
    return {
        "id": plist.id,
        "name": plist.name,
        "groups": [
            {
                "place_id": g.place_id,
                "place_name": g.place_name,
                "entries": [
                    {
                        **e.to_dict(),
                        "name": inv.data.nodes[e.node].name if e.node else e.text,
                        "path": inv.tree.path_names(e.node)[:-1] if e.node else [],
                    }
                    for e in g.entries
                ],
            }
            for g in groups
        ],
    }


async def _backups(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    return [
        {"name": b.name, "time": b.time.isoformat(), "reason": b.reason}
        for b in await rt.store.async_list_backups()
    ]


async def _user(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    user = _user_id(conn) or ""
    inv = rt.inventory
    return {
        "favorites": [i for i in rt.user_data.favorites(user) if i in inv.data.nodes],
        "recent": [i for i in rt.user_data.recent(user) if i in inv.data.nodes],
        "targets": [_brief(inv, i) for i in rt.user_data.recent_targets(user) if i in inv.data.nodes],
        "view": rt.user_data.view(user),
    }


async def _suggest(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    inv = rt.inventory
    if msg.get("parent") is not None:
        inv.node(msg["parent"])
    return {"kinds": inv.tree.suggest_kinds(msg.get("parent")), "next_number": inv.next_free_number()}


async def _export(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    if msg["format"] == "json":
        return {"filename": "inventar.json", "text": await rt.store.async_export_text()}
    return {"filename": "inventar.md", "text": export.render_markdown(rt.inventory, msg.get("node_id"))}


async def _quickadd_preview(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    entries = parse_quickadd(msg["text"], split_commas=msg["split_commas"])
    return {
        "entries": _entries(entries),
        "preview": format_preview(entries),
        "count": sum(e.count() for e in entries),
    }


async def _stocktake_get(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    return rt.user_data.stocktake(_user_id(conn) or "", msg["node_id"])


async def _print_url(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    params = {k: msg[k] for k in ("node", "list") if msg.get(k)}
    return {
        "url": signed_url(rt.hass, msg["view"], params),
        "expires_in": SIGNED_URL_SECONDS,
    }


# ---------------------------------------------------------------------------------------
# Schreibende Befehle: fn(inventory, msg) -> Ergebnis; laufen in async_mutate
# ---------------------------------------------------------------------------------------
def _create(inv: Inventory, m: dict[str, Any]) -> Any:
    number = "auto" if m.get("number") == "auto" else m.get("number")
    kind = m.get("kind") or inv.tree.suggest_kind(m.get("parent"))
    node = inv.create_node(
        m["name"],
        kind,
        m.get("parent"),
        number=number,
        aliases=m.get("aliases", []),
        tags=m.get("tags", []),
        note=m.get("note", ""),
        owner=m.get("owner"),
        quantity=m.get("quantity"),
        unit=m.get("unit", ""),
        min_quantity=m.get("min_quantity"),
        fields=m.get("fields"),
    )
    return _brief(inv, node.id)


def _update(inv: Inventory, m: dict[str, Any]) -> Any:
    inv.update_node(m["node_id"], m["changes"])
    return _brief(inv, m["node_id"])


def _move(inv: Inventory, m: dict[str, Any]) -> Any:
    moved = inv.move_nodes(m["ids"], m.get("parent"))
    return {"moved": [n.id for n in moved]}


def _delete(inv: Inventory, m: dict[str, Any]) -> Any:
    count = inv.tree.content_counts(m["node_id"])[1]
    node = inv.delete_node(m["node_id"], m["mode"])
    return {"id": node.id, "descendants": count}


def _restore(inv: Inventory, m: dict[str, Any]) -> Any:
    node = inv.restore_node(m["node_id"])
    return {"id": node.id, "parent": node.parent}


def _purge(inv: Inventory, m: dict[str, Any]) -> Any:
    return {"removed": inv.purge_node(m["node_id"])}


def _empty_trash(inv: Inventory, m: dict[str, Any]) -> Any:
    return {"removed": inv.empty_trash()}


def _checkout(inv: Inventory, m: dict[str, Any]) -> Any:
    inv.checkout_node(
        m["node_id"],
        CheckoutType(m["checkout_type"]),
        m["to"],
        since=m.get("since"),
        until=m.get("until"),
        note=m.get("note", ""),
        no_reminder=m.get("no_reminder", False),
    )
    return _brief(inv, m["node_id"])


def _return(inv: Inventory, m: dict[str, Any]) -> Any:
    inv.return_node(m["node_id"])
    return _brief(inv, m["node_id"])


def _checkout_reminder(inv: Inventory, m: dict[str, Any]) -> Any:
    inv.set_checkout_reminder(m["node_id"], m["enabled"])
    return _brief(inv, m["node_id"])


def _quantity(inv: Inventory, m: dict[str, Any]) -> Any:
    if "delta" in m:
        inv.adjust_quantity(m["node_id"], m["delta"])
    else:
        inv.set_quantity(m["node_id"], m.get("quantity"))
    return _brief(inv, m["node_id"])


def _field_value(inv: Inventory, m: dict[str, Any]) -> Any:
    inv.set_field_value(m["node_id"], m["field"], m.get("value"))
    return present.node_detail(inv, m["node_id"])["fields"]


def _maintenance_add(inv: Inventory, m: dict[str, Any]) -> Any:
    task = inv.add_maintenance(
        m["node_id"],
        m["title"],
        interval=_interval(m.get("interval")),
        next_due=m.get("next_due"),
        note=m.get("note", ""),
    )
    return task.to_dict()


def _maintenance_update(inv: Inventory, m: dict[str, Any]) -> Any:
    changes = dict(m["changes"])
    if "interval" in changes:
        changes["interval"] = _interval(changes["interval"])
    return inv.update_maintenance(m["node_id"], m["task"], changes).to_dict()


def _maintenance_remove(inv: Inventory, m: dict[str, Any]) -> Any:
    inv.remove_maintenance(m["node_id"], m["task"])
    return {}


def _maintenance_done(inv: Inventory, m: dict[str, Any]) -> Any:
    return inv.complete_maintenance(
        m["node_id"], m["task"], on=m.get("date"), note=m.get("note", "")
    ).to_dict()


def _stocktake_apply(inv: Inventory, m: dict[str, Any]) -> Any:
    verified, missing = inv.apply_stocktake(m["results"])
    return {"verified": verified, "missing": missing}


def _verify(inv: Inventory, m: dict[str, Any]) -> Any:
    return {"verified": inv.verify_nodes(m["ids"])}


def _kind_add(inv: Inventory, m: dict[str, Any]) -> Any:
    return inv.add_kind(
        m["name"], KindClass(m["class"]), icon=m.get("icon", ""), numbered=m.get("numbered", False)
    ).to_dict()


def _kind_update(inv: Inventory, m: dict[str, Any]) -> Any:
    return inv.update_kind(m["kind_id"], m["changes"]).to_dict()


def _kind_delete(inv: Inventory, m: dict[str, Any]) -> Any:
    inv.delete_kind(m["kind_id"], m.get("replacement"))
    return {}


def _person_add(inv: Inventory, m: dict[str, Any]) -> Any:
    return inv.add_person(m["name"], m.get("ha_person")).to_dict()


def _person_update(inv: Inventory, m: dict[str, Any]) -> Any:
    return inv.update_person(m["person_id"], m["changes"]).to_dict()


def _person_delete(inv: Inventory, m: dict[str, Any]) -> Any:
    return {"cleared": inv.delete_person(m["person_id"])}


def _field_def_add(inv: Inventory, m: dict[str, Any]) -> Any:
    return inv.add_field_def(
        m["name"],
        FieldType(m["field_type"]),
        group=m.get("group", ""),
        scope_node=m.get("scope_node"),
        kinds=m.get("kinds", []),
        classes=[KindClass(c) for c in m.get("classes", [])],
        unit=m.get("unit", ""),
        options=m.get("options", []),
        remind_days_before=m.get("remind_days_before"),
    ).to_dict()


def _field_def_update(inv: Inventory, m: dict[str, Any]) -> Any:
    return inv.update_field_def(m["field_id"], m["changes"]).to_dict()


def _field_def_delete(inv: Inventory, m: dict[str, Any]) -> Any:
    inv.delete_field_def(m["field_id"])
    return {}


def _template_add(inv: Inventory, m: dict[str, Any]) -> Any:
    return inv.add_template(
        m["name"],
        m["kind"],
        tags=m.get("tags", []),
        owner=m.get("owner"),
        fields=m.get("fields"),
        children=_template_nodes(m.get("children", [])),
    ).to_dict()


def _template_delete(inv: Inventory, m: dict[str, Any]) -> Any:
    inv.delete_template(m["template_id"])
    return {}


def _from_template(inv: Inventory, m: dict[str, Any]) -> Any:
    node = inv.create_from_template(m["template"], m.get("parent"), m.get("name"), number=m.get("number"))
    return _brief(inv, node.id)


def _synonyms(inv: Inventory, m: dict[str, Any]) -> Any:
    return inv.set_synonyms(m["groups"])


def _settings(inv: Inventory, m: dict[str, Any]) -> Any:
    inv.update_settings(**m["settings"])
    return present.catalog(inv)["settings"]


def _quickadd_apply(inv: Inventory, m: dict[str, Any]) -> Any:
    created = apply_quickadd(inv, m["parent"], parse_quickadd(m["text"], split_commas=m["split_commas"]))
    return {"created": [n.id for n in created]}


def _list_create(inv: Inventory, m: dict[str, Any]) -> Any:
    plist = inv.create_list(m["name"])
    return {"id": plist.id, "name": plist.name}


def _list_rename(inv: Inventory, m: dict[str, Any]) -> Any:
    inv.rename_list(m["list_id"], m["name"])
    return {}


def _list_delete(inv: Inventory, m: dict[str, Any]) -> Any:
    inv.delete_list(m["list_id"])
    return {}


def _list_entry_add(inv: Inventory, m: dict[str, Any]) -> Any:
    return inv.add_list_entry(
        m["list_id"],
        node=m.get("node"),
        text=m.get("text", ""),
        quantity=m.get("quantity"),
        note=m.get("note", ""),
    ).to_dict()


def _list_entry_update(inv: Inventory, m: dict[str, Any]) -> Any:
    return inv.update_list_entry(m["list_id"], m["entry_id"], m["changes"]).to_dict()


def _list_entry_remove(inv: Inventory, m: dict[str, Any]) -> Any:
    inv.remove_list_entry(m["list_id"], m["entry_id"])
    return {}


def _list_reset(inv: Inventory, m: dict[str, Any]) -> Any:
    return {"reset": inv.reset_list(m["list_id"])}


def _sample_load(inv: Inventory, m: dict[str, Any]) -> Any:
    return {"created": load_sample(inv)}


def _sample_remove(inv: Inventory, m: dict[str, Any]) -> Any:
    return {"removed": remove_sample(inv)}


# ---------------------------------------------------------------------------------------
# Sonstige asynchrone Befehle
# ---------------------------------------------------------------------------------------
async def _import(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    name = await rt.async_resolve_user(_user_id(conn))
    inv = await rt.store.async_import_text(msg["text"], name)
    await rt.async_check_due()
    return {"nodes": len(inv.data.nodes)}


async def _backup_create(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    return {"name": await rt.store.async_backup("manuell")}


async def _backup_restore(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    name = await rt.async_resolve_user(_user_id(conn))
    inv = await rt.store.async_restore_backup(msg["name"], name)
    await rt.async_check_due()
    return {"nodes": len(inv.data.nodes)}


async def _reload(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    status = await rt.async_check_external()
    return {"status": status.value}


async def _favorite(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    rt.inventory.node(msg["node_id"])
    return await rt.user_data.async_set_favorite(_user_id(conn) or "", msg["node_id"], msg["value"])


async def _recent_add(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    rt.inventory.node(msg["node_id"])
    return await rt.user_data.async_add_recent(_user_id(conn) or "", msg["node_id"])


async def _target_add(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    rt.inventory.node(msg["node_id"])
    return await rt.user_data.async_add_target(_user_id(conn) or "", msg["node_id"])


async def _view_set(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    await rt.user_data.async_set_view(_user_id(conn) or "", msg["key"], msg["value"])
    return rt.user_data.view(_user_id(conn) or "")


async def _stocktake_set(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    rt.inventory.node(msg["node_id"])
    await rt.user_data.async_set_stocktake(_user_id(conn) or "", msg["node_id"], msg.get("state"))
    return {}


async def _todo_transfer(rt: OrdnungsTrackerRuntime, conn: Any, msg: dict[str, Any]) -> Any:
    return await todo_transfer.async_transfer(rt.hass, rt, msg.get("entity_id"))


READ: dict[str, tuple[dict[Any, Any], Handler]] = {
    "status": ({}, _status),
    "overview": ({}, _overview),
    "node": (
        {
            vol.Required("node_id"): _OPT_STR,
            vol.Optional("include_archived", default=False): bool,
            vol.Optional("track", default=False): bool,
        },
        _node,
    ),
    "by_number": ({vol.Required("number"): vol.All(int, vol.Range(min=1))}, _by_number),
    "search": (
        {
            vol.Optional("query", default=""): str,
            vol.Optional("filters"): _FILTER,
            vol.Optional("limit", default=50): vol.Any(None, vol.All(int, vol.Range(min=1, max=500))),
        },
        _search,
    ),
    "due": ({}, _due),
    "checkouts": ({}, _checkouts),
    "catalog": ({}, _catalog),
    "trash": ({}, _trash),
    "journal": (
        {
            vol.Optional("node_id"): str,
            vol.Optional("limit", default=100): vol.All(int, vol.Range(min=1, max=1000)),
            vol.Optional("offset", default=0): vol.All(int, vol.Range(min=0)),
        },
        _journal,
    ),
    "calendar": ({vol.Required("start"): str, vol.Required("end"): str}, _calendar),
    "list": ({vol.Required("list_id"): str}, _list_get),
    "backups": ({}, _backups),
    "user": ({}, _user),
    "suggest": ({vol.Optional("parent"): _OPT_STR}, _suggest),
    "export": (
        {vol.Required("format"): vol.In(["json", "markdown"]), vol.Optional("node_id"): str},
        _export,
    ),
    "quickadd_preview": (
        {vol.Required("text"): str, vol.Optional("split_commas", default=False): bool},
        _quickadd_preview,
    ),
    "stocktake_get": ({vol.Required("node_id"): str}, _stocktake_get),
    "print_url": (
        {
            vol.Required("view"): vol.In(["tree", "containers", "sheet", "packlist", "markdown", "json"]),
            vol.Optional("node"): str,
            vol.Optional("list"): str,
        },
        _print_url,
    ),
    "import": ({vol.Required("text"): str}, _import),
    "backup_create": ({}, _backup_create),
    "backup_restore": ({vol.Required("name"): str}, _backup_restore),
    "reload": ({}, _reload),
    "favorite": ({vol.Required("node_id"): str, vol.Required("value"): bool}, _favorite),
    "recent_add": ({vol.Required("node_id"): str}, _recent_add),
    "target_add": ({vol.Required("node_id"): str}, _target_add),
    "view_set": ({vol.Required("key"): str, vol.Required("value"): object}, _view_set),
    "stocktake_set": (
        {vol.Required("node_id"): str, vol.Optional("state"): vol.Any(None, dict)},
        _stocktake_set,
    ),
    "todo_transfer": ({vol.Optional("entity_id"): str}, _todo_transfer),
}

_ID = {vol.Required("node_id"): str}
_KIND = {vol.Required("kind_id"): str}
_PERSON = {vol.Required("person_id"): str}
_FIELD = {vol.Required("field_id"): str}
_TEMPLATE = {vol.Required("template_id"): str}
_NUM_AUTO = vol.Any(None, "auto", vol.All(int, vol.Range(min=1)))

WRITE: dict[str, tuple[dict[Any, Any], Callable[[Inventory, dict[str, Any]], Any]]] = {
    "create": (
        {
            vol.Required("name"): str,
            vol.Optional("kind"): str,
            vol.Optional("parent"): _OPT_STR,
            vol.Optional("number"): _NUM_AUTO,
            vol.Optional("aliases"): [str],
            vol.Optional("tags"): [str],
            vol.Optional("note"): str,
            vol.Optional("owner"): _OPT_STR,
            vol.Optional("quantity"): _OPT_NUM,
            vol.Optional("unit"): str,
            vol.Optional("min_quantity"): _OPT_NUM,
            vol.Optional("fields"): dict,
        },
        _create,
    ),
    "update": ({**_ID, vol.Required("changes"): dict}, _update),
    "move": ({vol.Required("ids"): [str], vol.Optional("parent"): _OPT_STR}, _move),
    "delete": ({**_ID, vol.Optional("mode", default="trash"): vol.In(["trash", "lift"])}, _delete),
    "restore": (_ID, _restore),
    "purge": (_ID, _purge),
    "trash_empty": ({}, _empty_trash),
    "checkout": (
        {
            **_ID,
            vol.Required("checkout_type"): vol.In([t.value for t in CheckoutType]),
            vol.Required("to"): str,
            vol.Optional("since"): str,
            vol.Optional("until"): str,
            vol.Optional("note"): str,
            vol.Optional("no_reminder"): bool,
        },
        _checkout,
    ),
    "return": (_ID, _return),
    "checkout_reminder": ({**_ID, vol.Required("enabled"): bool}, _checkout_reminder),
    "quantity": (
        {**_ID, vol.Exclusive("delta", "q"): vol.Any(int, float), vol.Exclusive("quantity", "q"): _OPT_NUM},
        _quantity,
    ),
    "field_value": ({**_ID, vol.Required("field"): str, vol.Optional("value"): object}, _field_value),
    "maintenance_add": (
        {
            **_ID,
            vol.Required("title"): str,
            vol.Optional("interval"): vol.Any(None, {vol.Required("value"): int, vol.Required("unit"): str}),
            vol.Optional("next_due"): str,
            vol.Optional("note"): str,
        },
        _maintenance_add,
    ),
    "maintenance_update": (
        {**_ID, vol.Required("task"): str, vol.Required("changes"): dict},
        _maintenance_update,
    ),
    "maintenance_remove": ({**_ID, vol.Required("task"): str}, _maintenance_remove),
    "maintenance_done": (
        {**_ID, vol.Required("task"): str, vol.Optional("date"): str, vol.Optional("note"): str},
        _maintenance_done,
    ),
    "stocktake_apply": (
        {vol.Required("results"): {str: vol.In(["present", "missing"])}},
        _stocktake_apply,
    ),
    "verify": ({vol.Required("ids"): [str]}, _verify),
    "kind_add": (
        {
            vol.Required("name"): str,
            vol.Required("class"): vol.In([c.value for c in KindClass]),
            vol.Optional("icon"): str,
            vol.Optional("numbered"): bool,
        },
        _kind_add,
    ),
    "kind_update": ({**_KIND, vol.Required("changes"): dict}, _kind_update),
    "kind_delete": ({**_KIND, vol.Optional("replacement"): str}, _kind_delete),
    "person_add": ({vol.Required("name"): str, vol.Optional("ha_person"): _OPT_STR}, _person_add),
    "person_update": ({**_PERSON, vol.Required("changes"): dict}, _person_update),
    "person_delete": (_PERSON, _person_delete),
    "field_def_add": (
        {
            vol.Required("name"): str,
            vol.Required("field_type"): vol.In([t.value for t in FieldType]),
            vol.Optional("group"): str,
            vol.Optional("scope_node"): str,
            vol.Optional("kinds"): [str],
            vol.Optional("classes"): [str],
            vol.Optional("unit"): str,
            vol.Optional("options"): [str],
            vol.Optional("remind_days_before"): vol.Any(None, int),
        },
        _field_def_add,
    ),
    "field_def_update": ({**_FIELD, vol.Required("changes"): dict}, _field_def_update),
    "field_def_delete": (_FIELD, _field_def_delete),
    "template_add": (
        {
            vol.Required("name"): str,
            vol.Required("kind"): str,
            vol.Optional("tags"): [str],
            vol.Optional("owner"): _OPT_STR,
            vol.Optional("fields"): dict,
            vol.Optional("children"): [dict],
        },
        _template_add,
    ),
    "template_delete": (_TEMPLATE, _template_delete),
    "create_from_template": (
        {
            vol.Required("template"): str,
            vol.Optional("parent"): _OPT_STR,
            vol.Optional("name"): str,
            vol.Optional("number"): _NUM_AUTO,
        },
        _from_template,
    ),
    "synonyms": ({vol.Required("groups"): [[str]]}, _synonyms),
    "settings": ({vol.Required("settings"): dict}, _settings),
    "quickadd_apply": (
        {
            vol.Required("parent"): str,
            vol.Required("text"): str,
            vol.Optional("split_commas", default=False): bool,
        },
        _quickadd_apply,
    ),
    "list_create": ({vol.Required("name"): str}, _list_create),
    "list_rename": ({vol.Required("list_id"): str, vol.Required("name"): str}, _list_rename),
    "list_delete": ({vol.Required("list_id"): str}, _list_delete),
    "list_entry_add": (
        {
            vol.Required("list_id"): str,
            vol.Optional("node"): str,
            vol.Optional("text"): str,
            vol.Optional("quantity"): _OPT_NUM,
            vol.Optional("note"): str,
        },
        _list_entry_add,
    ),
    "list_entry_update": (
        {vol.Required("list_id"): str, vol.Required("entry_id"): str, vol.Required("changes"): dict},
        _list_entry_update,
    ),
    "list_entry_remove": ({vol.Required("list_id"): str, vol.Required("entry_id"): str}, _list_entry_remove),
    "list_reset": ({vol.Required("list_id"): str}, _list_reset),
    "sample_load": ({}, _sample_load),
    "sample_remove": ({}, _sample_remove),
}


def _register(
    hass: HomeAssistant,
    name: str,
    fields: dict[Any, Any],
    run: Callable[[OrdnungsTrackerRuntime, websocket_api.ActiveConnection, dict[str, Any]], Awaitable[Any]],
) -> None:
    schema = {vol.Required("type"): f"{DOMAIN}/{name}", **fields}

    @websocket_api.websocket_command(schema)
    @websocket_api.async_response
    async def handler(
        hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
    ) -> None:
        runtime = get_runtime(hass)
        if runtime is None:
            connection.send_error(
                msg["id"],
                "not_loaded",
                "Der Ordnungs-Tracker ist nicht geladen. Prüfe unter Einstellungen → Reparaturen, ob die "
                "Datei inventar.json beanstandet wird.",
            )
            return
        try:
            result = await run(runtime, connection, msg)
        except InventoryError as err:
            connection.send_error(msg["id"], err.code, err.message)
        else:
            connection.send_result(msg["id"], result)

    websocket_api.async_register_command(hass, handler)


def _writer(
    fn: Callable[[Inventory, dict[str, Any]], Any],
) -> Callable[[OrdnungsTrackerRuntime, websocket_api.ActiveConnection, dict[str, Any]], Awaitable[Any]]:
    async def run(
        rt: OrdnungsTrackerRuntime, conn: websocket_api.ActiveConnection, msg: dict[str, Any]
    ) -> Any:
        return await rt.async_mutate(lambda inv: fn(inv, msg), _user_id(conn))

    return run


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/subscribe"})
@websocket_api.async_response
async def ws_subscribe(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Abo: jede Änderung (auch von anderen Geräten oder von Hand) wird sofort gemeldet."""
    runtime = get_runtime(hass)
    if runtime is None:
        connection.send_error(msg["id"], "not_loaded", "Der Ordnungs-Tracker ist nicht geladen.")
        return

    @callback
    def forward(payload: dict[str, Any]) -> None:
        connection.send_message(websocket_api.event_message(msg["id"], payload))

    connection.subscriptions[msg["id"]] = runtime.subscribe(forward)
    connection.send_result(msg["id"], {"revision": runtime.inventory.revision})


@callback
def async_register_commands(hass: HomeAssistant) -> None:
    """Alle Befehle anmelden (einmal je Home Assistant)."""
    if hass.data.get(_REGISTERED):
        return
    hass.data[_REGISTERED] = True
    for name, (fields, handler) in READ.items():
        _register(hass, name, fields, handler)
    for name, (fields, fn) in WRITE.items():
        _register(hass, name, fields, _writer(fn))
    websocket_api.async_register_command(hass, ws_subscribe)
