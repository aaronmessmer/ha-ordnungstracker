"""services.yaml, Übersetzungen und Symbole passen zu dem, was tatsächlich angemeldet ist."""

from __future__ import annotations

import json
from pathlib import Path

import yaml
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ordnungstracker import const
from custom_components.ordnungstracker.const import DOMAIN
from custom_components.ordnungstracker.sensor import SENSOR_KEYS

PKG = Path(__file__).resolve().parents[2] / "custom_components" / "ordnungstracker"


def _load(name: str) -> dict:  # type: ignore[type-arg]
    return json.loads((PKG / name).read_text("utf-8"))  # type: ignore[no-any-return]


async def test_services_yaml_matches_registered_services_and_translations(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    yaml_services = yaml.safe_load((PKG / "services.yaml").read_text("utf-8"))
    registered = set(hass.services.async_services_for_domain(DOMAIN))
    assert set(yaml_services) == registered
    for lang in ("strings.json", "translations/de.json", "translations/en.json"):
        translated = _load(lang)["services"]
        assert set(translated) == registered, lang
        for name, spec in yaml_services.items():
            fields = set((spec or {}).get("fields", {}))
            assert fields == set(translated[name].get("fields", {})), (lang, name)
            for text in (translated[name]["name"], translated[name]["description"]):
                assert text.strip()
    assert set(_load("icons.json")["services"]) == registered


def test_entities_and_issues_are_translated() -> None:
    issue_ids = {
        const.ISSUE_INVALID_FILE, const.ISSUE_NEWER_SCHEMA, const.ISSUE_EXTERNAL_INVALID,
        const.ISSUE_CONFLICT, const.ISSUE_SAVE_FAILED,
    }  # fmt: skip
    for lang in ("strings.json", "translations/de.json", "translations/en.json"):
        data = _load(lang)
        assert set(data["entity"]["sensor"]) == set(SENSOR_KEYS), lang
        assert set(data["issues"]) == issue_ids, lang
        assert {"not_loaded", "no_todo_entity", "todo_unknown"} <= set(data["exceptions"]), lang
        assert {"todo_entity", "todo_auto", "show_sidebar"} == set(data["options"]["step"]["init"]["data"]), (
            lang
        )
    assert set(_load("icons.json")["entity"]["sensor"]) == set(SENSOR_KEYS)


def test_issue_placeholders_are_all_supplied() -> None:
    """Jeder Platzhalter in den Texten der Hinweise wird beim Anlegen auch geliefert."""
    import re

    from custom_components.ordnungstracker import repairs

    source = (PKG / "repairs.py").read_text("utf-8")
    supplied = {
        const.ISSUE_INVALID_FILE: {"problems", "backup", "path"},
        const.ISSUE_NEWER_SCHEMA: {"message", "path"},
        const.ISSUE_EXTERNAL_INVALID: {"problems", "conflict", "path"},
        const.ISSUE_CONFLICT: {"conflict", "path"},
        const.ISSUE_SAVE_FAILED: {"error", "path"},
    }
    assert repairs and source
    for lang in ("strings.json", "translations/en.json"):
        for issue_id, wanted in supplied.items():
            text = _load(lang)["issues"][issue_id]["description"]
            assert set(re.findall(r"\{(\w+)\}", text)) <= wanted, (lang, issue_id)
