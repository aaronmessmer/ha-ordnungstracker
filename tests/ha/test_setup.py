"""Einrichtung, ungültige Datei, Optionen, Änderungen von Hand, Diagnose (Pflichtenheft 9.1, 6.3, 9.8)."""

from __future__ import annotations

import asyncio
import json
from datetime import timedelta
from pathlib import Path

from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import EVENT_HOMEASSISTANT_STOP
from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
)

from custom_components.ordnungstracker.const import (
    CONF_ADMIN_ONLY,
    CONF_SHOW_SIDEBAR,
    CONF_TODO_AUTO,
    CONF_TODO_ENTITY,
    DOMAIN,
    ISSUE_CONFLICT,
    ISSUE_EXTERNAL_INVALID,
    ISSUE_INVALID_FILE,
    ISSUE_NEWER_SCHEMA,
    NAME,
)

from .helpers import ok, ws


def _entry(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title=NAME, data={})
    entry.add_to_hass(hass)
    return entry


def _issue(hass: HomeAssistant, issue_id: str) -> ir.IssueEntry | None:
    return ir.async_get(hass).async_get_issue(DOMAIN, issue_id)


async def test_setup_creates_data_folder(
    hass: HomeAssistant, init_integration: MockConfigEntry, data_dir: Path
) -> None:
    assert (data_dir / "inventar.json").is_file()
    assert (data_dir / "sicherungen").is_dir() and (data_dir / "anhaenge").is_dir()
    assert init_integration.state is ConfigEntryState.LOADED
    assert hass.services.has_service(DOMAIN, "search")


async def test_invalid_file_does_not_start_empty_and_creates_repair(
    hass: HomeAssistant, data_dir: Path
) -> None:
    data_dir.mkdir()
    broken = '{"schema_version": 1, "nodes": {"x": {"name": "Hammer", "kind": "ding", "parent": "weg"}}'
    (data_dir / "inventar.json").write_text(broken, encoding="utf-8")
    entry = _entry(hass)
    assert not await hass.config_entries.async_setup(entry.entry_id)
    assert entry.state is ConfigEntryState.SETUP_RETRY
    assert (data_dir / "inventar.json").read_text() == broken  # nichts überschrieben
    issue = _issue(hass, ISSUE_INVALID_FILE)
    assert issue is not None and issue.translation_placeholders is not None
    assert "JSON" in issue.translation_placeholders["problems"]
    assert issue.translation_placeholders["path"].endswith("inventar.json")
    await hass.config_entries.async_unload(entry.entry_id)


async def test_rule_violation_names_the_node_in_the_repair(hass: HomeAssistant, data_dir: Path) -> None:
    data_dir.mkdir()
    raw = {
        "schema_version": 1,
        "kinds": [{"id": "g", "name": "G", "class": "group"}, {"id": "raum", "name": "R", "class": "place"}],
        "nodes": {
            "unsortiert": {"name": "Unsortiert", "kind": "raum"},
            "papierkorb": {"name": "Papierkorb", "kind": "raum"},
            "x": {"name": "Hammer", "kind": "raum", "parent": "weg"},
        },
    }
    (data_dir / "inventar.json").write_text(json.dumps(raw), encoding="utf-8")
    entry = _entry(hass)
    assert not await hass.config_entries.async_setup(entry.entry_id)
    issue = _issue(hass, ISSUE_INVALID_FILE)
    assert issue is not None and "Hammer" in issue.translation_placeholders["problems"]  # type: ignore[index]
    await hass.config_entries.async_unload(entry.entry_id)


async def test_repair_disappears_and_integration_starts_after_fixing(
    hass: HomeAssistant, data_dir: Path
) -> None:
    data_dir.mkdir()
    (data_dir / "inventar.json").write_text("{kaputt", encoding="utf-8")
    entry = _entry(hass)
    await hass.config_entries.async_setup(entry.entry_id)
    assert _issue(hass, ISSUE_INVALID_FILE) is not None
    (data_dir / "inventar.json").unlink()  # Nutzer räumt auf
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(minutes=10))
    for _ in range(100):  # die Datei wird in einem Thread gelesen
        await asyncio.sleep(0.02)
        await hass.async_block_till_done()
        if entry.state not in (ConfigEntryState.SETUP_RETRY, ConfigEntryState.SETUP_IN_PROGRESS):
            break
    assert entry.state is ConfigEntryState.LOADED
    assert _issue(hass, ISSUE_INVALID_FILE) is None
    await hass.config_entries.async_unload(entry.entry_id)


async def test_newer_schema_is_left_alone(hass: HomeAssistant, data_dir: Path) -> None:
    data_dir.mkdir()
    text = json.dumps({"schema_version": 99, "nodes": {}})
    (data_dir / "inventar.json").write_text(text, encoding="utf-8")
    entry = _entry(hass)
    assert not await hass.config_entries.async_setup(entry.entry_id)
    assert _issue(hass, ISSUE_NEWER_SCHEMA) is not None
    assert (data_dir / "inventar.json").read_text() == text
    await hass.config_entries.async_unload(entry.entry_id)


async def test_pending_changes_are_written_on_unload_and_on_stop(
    hass: HomeAssistant, init_integration: MockConfigEntry, data_dir: Path, hass_ws_client
) -> None:
    client = await hass_ws_client(hass)
    await ok(client, "create", name="Erster")
    await client.close()
    assert "Erster" not in (data_dir / "inventar.json").read_text()  # gebündelt: noch nicht geschrieben
    await hass.config_entries.async_unload(init_integration.entry_id)
    assert "Erster" in (data_dir / "inventar.json").read_text()
    await hass.config_entries.async_setup(init_integration.entry_id)
    await hass.async_block_till_done()
    await init_integration.runtime_data.async_mutate(lambda inv: inv.create_node("Zweiter", "ding"))
    hass.bus.async_fire(EVENT_HOMEASSISTANT_STOP)
    await hass.async_block_till_done()
    assert "Zweiter" in (data_dir / "inventar.json").read_text()


async def test_external_edit_is_reloaded(
    hass: HomeAssistant, init_integration: MockConfigEntry, data_dir: Path
) -> None:
    runtime = init_integration.runtime_data
    raw = json.loads((data_dir / "inventar.json").read_text())
    raw["nodes"]["h1"] = {"name": "Von Hand", "kind": "ding"}
    (data_dir / "inventar.json").write_text(json.dumps(raw), encoding="utf-8")
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=40))
    await hass.async_block_till_done()
    assert "h1" in runtime.inventory.data.nodes


async def test_invalid_external_edit_creates_repair_and_clears_after_fix(
    hass: HomeAssistant, init_integration: MockConfigEntry, data_dir: Path, hass_ws_client
) -> None:
    good = (data_dir / "inventar.json").read_text()
    (data_dir / "inventar.json").write_text("{kaputt", encoding="utf-8")
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=40))
    await hass.async_block_till_done()
    assert _issue(hass, ISSUE_EXTERNAL_INVALID) is not None
    client = await hass_ws_client(hass)
    msg = (
        await client.send_json_auto_id({"type": f"{DOMAIN}/create", "name": "X"})
        or await client.receive_json()
    )
    assert not msg["success"] and "Korrigiere" in msg["error"]["message"]
    (data_dir / "inventar.json").write_text(good, encoding="utf-8")
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=80))
    await hass.async_block_till_done()
    assert _issue(hass, ISSUE_EXTERNAL_INVALID) is None


async def test_external_edit_with_unsaved_changes_reports_conflict(
    hass: HomeAssistant, init_integration: MockConfigEntry, data_dir: Path, hass_ws_client
) -> None:
    client = await hass_ws_client(hass)
    await ok(client, "create", name="Ungespeichert")
    raw = json.loads((data_dir / "inventar.json").read_text())
    raw["nodes"]["h1"] = {"name": "Von Hand", "kind": "ding"}
    (data_dir / "inventar.json").write_text(json.dumps(raw), encoding="utf-8")
    result = await ok(client, "reload")
    assert result["status"] == "conflict"
    issue = _issue(hass, ISSUE_CONFLICT)
    assert issue is not None
    conflict = issue.translation_placeholders["conflict"]  # type: ignore[index]
    assert "Ungespeichert" in (data_dir / conflict).read_text()


async def test_options_flow(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    result = await hass.config_entries.options.async_init(init_integration.entry_id)
    assert result["type"] == "form" and result["step_id"] == "init"
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {CONF_TODO_ENTITY: "todo.einkauf", CONF_SHOW_SIDEBAR: False, CONF_TODO_AUTO: True}
    )
    assert result["type"] == "create_entry"
    await hass.async_block_till_done()
    assert init_integration.options == {
        CONF_TODO_ENTITY: "todo.einkauf",
        CONF_SHOW_SIDEBAR: False,
        CONF_TODO_AUTO: True,
        CONF_ADMIN_ONLY: False,
    }
    assert init_integration.state is ConfigEntryState.LOADED  # wurde neu geladen


async def test_diagnostics_contain_numbers_but_no_names(
    hass: HomeAssistant, init_integration: MockConfigEntry, hass_client, hass_ws_client
) -> None:
    from pytest_homeassistant_custom_component.components.diagnostics import (
        get_diagnostics_for_config_entry,
    )

    client = await hass_ws_client(hass)
    await ok(client, "sample_load")
    diag = await get_diagnostics_for_config_entry(hass, hass_client, init_integration)
    assert diag["inventory"]["nodes"] > 60 and diag["inventory"]["lists"] == 1
    text = json.dumps(diag, ensure_ascii=False)
    for secret in ("Heißklebepistole", "Huber", "Papa", "Basteln", "Keller"):
        assert secret not in text


async def test_failed_save_creates_repair_and_recovers(
    hass: HomeAssistant, init_integration: MockConfigEntry, data_dir: Path
) -> None:
    from unittest.mock import patch

    from custom_components.ordnungstracker.const import ISSUE_SAVE_FAILED
    from custom_components.ordnungstracker.core import store as store_mod

    runtime = init_integration.runtime_data
    runtime.store.save_delay = 0  # sofort schreiben, damit der Fehler gleich auffällt
    with patch.object(store_mod, "write_atomic", side_effect=OSError("Platte voll")):
        await runtime.async_mutate(lambda inv: inv.create_node("Bleibt im Speicher", "ding"))
        issue = _issue(hass, ISSUE_SAVE_FAILED)
        assert issue is not None and "Platte voll" in issue.translation_placeholders["error"]  # type: ignore[index]
    runtime.store._timer and runtime.store._timer.cancel()
    await runtime.store.async_flush()
    await runtime.async_mutate(lambda inv: inv.create_node("Und weiter", "ding"))
    assert _issue(hass, ISSUE_SAVE_FAILED) is None
    assert "Bleibt im Speicher" in (data_dir / "inventar.json").read_text()


async def test_todo_transfer_via_websocket_explains_missing_list(
    hass: HomeAssistant, init_integration: MockConfigEntry, hass_ws_client
) -> None:
    client = await hass_ws_client(hass)
    msg = await ws(client, "todo_transfer")
    assert not msg["success"]
    await client.close()
