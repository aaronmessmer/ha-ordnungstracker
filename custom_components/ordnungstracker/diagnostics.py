"""Diagnosedaten zum Herunterladen: Zahlen und Struktur, keine Namen und Inhalte (Pflichtenheft 9.8)."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.const import __version__ as ha_version
from homeassistant.core import HomeAssistant

from . import OrdnungsTrackerConfigEntry
from .const import CONF_TODO_ENTITY
from .core.overview import diagnostics_summary

TO_REDACT = {CONF_TODO_ENTITY}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: OrdnungsTrackerConfigEntry
) -> dict[str, Any]:
    runtime = entry.runtime_data
    store = runtime.store
    return {
        "home_assistant": ha_version,
        "options": async_redact_data(dict(entry.options), TO_REDACT),
        "inventory": diagnostics_summary(runtime.inventory),
        "store": {
            "unsaved_changes": store.dirty,
            "writes_blocked": store.blocked_reason is not None,
            "save_error": store.save_error is not None,
        },
        "subscribers": len(runtime._subscribers),
        "sensors": {key: runtime.snapshot.sensor(key)[0] for key in ("below_min", "expiring", "missing")}
        if runtime.snapshot
        else {},
    }
