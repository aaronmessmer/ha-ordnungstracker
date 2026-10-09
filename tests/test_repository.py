"""Gerüst des Repositories: Manifest, Übersetzungen, HACS, Versionen, Dokumente."""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "ordnungstracker"


def _json(path: Path) -> dict:  # type: ignore[type-arg]
    return json.loads(path.read_text("utf-8"))  # type: ignore[no-any-return]


def _keys(tree: dict, prefix: str = "") -> set[str]:  # type: ignore[type-arg]
    keys: set[str] = set()
    for key, value in tree.items():
        path = f"{prefix}{key}"
        keys |= _keys(value, path + ".") if isinstance(value, dict) else {path}
    return keys


def test_manifest_has_everything_hacs_and_hassfest_need() -> None:
    manifest = _json(INTEGRATION / "manifest.json")
    for key in ("domain", "name", "version", "documentation", "issue_tracker", "codeowners"):
        assert manifest[key], key
    assert manifest["domain"] == "ordnungstracker" and manifest["name"] == "Ordnungs-Tracker"
    assert manifest["config_flow"] is True and manifest["single_config_entry"] is True
    assert manifest["requirements"] == []  # keine zusätzlichen Python-Abhängigkeiten
    assert re.fullmatch(r"\d+\.\d+\.\d+", manifest["version"])
    assert list(manifest) == sorted(manifest, key=lambda k: (k not in ("domain", "name"), k)), (
        "hassfest verlangt: domain, name, dann alphabetisch"
    )


def test_brand_icon_exists() -> None:
    icon = INTEGRATION / "brand" / "icon.png"
    assert icon.read_bytes()[:8] == b"\x89PNG\r\n\x1a\n"


def test_hacs_json() -> None:
    hacs = _json(ROOT / "hacs.json")
    assert hacs["name"] == "Ordnungs-Tracker"
    assert re.fullmatch(r"\d{4}\.\d+\.\d+", hacs["homeassistant"])
    assert not hacs.get("content_in_root")  # Integration liegt in custom_components/ordnungstracker


def test_only_one_integration_in_repo() -> None:
    assert [
        p.name for p in (ROOT / "custom_components").iterdir() if p.is_dir() and p.name != "__pycache__"
    ] == ["ordnungstracker"]


def test_translations_are_complete_and_consistent() -> None:
    strings = _json(INTEGRATION / "strings.json")
    de = _json(INTEGRATION / "translations" / "de.json")
    en = _json(INTEGRATION / "translations" / "en.json")
    assert de == strings  # Deutsch ist die Hauptsprache
    assert _keys(en) == _keys(de)


def test_changelog_mentions_manifest_version() -> None:
    version = _json(INTEGRATION / "manifest.json")["version"]
    changelog = (ROOT / "CHANGELOG.md").read_text("utf-8")
    assert f"## [{version}]" in changelog


@pytest.mark.parametrize(
    "doc",
    [
        "PFLICHTENHEFT.md",
        "ARCHITEKTUR.md",
        "DATENFORMAT.md",
        "API.md",
        "ENTSCHEIDUNGEN.md",
        "ROADMAP.md",
        "PRUEFLISTEN.md",
    ],
)
def test_documents_exist(doc: str) -> None:
    assert (ROOT / "docs" / doc).read_text("utf-8").strip()


@pytest.mark.parametrize("name", ["README.md", "CLAUDE.md", "CHANGELOG.md", "LICENSE", "hacs.json"])
def test_top_level_files_exist(name: str) -> None:
    assert (ROOT / name).read_text("utf-8").strip()


def test_pflichtenheft_was_moved() -> None:
    assert not (ROOT / "PFLICHTENHEFT.md").exists()
    assert (ROOT / "docs" / "PFLICHTENHEFT.md").exists()


def test_workflows_exist() -> None:
    workflows = {p.name for p in (ROOT / ".github" / "workflows").glob("*.yml")}
    assert {"ci.yml", "validate.yml", "release.yml"} <= workflows
