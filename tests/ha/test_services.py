"""Dienste (Pflichtenheft 9.4): alle bedienbar, mit Antwortdaten, Benutzer im Protokoll."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.exceptions import ServiceValidationError
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ordnungstracker.const import CONF_TODO_ENTITY, DOMAIN
from custom_components.ordnungstracker.core.sample import load_sample


async def call(
    hass: HomeAssistant, service: str, data: dict[str, Any] | None = None, *, response: bool = True
) -> Any:
    return await hass.services.async_call(
        DOMAIN, service, data or {}, blocking=True, return_response=response
    )


@pytest.fixture
async def sample(hass: HomeAssistant, init_integration: MockConfigEntry) -> MockConfigEntry:
    await init_integration.runtime_data.async_mutate(load_sample)
    return init_integration


async def test_all_services_exist_with_responses(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    expected = {
        "search", "get_node", "create_node", "update_node", "move_node", "delete_node", "check_out",
        "return_node", "adjust_quantity", "transfer_to_todo", "reload", "create_backup", "export",
        "load_sample", "remove_sample",
    }  # fmt: skip
    assert expected <= set(hass.services.async_services_for_domain(DOMAIN))
    # lesende Dienste liefern immer Antwortdaten
    for name in ("search", "get_node", "export"):
        assert hass.services.supports_response(DOMAIN, name) is SupportsResponse.ONLY


async def test_search_returns_hits_with_paths(hass: HomeAssistant, sample: MockConfigEntry) -> None:
    result = await call(hass, "search", {"query": "heißklebe"})
    assert result["total"] == 2
    top = result["results"][0]
    assert top["name"] == "Heißklebepistole"
    assert [p["name"] for p in top["path"]][:3] == ["Keller", "Regal B", "Basteln"]
    assert top["hints"][0]["code"] == "checked_out"
    assert (await call(hass, "search", {"kind": "kiste", "limit": 3}))["total"] == 7
    assert (await call(hass, "search", {"within": "#14", "query": "schere"}))["total"] == 1
    assert (await call(hass, "search", {"checked_out": True}))["total"] == 3
    assert (await call(hass, "search", {"condition": "missing"}))["results"][0]["name"] == "Schal (blau)"
    assert (await call(hass, "search", {"tag": "Verbrauch"}))["results"][0]["name"] == "Batterien AA"
    assert (await call(hass, "search", {"include_archived": True, "query": "röhren"}))["total"] == 1
    with pytest.raises(ServiceValidationError, match="existiert nicht"):
        await call(hass, "search", {"within": "gibtsnicht"})


async def test_get_node_by_id_or_number(hass: HomeAssistant, sample: MockConfigEntry) -> None:
    for ref in ("14", "#14", " # 14 "):
        node = await call(hass, "get_node", {"node": ref})
        assert node["name"] == "Basteln" and node["number"] == 14
    by_id = await call(hass, "get_node", {"node": node["id"]})
    assert by_id["id"] == node["id"]
    with pytest.raises(ServiceValidationError, match="existiert nicht"):
        await call(hass, "get_node", {"node": "999"})


async def test_create_update_move_delete(
    hass: HomeAssistant, sample: MockConfigEntry, data_dir: Path
) -> None:
    created = await call(
        hass,
        "create_node",
        {
            "name": "Hammer",
            "parent": "#20",
            "tags": ["Werkzeug"],
            "quantity": 2,
            "unit": "Stück",
            "min_quantity": 1,
        },
    )
    assert created["id"] and created["number"] is None
    node = await call(hass, "get_node", {"node": created["id"]})
    assert node["path"][-2]["name"] == "Schrauben" and node["kind"] == "ding" and node["tags"] == ["Werkzeug"]
    box = await call(hass, "create_node", {"name": "Neue Kiste", "kind": "kiste", "number": "auto"})
    assert box["number"] == 1
    await call(
        hass,
        "update_node",
        {"node": created["id"], "name": "Fäustel", "note": "schwer", "condition": "defective"},
    )
    changed = await call(hass, "get_node", {"node": created["id"]})
    assert changed["name"] == "Fäustel" and changed["condition"] == "defective"
    moved = await call(hass, "move_node", {"nodes": [created["id"]], "target": "#1"})
    assert moved["moved"] == [created["id"]]
    deleted = await call(hass, "delete_node", {"node": "#1", "mode": "trash"})
    assert deleted["descendants"] == 1
    assert (await call(hass, "search", {"query": "fäustel"}))["total"] == 0


async def test_services_attribute_changes_to_the_calling_user(
    hass: HomeAssistant, sample: MockConfigEntry, hass_admin_user: Any
) -> None:
    from homeassistant.core import Context

    await hass.services.async_call(
        DOMAIN, "create_node", {"name": "Von Automation"}, blocking=True, return_response=True,
        context=Context(user_id=hass_admin_user.id),
    )  # fmt: skip
    entries = await sample.runtime_data.store.async_journal(limit=1)
    assert entries[0]["user"] == hass_admin_user.name
    await hass.services.async_call(
        DOMAIN, "create_node", {"name": "Ohne Benutzer"}, blocking=True, return_response=True
    )
    assert (await sample.runtime_data.store.async_journal(limit=1))[0]["user"] == "system"


async def test_errors_become_service_errors_with_german_text(
    hass: HomeAssistant, sample: MockConfigEntry
) -> None:
    with pytest.raises(ServiceValidationError, match="schon an"):
        await call(hass, "create_node", {"name": "X", "kind": "kiste", "number": 14})
    with pytest.raises(ServiceValidationError, match="Name"):
        await call(hass, "create_node", {"name": " "})
    with pytest.raises(ServiceValidationError, match="verschoben"):
        await call(hass, "move_node", {"nodes": ["#14"], "target": "#14"})
    with pytest.raises(ServiceValidationError, match="Systemknoten"):
        await call(hass, "delete_node", {"node": "unsortiert"})


async def test_check_out_and_return_and_long_term_loan(hass: HomeAssistant, sample: MockConfigEntry) -> None:
    schere = (await call(hass, "search", {"query": "schere"}))["results"][0]["id"]
    await call(
        hass,
        "check_out",
        {"node": schere, "type": "lent", "to": "Onkel Bernd", "since": "2026-01-01", "no_reminder": True},
    )
    node = await call(hass, "get_node", {"node": schere})
    assert node["checkout"]["no_reminder"] is True and node["checkout"]["to"] == "Onkel Bernd"
    assert not any(i["name"] == "Schere" for i in sample.runtime_data.snapshot.due)  # Langzeit-Ausleihe: Ruhe
    await call(
        hass, "check_out", {"node": schere, "type": "lent", "to": "Onkel Bernd", "since": "2026-01-01"}
    )
    assert any(i["name"] == "Schere" for i in sample.runtime_data.snapshot.due)  # ohne Merker überfällig
    await call(hass, "return_node", {"node": schere})
    assert (await call(hass, "get_node", {"node": schere}))["checkout"] is None
    with pytest.raises(ServiceValidationError, match="gar nicht entnommen"):
        await call(hass, "return_node", {"node": schere})


async def test_adjust_quantity(hass: HomeAssistant, sample: MockConfigEntry) -> None:
    batt = (await call(hass, "search", {"query": "batterien"}))["results"][0]["id"]
    assert (await call(hass, "adjust_quantity", {"node": batt, "delta": 3}))["quantity"] == 5
    assert (await call(hass, "adjust_quantity", {"node": batt, "delta": -10}))["quantity"] == 0
    assert (await call(hass, "adjust_quantity", {"node": batt, "quantity": 12}))["quantity"] == 12
    with pytest.raises(ServiceValidationError, match="delta"):
        await call(hass, "adjust_quantity", {"node": batt})


async def test_reload_backup_export(hass: HomeAssistant, sample: MockConfigEntry, data_dir: Path) -> None:
    assert (await call(hass, "reload"))["status"] in {"unchanged", "reloaded"}
    backup = await call(hass, "create_backup")
    assert (data_dir / "sicherungen" / backup["name"]).is_file()
    exported = await call(hass, "export", {"format": "json"})
    assert json.loads(exported["text"])["nodes"]
    md = await call(hass, "export", {"format": "markdown", "node": "#14"})
    assert md["text"].startswith("# Basteln") and md["filename"] == "inventar.md"
    with pytest.raises(ServiceValidationError, match="existiert nicht"):
        await call(hass, "export", {"format": "markdown", "node": "nix"})


async def test_transfer_to_todo_avoids_duplicates(hass: HomeAssistant, sample: MockConfigEntry) -> None:
    added: list[dict[str, Any]] = []
    open_items = [{"summary": "Batterien AA", "status": "needs_action"}]

    async def get_items(call: ServiceCall) -> dict[str, Any]:
        return {call.data["entity_id"]: {"items": open_items}}

    async def add_item(call: ServiceCall) -> None:
        added.append(dict(call.data))

    hass.services.async_register("todo", "get_items", get_items, supports_response=SupportsResponse.ONLY)
    hass.services.async_register("todo", "add_item", add_item)
    hass.states.async_set("todo.einkauf", "1")
    result = await call(hass, "transfer_to_todo", {"todo_entity": "todo.einkauf"})
    assert result["skipped"] == ["Batterien AA"] and result["added"] == ["Spanplattenschrauben"]
    assert added[0]["item"] == "Spanplattenschrauben" and "Werkstatt" in added[0]["description"]
    # aus den Optionen
    hass.config_entries.async_update_entry(sample, options={CONF_TODO_ENTITY: "todo.einkauf"})
    await hass.async_block_till_done()
    again = await call(hass, "transfer_to_todo")
    assert again["entity_id"] == "todo.einkauf"
    with pytest.raises(ServiceValidationError, match=r"existiert nicht|gibt es nicht"):
        await call(hass, "transfer_to_todo", {"todo_entity": "todo.nirgends"})


async def test_transfer_without_list_explains_what_to_do(
    hass: HomeAssistant, sample: MockConfigEntry
) -> None:
    with pytest.raises(ServiceValidationError, match="Optionen"):
        await call(hass, "transfer_to_todo")


async def test_services_fail_clearly_when_not_loaded(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    await hass.config_entries.async_unload(init_integration.entry_id)
    with pytest.raises(ServiceValidationError, match="nicht geladen"):
        await call(hass, "search", {"query": "x"})


async def test_load_and_remove_sample_services(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    created = await call(hass, "load_sample")
    assert created["created"] > 55
    assert (await call(hass, "get_node", {"node": "#14"}))["name"] == "Basteln"
    with pytest.raises(ServiceValidationError, match="leeres Inventar"):
        await call(hass, "load_sample")
    removed = await call(hass, "remove_sample")
    assert removed["removed"] == created["created"]
    assert (await call(hass, "search", {"query": "schere"}))["total"] == 0
    with pytest.raises(ServiceValidationError, match="keine Beispieldaten"):
        await call(hass, "remove_sample")
