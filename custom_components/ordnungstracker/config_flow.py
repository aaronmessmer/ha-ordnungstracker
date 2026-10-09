"""Config Flow: genau eine Instanz, keine Pflichtangaben."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .const import DOMAIN, NAME


class OrdnungsTrackerConfigFlow(ConfigFlow, domain=DOMAIN):
    """Einrichtung des Ordnungs-Trackers."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Bestätigung ohne Eingabefelder; ``single_config_entry`` verhindert Mehrfach-Einträge."""
        if user_input is not None:
            return self.async_create_entry(title=NAME, data={})
        return self.async_show_form(step_id="user")
