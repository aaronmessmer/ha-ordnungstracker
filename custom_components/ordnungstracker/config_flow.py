"""Config Flow: genau eine Instanz, keine Pflichtangaben."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import CONF_ADMIN_ONLY, CONF_SHOW_SIDEBAR, CONF_TODO_AUTO, CONF_TODO_ENTITY, DOMAIN, NAME


class OrdnungsTrackerConfigFlow(ConfigFlow, domain=DOMAIN):
    """Einrichtung des Ordnungs-Trackers."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Bestätigung ohne Eingabefelder; ``single_config_entry`` verhindert Mehrfach-Einträge."""
        if user_input is not None:
            return self.async_create_entry(title=NAME, data={})
        return self.async_show_form(step_id="user")

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OrdnungsTrackerOptionsFlow:
        """Optionen: Ziel-To-do-Liste und Seitenleisten-Eintrag (Pflichtenheft 9.1)."""
        return OrdnungsTrackerOptionsFlow()


class OrdnungsTrackerOptionsFlow(OptionsFlow):
    """Einstellungen der Integration (die Schwellen des Inventars stehen in der Datei, siehe B9)."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            data = {k: v for k, v in user_input.items() if v not in (None, "")}
            return self.async_create_entry(data=data)
        schema = vol.Schema(
            {
                vol.Optional(CONF_TODO_ENTITY): selector.EntitySelector(
                    selector.EntitySelectorConfig(domain="todo")
                ),
                vol.Required(CONF_TODO_AUTO, default=False): bool,
                vol.Required(CONF_ADMIN_ONLY, default=False): bool,
                vol.Required(CONF_SHOW_SIDEBAR, default=True): bool,
            }
        )
        return self.async_show_form(
            step_id="init",
            data_schema=self.add_suggested_values_to_schema(schema, self.config_entry.options),
        )
