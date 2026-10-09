"""Ordnungs-Tracker: Inventar für Home Assistant.

Phase 0: leere Integration, die sich einrichten und wieder entfernen lässt.
Die Anbindung des Kerns (``core/``) folgt in Phase 2.
"""

from __future__ import annotations

from dataclasses import dataclass

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN

PLATFORMS: list[str] = []


@dataclass
class OrdnungsTrackerData:
    """Laufzeitdaten des Config-Eintrags (ab Phase 2: Inventar und Speicher)."""


type OrdnungsTrackerConfigEntry = ConfigEntry[OrdnungsTrackerData]


async def async_setup_entry(hass: HomeAssistant, entry: OrdnungsTrackerConfigEntry) -> bool:
    """Integration einrichten."""
    entry.runtime_data = OrdnungsTrackerData()
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: OrdnungsTrackerConfigEntry) -> bool:
    """Integration entladen."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


__all__ = ["DOMAIN", "async_setup_entry", "async_unload_entry"]
