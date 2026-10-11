"""Sensoren mit Anzahl als Zustand und einer kurzen Liste als Attribut (Pflichtenheft 9.5).

Die Attribute bleiben klein (höchstens 10 Einträge), siehe docs/ENTSCHEIDUNGEN.md A9;
vollständige Listen liefern WebSocket-Befehle und Dienste.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorEntity, SensorStateClass
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import OrdnungsTrackerConfigEntry
from .const import DOMAIN, NAME, SENSOR_ITEM_LIMIT
from .runtime import SIGNAL_UPDATED, OrdnungsTrackerRuntime

SENSOR_KEYS = (
    "items_total",
    "containers_total",
    "empty_containers",
    "unsorted",
    "checked_out",
    "below_min",
    "expiring",
    "maintenance_due",
    "missing",
)


def device_info(entry_id: str) -> DeviceInfo:
    return DeviceInfo(
        identifiers={(DOMAIN, entry_id)},
        name=NAME,
        entry_type=DeviceEntryType.SERVICE,
        manufacturer="Ordnungs-Tracker",
    )


async def async_setup_entry(
    hass: HomeAssistant,
    entry: OrdnungsTrackerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    runtime = entry.runtime_data
    async_add_entities(OrdnungsTrackerSensor(runtime, key) for key in SENSOR_KEYS)


class OrdnungsTrackerSensor(SensorEntity):
    """Ein Zähler des Inventars."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, runtime: OrdnungsTrackerRuntime, key: str) -> None:
        self._runtime = runtime
        self._key = key
        self._attr_translation_key = key
        self._attr_unique_id = f"{runtime.entry.entry_id}_{key}"
        self._attr_device_info = device_info(runtime.entry.entry_id)
        self._apply()

    def _apply(self) -> None:
        snapshot = self._runtime.snapshot
        if snapshot is None:  # pragma: no cover - der Schnappschuss entsteht beim Start
            return
        count, items, extra = snapshot.sensor(self._key)
        self._attr_native_value = count
        attributes: dict[str, Any] = dict(extra)
        if self._key not in ("items_total", "containers_total"):
            attributes["total"] = count
            attributes["items"] = items[:SENSOR_ITEM_LIMIT]
        self._attr_extra_state_attributes = attributes

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(
            async_dispatcher_connect(
                self.hass, SIGNAL_UPDATED.format(self._runtime.entry.entry_id), self._handle_update
            )
        )

    @callback
    def _handle_update(self) -> None:
        self._apply()
        self.async_write_ha_state()
