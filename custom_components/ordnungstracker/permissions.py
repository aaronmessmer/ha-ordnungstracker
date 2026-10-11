"""Berechtigungen (Pflichtenheft 8.13): Löschen und Einstellungen wahlweise nur für Administratoren."""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError

from .const import CONF_ADMIN_ONLY, DOMAIN

# WebSocket-Befehle, die löschen, Einstellungen ändern oder das ganze Inventar ersetzen.
ADMIN_COMMANDS = frozenset(
    {
        "delete", "purge", "trash_empty", "import", "backup_restore", "sample_load", "sample_remove",
        "kind_add", "kind_update", "kind_delete", "person_add", "person_update", "person_delete",
        "field_def_add", "field_def_update", "field_def_delete", "template_add", "template_delete",
        "synonyms", "settings", "list_delete",
    }
)  # fmt: skip

# Dienste mit demselben Gewicht (die übrigen ändern nur Inhalte).
ADMIN_SERVICES = frozenset({"delete_node", "load_sample", "remove_sample"})

MESSAGE = (
    "Dafür sind Administratorrechte nötig. In den Optionen der Integration ist eingestellt, dass Löschen "
    "und Einstellungen nur Administratoren vorbehalten sind."
)


def admin_only(options: object) -> bool:
    """Ist die Einschränkung eingeschaltet? (``options`` = ``entry.options``)"""
    return bool(getattr(options, "get", lambda *_: False)(CONF_ADMIN_ONLY, False))


async def async_service_allowed(hass: HomeAssistant, options: object, user_id: str | None) -> None:
    """Dienstaufruf prüfen. Ohne Benutzer (Automationen, Skripte) ist alles erlaubt."""
    if not admin_only(options) or user_id is None:
        return
    user = await hass.auth.async_get_user(user_id)
    if user is None or not user.is_admin:
        raise ServiceValidationError(MESSAGE, translation_domain=DOMAIN, translation_key="admin_required")
