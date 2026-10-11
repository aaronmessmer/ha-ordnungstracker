"""Reparaturhinweise in Home Assistant, auf Deutsch und mit Handlungshinweis (Pflichtenheft 6.3)."""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir

from .const import (
    DOMAIN,
    ISSUE_CONFLICT,
    ISSUE_EXTERNAL_INVALID,
    ISSUE_INVALID_FILE,
    ISSUE_NEWER_SCHEMA,
    ISSUE_SAVE_FAILED,
)
from .core.errors import Problem

MAX_LISTED = 5


def _summary(problems: list[Problem]) -> str:
    lines = [f"• {p.message}" for p in problems[:MAX_LISTED]]
    if len(problems) > MAX_LISTED:
        lines.append(f"• … und {len(problems) - MAX_LISTED} weitere")
    return "\n".join(lines)


def _create(hass: HomeAssistant, issue_id: str, placeholders: dict[str, str]) -> None:
    ir.async_create_issue(
        hass,
        DOMAIN,
        issue_id,
        is_fixable=False,
        severity=ir.IssueSeverity.ERROR,
        translation_key=issue_id,
        translation_placeholders=placeholders,
    )


def report_invalid_file(
    hass: HomeAssistant, problems: list[Problem], last_valid_backup: str | None, path: str
) -> None:
    """Die Datei ist beim Start ungültig: nichts wurde überschrieben."""
    _create(
        hass,
        ISSUE_INVALID_FILE,
        {
            "problems": _summary(problems),
            "backup": last_valid_backup or "(keine gültige Sicherung gefunden)",
            "path": path,
        },
    )


def report_newer_schema(hass: HomeAssistant, message: str, path: str) -> None:
    _create(hass, ISSUE_NEWER_SCHEMA, {"message": message, "path": path})


def report_external_invalid(
    hass: HomeAssistant, problems: list[Problem], conflict_file: str | None, path: str
) -> None:
    """Die Datei wurde von Hand ungültig geändert; bis zur Korrektur wird nicht gespeichert."""
    _create(
        hass,
        ISSUE_EXTERNAL_INVALID,
        {
            "problems": _summary(problems),
            "conflict": conflict_file or "(keine ungespeicherten Änderungen)",
            "path": path,
        },
    )


def report_conflict(hass: HomeAssistant, conflict_file: str, path: str) -> None:
    """Fremdänderung bei ungespeicherten eigenen Änderungen: eigener Stand liegt daneben."""
    _create(hass, ISSUE_CONFLICT, {"conflict": conflict_file, "path": path})


def report_save_failed(hass: HomeAssistant, error: str, path: str) -> None:
    _create(hass, ISSUE_SAVE_FAILED, {"error": error, "path": path})


def clear(hass: HomeAssistant, *issue_ids: str) -> None:
    """Hinweise entfernen (falls vorhanden)."""
    for issue_id in issue_ids:
        ir.async_delete_issue(hass, DOMAIN, issue_id)


def clear_all(hass: HomeAssistant) -> None:
    clear(
        hass,
        ISSUE_INVALID_FILE,
        ISSUE_NEWER_SCHEMA,
        ISSUE_EXTERNAL_INVALID,
        ISSUE_SAVE_FAILED,
    )
