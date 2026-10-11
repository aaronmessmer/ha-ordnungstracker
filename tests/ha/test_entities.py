"""Sensoren, Kalender, Ereignisse (Pflichtenheft 9.5, 9.6)."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_capture_events,
    async_fire_time_changed,
)

from custom_components.ordnungstracker.const import DOMAIN, EVENT_DUE
from custom_components.ordnungstracker.core.sample import load_sample

from .helpers import entity_id

SENSORS = (
    "items_total", "containers_total", "empty_containers", "unsorted", "checked_out",
    "below_min", "expiring", "maintenance_due", "missing",
)  # fmt: skip


def state(hass: HomeAssistant, key: str) -> Any:
    s = hass.states.get(entity_id(hass, "sensor", key))
    assert s is not None
    return s


async def test_all_sensors_exist_and_start_at_zero(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    for key in SENSORS:
        assert state(hass, key).state == "0", key
    assert hass.states.get(entity_id(hass, "calendar", "calendar")) is not None


async def test_sensor_states_and_short_attribute_lists(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    await init_integration.runtime_data.async_mutate(load_sample)
    await hass.async_block_till_done()
    assert int(state(hass, "containers_total").state) == 8
    assert int(state(hass, "items_total").state) > 30
    assert state(hass, "missing").state == "1"
    assert state(hass, "missing").attributes["items"][0]["name"] == "Schal (blau)"
    assert state(hass, "below_min").state == "2"
    assert {i["name"] for i in state(hass, "below_min").attributes["items"]} == {
        "Batterien AA",
        "Spanplattenschrauben",
    }
    expiring = state(hass, "expiring")
    assert expiring.state == "2" and expiring.attributes["total"] == 2  # Nudeln und Bohrmaschine-Garantie
    checked = state(hass, "checked_out")
    assert checked.state == "3" and checked.attributes["overdue"] == 1
    assert state(hass, "unsorted").state == "1" and state(hass, "maintenance_due").state == "2"
    assert "items" not in state(hass, "items_total").attributes


async def test_attribute_lists_stay_short_and_small(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    def many(inv: Any) -> None:
        for n in range(60):
            inv.create_node(f"Langer Name Nummer {n} " + "x" * 80, "ding", quantity=0, min_quantity=5)

    await init_integration.runtime_data.async_mutate(many)
    await hass.async_block_till_done()
    sensor = state(hass, "below_min")
    assert sensor.state == "60" and len(sensor.attributes["items"]) == 10 and sensor.attributes["total"] == 60
    import json

    assert len(json.dumps(dict(sensor.attributes))) < 16384  # Grenze des Recorders


async def test_sensors_follow_changes_immediately(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    runtime = init_integration.runtime_data
    node = await runtime.async_mutate(
        lambda inv: inv.create_node("Milch", "ding", quantity=0, min_quantity=1)
    )
    await hass.async_block_till_done()
    assert state(hass, "below_min").state == "1"
    await runtime.async_mutate(lambda inv: inv.adjust_quantity(node.id, 5))
    await hass.async_block_till_done()
    assert state(hass, "below_min").state == "0"


async def test_calendar_lists_dates(
    hass: HomeAssistant, init_integration: MockConfigEntry, hass_client: Any
) -> None:
    await init_integration.runtime_data.async_mutate(load_sample)
    await hass.async_block_till_done()
    eid = entity_id(hass, "calendar", "calendar")
    client = await hass_client()
    resp = await client.get(f"/api/calendars/{eid}?start=2026-10-01T00:00:00Z&end=2027-01-01T00:00:00Z")
    assert resp.status == 200
    events = await resp.json()
    titles = [e["summary"] for e in events]
    assert any(t.startswith("Ablaufdatum: Nudeln") for t in titles)
    assert any(t.startswith("Garantie bis: Bohrmaschine") for t in titles)
    assert any(t.startswith("Rückgabe: Leiter") for t in titles)
    assert any(t.startswith("Wartung: ") for t in titles)
    nudeln = next(e for e in events if e["summary"].startswith("Ablaufdatum: Nudeln"))
    assert "Küche" in nudeln["description"]
    s = hass.states.get(eid)
    assert s is not None and s.attributes["message"]  # nächster Termin


async def test_due_event_fires_once_and_survives_restart(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    events = async_capture_events(hass, EVENT_DUE)
    runtime = init_integration.runtime_data
    await runtime.async_mutate(lambda inv: inv.create_node("Milch", "ding", quantity=0, min_quantity=1))
    await hass.async_block_till_done()
    assert [e.data["category"] for e in events] == ["below_min"]
    assert events[0].data["name"] == "Milch" and events[0].data["key"].startswith("below_min|")
    await runtime.async_mutate(lambda inv: inv.create_node("Anderes", "ding"))
    await runtime.async_check_due()
    assert len(events) == 1  # nicht noch einmal
    await hass.config_entries.async_reload(init_integration.entry_id)
    await hass.async_block_till_done()
    assert len(events) == 1  # auch nach einem Neustart nicht
    # nicht mehr fällig und später wieder fällig -> neue Meldung
    milch = next(n for n in init_integration.runtime_data.inventory.data.nodes.values() if n.name == "Milch")
    await init_integration.runtime_data.async_mutate(lambda inv: inv.set_quantity(milch.id, 5))
    await init_integration.runtime_data.async_mutate(lambda inv: inv.set_quantity(milch.id, 0))
    assert len(events) == 2


async def test_first_start_does_not_flood_with_events(hass: HomeAssistant, data_dir: Any) -> None:
    """Eine vorhandene Datei mit Fälligem löst beim allerersten Start keine Meldungsflut aus."""
    from custom_components.ordnungstracker.core import jsonio
    from custom_components.ordnungstracker.core.sample import build_example_inventory

    data_dir.mkdir()
    (data_dir / "inventar.json").write_text(
        jsonio.dumps(build_example_inventory().data.to_dict()), encoding="utf-8"
    )
    events = async_capture_events(hass, EVENT_DUE)
    entry = MockConfigEntry(domain=DOMAIN, title="x", data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert events == []
    assert entry.runtime_data.state.reported  # Stand ist gemerkt
    await hass.config_entries.async_unload(entry.entry_id)


async def test_hourly_tick_refreshes_and_reports(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    runtime = init_integration.runtime_data
    events = async_capture_events(hass, EVENT_DUE)
    runtime.inventory.create_node("Direkt", "ding", quantity=0, min_quantity=1)  # an der Fachschicht vorbei
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(hours=1, seconds=5))
    for _ in range(50):
        await hass.async_block_till_done()
        if events:
            break
    assert [e.data["name"] for e in events] == ["Direkt"]
    runtime.inventory.drain_changes()
    assert runtime.snapshot is not None


@pytest.mark.parametrize("key", SENSORS)
async def test_sensor_registered_with_device(
    hass: HomeAssistant, init_integration: MockConfigEntry, key: str
) -> None:
    from homeassistant.helpers import device_registry as dr
    from homeassistant.helpers import entity_registry as er

    reg = er.async_get(hass).async_get(entity_id(hass, "sensor", key))
    assert reg is not None and reg.device_id
    device = dr.async_get(hass).async_get(reg.device_id)
    assert device is not None and device.name == "Ordnungs-Tracker"
