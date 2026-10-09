"""Ordnungs-Tracker: Inventar für Home Assistant.

Dünne Home-Assistant-Schicht über dem Kern (``core/``, Pflichtenheft 4): Einrichten, Laden der
Datei (ohne etwas zu überschreiben), WebSocket-Befehle, Dienste, Sensoren, Kalender, Ereignisse,
Reparaturhinweise, Diagnose und Auslieferung.
"""

from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STOP
from homeassistant.core import Event, HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration

from . import frontend_registration, repairs, services, views, websocket_api
from .const import (
    CONF_SHOW_SIDEBAR,
    DOMAIN,
    ISSUE_INVALID_FILE,
    ISSUE_NEWER_SCHEMA,
)
from .core.errors import InventoryLoadError, NewerSchemaError
from .runtime import OrdnungsTrackerRuntime

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[str] = ["sensor", "calendar"]

type OrdnungsTrackerConfigEntry = ConfigEntry[OrdnungsTrackerRuntime]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Dienste, WebSocket-Befehle und Ansichten gibt es einmal je Home Assistant."""
    services.async_register_services(hass)
    websocket_api.async_register_commands(hass)
    views.async_register_views(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: OrdnungsTrackerConfigEntry) -> bool:
    """Inventar laden und alles anmelden.

    Ist die Datei ungültig, wird **nicht** mit leerem Inventar gestartet und nichts überschrieben;
    stattdessen erscheint ein Reparaturhinweis, und Home Assistant versucht es später erneut
    (nach der Korrektur der Datei startet die Integration von selbst).
    """
    runtime = OrdnungsTrackerRuntime(hass, entry)
    try:
        await runtime.async_start()
    except NewerSchemaError as err:
        repairs.report_newer_schema(hass, err.message, runtime.path_text)
        raise ConfigEntryNotReady(err.message) from err
    except InventoryLoadError as err:
        repairs.report_invalid_file(hass, err.problems, err.last_valid_backup, runtime.path_text)
        raise ConfigEntryNotReady(err.message) from err
    repairs.clear(hass, ISSUE_INVALID_FILE, ISSUE_NEWER_SCHEMA)
    entry.runtime_data = runtime

    async def _flush(_event: Event) -> None:
        await runtime.store.async_stop()

    entry.async_on_unload(hass.bus.async_listen(EVENT_HOMEASSISTANT_STOP, _flush))
    integration = await async_get_integration(hass, DOMAIN)
    unregister = await frontend_registration.async_register(
        hass, str(integration.version), show_sidebar=entry.options.get(CONF_SHOW_SIDEBAR, True)
    )
    entry.async_on_unload(unregister)
    entry.async_on_unload(entry.add_update_listener(_options_updated))
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def _options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Optionen geändert (Seitenleiste, To-do-Liste): neu laden."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: OrdnungsTrackerConfigEntry) -> bool:
    """Entladen: Plattformen weg, ausstehende Änderungen sofort schreiben."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        await entry.runtime_data.async_stop()
    return unloaded
