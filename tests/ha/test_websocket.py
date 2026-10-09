"""WebSocket-API (Pflichtenheft 9.3): Befehle, Benutzer im Protokoll, Abo, Fehlercodes."""

from __future__ import annotations

import json
from collections.abc import AsyncGenerator
from pathlib import Path
from typing import Any

import pytest
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ordnungstracker.const import DOMAIN

from .helpers import fail, ok, ws


@pytest.fixture
async def client(
    hass: HomeAssistant, init_integration: MockConfigEntry, hass_ws_client: Any
) -> AsyncGenerator[Any]:
    c = await hass_ws_client(hass)
    yield c
    await c.close()


@pytest.fixture
async def sample(client: Any) -> Any:
    await ok(client, "sample_load")
    return client


async def find(client: Any, name: str) -> str:
    result = await ok(client, "search", query=name, filters={"include_archived": True})
    return next(h["id"] for h in result["hits"] if h["name"] == name)


# -- Grundlagen ----------------------------------------------------------------------------
async def test_status_and_empty_overview(client: Any) -> None:
    status = await ok(client, "status")
    assert status["inventory_empty"] is True and status["sample_loaded"] is False
    over = await ok(client, "overview")
    assert over["overview"]["containers"] == 0 and over["overview"]["next_free_number"] == 1


async def test_commands_fail_cleanly_when_not_loaded(hass: HomeAssistant, hass_ws_client: Any) -> None:
    from custom_components.ordnungstracker import websocket_api

    websocket_api.async_register_commands(hass)
    client = await hass_ws_client(hass)
    error = await fail(client, "status")
    assert error["code"] == "not_loaded" and "Reparaturen" in error["message"]
    await client.close()


async def test_create_browse_update_search(client: Any) -> None:
    room = await ok(client, "create", name="Keller")
    assert room["kind"] == "raum"  # ohne Art: passend vorgeschlagen (oberste Ebene = Raum)
    shelf = await ok(client, "create", name="Regal B", parent=room["id"])
    assert shelf["kind"] == "regal"  # im Raum eher Regal
    box = await ok(
        client, "create", name="Basteln", parent=shelf["id"], kind="kiste", number="auto", tags=["Kinder"]
    )
    assert box["number"] == 1
    thing = await ok(client, "create", name="Schere", parent=box["id"], quantity=2)
    assert thing["kind"] == "ding"
    detail = await ok(client, "node", node_id=box["id"], include_archived=False, track=True)
    assert [p["name"] for p in detail["path"]] == ["Keller", "Regal B", "Basteln"]
    assert [c["name"] for c in detail["contents"]] == ["Schere"] and detail["suggested_kinds"][0] == "ding"
    roots = await ok(client, "node", node_id=None)
    assert [c["name"] for c in roots["contents"]] == ["Keller", "Unsortiert"]
    await ok(client, "update", node_id=thing["id"], changes={"name": "Nagelschere", "note": "scharf"})
    found = await ok(client, "search", query="nagelschere")
    assert found["hits"][0]["path"][-2]["name"] == "Basteln"
    assert (await ok(client, "search", query="#1"))["number_hit"] == box["id"]
    assert (await ok(client, "by_number", number=1))["name"] == "Basteln"
    assert (await fail(client, "by_number", number=99))["code"] == "not_found"
    user = await ok(client, "user")
    assert user["recent"] == [box["id"]]  # zuletzt angesehen (nur mit track)


async def test_errors_carry_code_and_german_message(client: Any) -> None:
    box = await ok(client, "create", name="K", kind="kiste", number=5)
    error = await fail(client, "create", name="L", kind="kiste", number=5)
    assert error["code"] == "number_taken" and "schon an" in error["message"]
    assert (await fail(client, "create", name=" "))["code"] == "invalid_value"
    assert (await fail(client, "node", node_id="gibtsnicht", include_archived=False, track=False))[
        "code"
    ] == "not_found"
    assert (await fail(client, "move", ids=[box["id"]], parent=box["id"]))["code"] == "cycle"
    assert (await fail(client, "delete", node_id="unsortiert", mode="trash"))["code"] == "system_node"
    msg = await ws(client, "search", limit=0)  # Schema-Fehler kommt von Home Assistant
    assert not msg["success"] and msg["error"]["code"] == "invalid_format"


async def test_move_delete_restore_purge(sample: Any) -> None:
    kiste, garage = await find(sample, "Basteln"), await find(sample, "Garage")
    moved = await ok(sample, "move", ids=[kiste], parent=garage)
    assert moved["moved"] == [kiste]
    deleted = await ok(sample, "delete", node_id=kiste, mode="trash")
    assert deleted["descendants"] == 6
    trash = await ok(sample, "trash")
    assert [t["name"] for t in trash] == ["Basteln"] and trash[0]["trashed"]["from"] == garage
    assert (await ok(sample, "search", query="schere"))["hits"] == []  # Papierkorb ist unsichtbar
    restored = await ok(sample, "restore", node_id=kiste)
    assert restored["parent"] == garage
    await ok(sample, "delete", node_id=kiste, mode="lift")
    assert (await ok(sample, "purge", node_id=kiste))["removed"] == 1
    await ok(sample, "delete", node_id=await find(sample, "Camping"), mode="trash")
    assert (await ok(sample, "trash_empty"))["removed"] > 3


async def test_checkout_quantity_fields_maintenance(sample: Any) -> None:
    schere = await find(sample, "Schere")
    out = await ok(sample, "checkout", node_id=schere, checkout_type="lent", to="Nachbar", until="2026-12-01")
    assert out["checked_out"] is True
    assert (await ok(sample, "checkouts"))[-1]["name"] in {
        "Schere",
        "Heißklebepistole",
        "Leiter",
        "Christbaumschmuck",
    }
    await ok(sample, "checkout_reminder", node_id=schere, enabled=False)
    node = await ok(sample, "node", node_id=schere, include_archived=False, track=False)
    assert node["checkout"]["no_reminder"] is True
    await ok(sample, "return", node_id=schere)
    batt = await find(sample, "Batterien AA")
    assert (await ok(sample, "quantity", node_id=batt, delta=-5))["quantity"] == 0
    assert (await ok(sample, "quantity", node_id=batt, quantity=10))["quantity"] == 10
    fields = await ok(sample, "field_value", node_id=batt, field="vendor", value="Aldi")
    assert next(f for f in fields if f["id"] == "vendor")["value"] == "Aldi"
    assert (await fail(sample, "field_value", node_id=batt, field="expiry", value="bald"))[
        "code"
    ] == "invalid_value"
    task = await ok(
        sample,
        "maintenance_add",
        node_id=batt,
        title="Prüfen",
        interval={"value": 1, "unit": "months"},
        next_due="2026-10-01",
    )
    done = await ok(sample, "maintenance_done", node_id=batt, task=task["id"], date="2026-10-10")
    assert done["next_due"] == "2026-11-10"
    await ok(
        sample,
        "maintenance_update",
        node_id=batt,
        task=task["id"],
        changes={"title": "Neu", "interval": None},
    )
    await ok(sample, "maintenance_remove", node_id=batt, task=task["id"])


async def test_catalog_kinds_persons_fields_templates_synonyms_settings(client: Any) -> None:
    kind = await ok(client, "kind_add", name="Schublade", **{"class": "furniture"}, icon="mdi:inbox")
    await ok(client, "kind_update", kind_id=kind["id"], changes={"name": "Lade"})
    person = await ok(client, "person_add", name="Papa", ha_person="person.papa")
    await ok(client, "person_update", person_id=person["id"], changes={"name": "Vater"})
    fd = await ok(client, "field_def_add", name="Farbe", field_type="choice", options=["rot", "blau"])
    await ok(client, "field_def_update", field_id=fd["id"], changes={"options": ["rot", "grün"]})
    tpl = await ok(
        client,
        "template_add",
        name="Koffer",
        kind="kiste",
        tags=["Werkzeug"],
        children=[{"name": "Zangen", "kind": "gruppe"}],
    )
    made = await ok(client, "create_from_template", template=tpl["id"], parent=None)
    assert made["number"] == 1
    await ok(client, "synonyms", groups=[["Tacker", "Hefter"], ["x"]])
    settings = await ok(client, "settings", settings={"lent_days": 14})
    assert settings["lent_days"] == 14
    cat = await ok(client, "catalog")
    assert any(k["name"] == "Lade" for k in cat["kinds"]) and cat["synonyms"] == [["Tacker", "Hefter"]]
    assert cat["persons"][0]["name"] == "Vater" and cat["templates"][0]["name"] == "Koffer"
    await ok(client, "template_delete", template_id=tpl["id"])
    await ok(client, "field_def_delete", field_id=fd["id"])
    assert (await ok(client, "person_delete", person_id=person["id"]))["cleared"] == 0
    await ok(client, "kind_delete", kind_id=kind["id"])
    assert (await fail(client, "settings", settings={"lent_days": 0}))["code"] == "invalid_value"


async def test_quickadd_preview_and_apply(client: Any) -> None:
    box = await ok(client, "create", name="K", kind="kiste")
    preview = await ok(
        client, "quickadd_preview", text="Bastelsachen\n  3x Schere\n  2 Rollen Klebeband", split_commas=False
    )
    assert preview["count"] == 3 and preview["preview"][1].strip() == "• 3× Schere"
    applied = await ok(
        client, "quickadd_apply", parent=box["id"], text="Schere, Kleber, Buntpapier", split_commas=True
    )
    assert len(applied["created"]) == 3
    detail = await ok(client, "node", node_id=box["id"], include_archived=False, track=False)
    assert [c["name"] for c in detail["contents"]] == ["Buntpapier", "Kleber", "Schere"]


async def test_lists_and_stocktake(sample: Any) -> None:
    liste = await ok(sample, "list_create", name="Skitag")
    schere = await find(sample, "Schere")
    entry = await ok(sample, "list_entry_add", list_id=liste["id"], node=schere, quantity=1)
    await ok(sample, "list_entry_add", list_id=liste["id"], text="Handschuhe suchen")
    await ok(
        sample, "list_entry_update", list_id=liste["id"], entry_id=entry["id"], changes={"checked": True}
    )
    shown = await ok(sample, "list", list_id=liste["id"])
    assert [g["place_name"] for g in shown["groups"]] == ["Keller", "Ohne Ort"]
    assert shown["groups"][0]["entries"][0]["checked"] is True
    assert (await ok(sample, "list_reset", list_id=liste["id"]))["reset"] == 1
    await ok(sample, "list_entry_remove", list_id=liste["id"], entry_id=entry["id"])
    await ok(sample, "list_rename", list_id=liste["id"], name="Skitag 2")
    await ok(sample, "list_delete", list_id=liste["id"])
    glitzer = await find(sample, "Glitzer")
    result = await ok(sample, "stocktake_apply", results={schere: "present", glitzer: "missing"})
    assert result == {"verified": 1, "missing": 1}
    assert (await ok(sample, "verify", ids=[schere]))["verified"] == 1
    kiste = await find(sample, "Basteln")
    await ok(sample, "stocktake_set", node_id=kiste, state={"present": [schere]})
    assert (await ok(sample, "stocktake_get", node_id=kiste)) == {"present": [schere]}
    await ok(sample, "stocktake_set", node_id=kiste)
    assert (await ok(sample, "stocktake_get", node_id=kiste)) is None


async def test_due_calendar_overview(sample: Any) -> None:
    due = await ok(sample, "due")
    assert due["counts"]["missing"] == 1 and due["categories"]["below_min"]
    events = await ok(sample, "calendar", start="2026-01-01", end="2027-12-31")
    assert (
        events
        and (await fail(sample, "calendar", start="gestern", end="2027-12-31"))["code"] == "invalid_value"
    )
    over = await ok(sample, "overview")
    assert over["overview"]["containers"] == 8 and over["favorites"] == []


async def test_user_data_favorites_recent_targets_view(sample: Any) -> None:
    kiste = await find(sample, "Basteln")
    assert await ok(sample, "favorite", node_id=kiste, value=True) == [kiste]
    await ok(sample, "recent_add", node_id=kiste)
    await ok(sample, "target_add", node_id=kiste)
    await ok(sample, "view_set", key="sort", value="name")
    user = await ok(sample, "user")
    assert (
        user["favorites"] == [kiste]
        and user["targets"][0]["id"] == kiste
        and user["view"] == {"sort": "name"}
    )
    over = await ok(sample, "overview")
    assert over["favorites"][0]["name"] == "Basteln"
    assert (await fail(sample, "favorite", node_id="nix", value=True))["code"] == "not_found"


async def test_suggest_and_export_import_backup_restore(sample: Any, data_dir: Path) -> None:
    sug = await ok(sample, "suggest", parent=await find(sample, "Keller"))
    assert sug["kinds"][0] in {"regal", "raum"} and sug["next_number"] == 1
    exported = await ok(sample, "export", format="json")
    assert exported["filename"] == "inventar.json" and json.loads(exported["text"])["nodes"]
    md = await ok(sample, "export", format="markdown", node_id=await find(sample, "Basteln"))
    assert md["text"].startswith("# Basteln")
    backup = await ok(sample, "backup_create")
    assert backup["name"].endswith("-manuell.json")
    assert any(b["name"] == backup["name"] for b in await ok(sample, "backups"))
    await ok(sample, "sample_remove")
    assert (await ok(sample, "status"))["inventory_empty"] is True
    imported = await ok(sample, "import", text=exported["text"])
    assert imported["nodes"] > 60
    await ok(sample, "sample_remove")
    restored = await ok(sample, "backup_restore", name=backup["name"])
    assert restored["nodes"] > 60
    assert (await fail(sample, "import", text="{kaputt"))["code"] == "load_failed"
    assert (await fail(sample, "backup_restore", name="../etc/passwd"))["code"] == "not_found"
    assert (await fail(sample, "sample_load"))["code"] == "invalid_value"


async def test_journal_records_the_calling_user(
    client: Any, init_integration: MockConfigEntry, hass_admin_user: Any
) -> None:
    box = await ok(client, "create", name="K", kind="kiste")
    await ok(client, "update", node_id=box["id"], changes={"name": "K2"})
    entries = await ok(client, "journal", node_id=box["id"])
    assert [e["action"] for e in entries] == ["update", "create"]
    assert entries[0]["user"] == hass_admin_user.name
    assert entries[0]["details"]["old"]["name"] == "K"
    assert len(await ok(client, "journal", limit=1)) == 1


async def test_subscription_pushes_changes(hass: HomeAssistant, client: Any) -> None:
    await client.send_json_auto_id({"type": f"{DOMAIN}/subscribe"})
    first = await client.receive_json()
    assert first["success"]
    sub_id = first["id"]
    await client.send_json_auto_id({"type": f"{DOMAIN}/create", "name": "Neu", "kind": "kiste"})
    messages = [await client.receive_json(), await client.receive_json()]
    event = next(m for m in messages if m.get("type") == "event")
    result = next(m for m in messages if m.get("type") == "result")
    assert result["success"] and event["id"] == sub_id
    assert event["event"]["actions"] == ["create"] and result["result"]["id"] in event["event"]["nodes"]
    assert event["event"]["reload"] is False


async def test_external_reload_is_pushed_as_reload(hass: HomeAssistant, client: Any, data_dir: Path) -> None:
    await client.send_json_auto_id({"type": f"{DOMAIN}/subscribe"})
    await client.receive_json()
    raw = json.loads((data_dir / "inventar.json").read_text())
    raw["nodes"]["h1"] = {"name": "Von Hand", "kind": "ding"}
    (data_dir / "inventar.json").write_text(json.dumps(raw), encoding="utf-8")
    await client.send_json_auto_id({"type": f"{DOMAIN}/reload"})
    messages = [await client.receive_json(), await client.receive_json()]
    event = next(m for m in messages if m.get("type") == "event")
    assert event["event"]["reload"] is True and event["event"]["nodes"] is None
