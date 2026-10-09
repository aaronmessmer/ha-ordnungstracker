"""Hilfen der HA-Tests."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from custom_components.ordnungstracker.const import DOMAIN


async def ws(client: Any, command: str, **fields: Any) -> dict[str, Any]:
    """Einen Befehl senden und die vollständige Antwort liefern."""
    await client.send_json_auto_id({"type": f"{DOMAIN}/{command}", **fields})
    return await client.receive_json()  # type: ignore[no-any-return]


async def ok(client: Any, command: str, **fields: Any) -> Any:
    """Befehl, der gelingen muss; liefert das Ergebnis."""
    msg = await ws(client, command, **fields)
    assert msg["success"], msg
    return msg["result"]


async def fail(client: Any, command: str, **fields: Any) -> dict[str, Any]:
    """Befehl, der scheitern muss; liefert den Fehler."""
    msg = await ws(client, command, **fields)
    assert not msg["success"], msg
    return msg["error"]  # type: ignore[no-any-return]


def entity_id(hass: HomeAssistant, platform: str, key: str) -> str:
    """Entitätskennung über die eindeutige Kennung (unabhängig von der Sprache)."""
    registry = er.async_get(hass)
    for entry in registry.entities.values():
        if entry.platform == DOMAIN and entry.domain == platform and entry.unique_id.endswith(f"_{key}"):
            return entry.entity_id
    raise AssertionError(f"Entität {platform}/{key} nicht gefunden")
