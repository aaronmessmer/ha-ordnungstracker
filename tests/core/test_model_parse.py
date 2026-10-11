"""Datei <-> Modell: Rundlauf, lesbare Ausgabe, Fehlermeldungen beim Einlesen."""

from __future__ import annotations

import copy
import json
from typing import Any

from custom_components.ordnungstracker.core import jsonio
from custom_components.ordnungstracker.core.defaults import new_inventory_data
from custom_components.ordnungstracker.core.inventory import Inventory
from custom_components.ordnungstracker.core.model import SCHEMA_VERSION
from custom_components.ordnungstracker.core.parse import (
    is_iso_date,
    is_iso_datetime,
    parse_inventory,
)

from .conftest import FakeClock


def _base() -> dict[str, Any]:
    return new_inventory_data("2026-10-10T09:00:00+02:00").to_dict()


def _problems(raw: Any) -> list[str]:
    data, problems = parse_inventory(raw)
    assert data is None
    return [p.message for p in problems]


def test_roundtrip_is_lossless(sample: Inventory) -> None:
    original = sample.data.to_dict()
    data, problems = parse_inventory(json.loads(jsonio.dumps(original)))
    assert problems == []
    assert data is not None
    assert data.to_dict() == original


def test_dumps_is_stable_and_readable(sample: Inventory) -> None:
    text = jsonio.dumps(sample.data.to_dict())
    assert text.endswith("}\n")
    assert "  " in text and "\t" not in text
    assert "Heißklebepistole" in text  # Umlaute unverändert
    again = jsonio.dumps(json.loads(text))
    assert again == text  # Dateiausgabe ist stabil
    # kurze Objekte stehen in einer Zeile
    assert '{ "id": "ding", "name": "Ding", "class": "item", "icon": "mdi:circle-small" }' in text


def test_only_non_default_values_are_written(inv: Inventory) -> None:
    node = inv.create_node("Test", "ding")
    d = node.to_dict()
    assert set(d) == {"name", "kind", "created", "modified"}


def test_minimal_file_is_valid() -> None:
    raw = _base()
    data, problems = parse_inventory(raw)
    assert problems == [] and data is not None
    assert data.schema_version == SCHEMA_VERSION


def test_not_an_object() -> None:
    assert "Objekt" in _problems([])[0]


def test_missing_schema_version_and_nodes() -> None:
    messages = _problems({})
    assert any("schema_version" in m for m in messages)
    assert any("nodes" in m for m in messages)


def test_unknown_keys_are_reported_with_node_name() -> None:
    raw = _base()
    raw["nodes"]["x1"] = {"name": "Hammer", "kind": "ding", "numer": 3}
    messages = _problems(raw)
    assert any("Hammer" in m and "numer" in m for m in messages)
    raw2 = _base()
    raw2["surprise"] = 1
    assert any("surprise" in m for m in _problems(raw2))


def test_type_errors_for_node_fields() -> None:
    raw = _base()
    raw["nodes"]["x1"] = {
        "name": "A",
        "kind": "ding",
        "number": "vierzehn",
        "aliases": "nein",
        "quantity": -1,
        "condition": "kaputt",
        "tags": [1],
        "created": "gestern",
        "checkout": {"type": "lent", "to": "X"},
        "maintenance": [{"title": "t"}],
    }
    messages = "\n".join(_problems(raw))
    for fragment in (
        "ganze Zahl",
        "Liste",
        "negativ",
        "kaputt",
        "Texte",
        "Zeitstempel",
        "since",
        '"id"',
    ):
        assert fragment in messages or fragment.lower() in messages.lower(), fragment


def test_bool_is_not_a_number() -> None:
    raw = _base()
    raw["nodes"]["x1"] = {"name": "A", "kind": "ding", "quantity": True, "number": True}
    assert len(_problems(raw)) >= 2


def test_duplicate_ids_reported() -> None:
    raw = _base()
    raw["kinds"].append(copy.deepcopy(raw["kinds"][0]))
    assert any("mehrfach" in m for m in _problems(raw))


def test_all_sections_parsed_with_errors() -> None:
    raw = _base()
    raw["kinds"] = ["x", {"id": "k", "name": "K", "class": "wrong"}]
    raw["persons"] = [1, {"id": "p"}]
    raw["fields"] = [
        {"id": "f", "name": "F", "type": "nope"},
        {"id": "g", "name": "G", "type": "text", "classes": ["zzz"], "scope": 5},
    ]
    raw["templates"] = [{"id": "t", "name": "T", "kind": "ding", "children": [{"name": "c"}]}, 3]
    raw["lists"] = [{"id": "l", "name": "L", "entries": [{"id": "e"}, 4]}, 7]
    raw["synonyms"] = [["a", "b"], "x", [1, 2]]
    raw["settings"] = {"lent_days": 0, "foo": 1}
    raw["meta"] = {"created": "x", "sample": {"nodes": "nein"}}
    messages = _problems(raw)
    assert len(messages) >= 12


def test_settings_meta_and_sample_roundtrip() -> None:
    raw = _base()
    raw["settings"] = {"lent_days": 14, "stale_days": 100, "trash_days": 7}
    raw["meta"]["sample"] = {"nodes": ["a"], "persons": ["p"], "templates": ["t"], "lists": ["l"]}
    data, problems = parse_inventory(raw)
    assert problems == [] and data is not None
    assert data.settings.lent_days == 14 and data.settings.trash_days == 7
    assert data.to_dict()["settings"] == raw["settings"]
    assert data.meta.sample is not None and data.meta.sample.nodes == ["a"]


def test_full_node_roundtrip() -> None:
    raw = _base()
    raw["nodes"]["x1"] = {
        "name": "Voll",
        "kind": "ding",
        "parent": "unsortiert",
        "number": 5,
        "aliases": ["a"],
        "tags": ["t"],
        "note": "n",
        "quantity": 2.5,
        "unit": "kg",
        "min_quantity": 1,
        "condition": "defective",
        "checkout": {
            "type": "out",
            "to": "Dach",
            "since": "2026-10-01",
            "until": "2026-10-20",
            "note": "x",
        },
        "fields": {"price": 3},
        "maintenance": [
            {
                "id": "m1",
                "title": "Ölen",
                "interval": {"value": 2, "unit": "weeks"},
                "next_due": "2026-11-01",
                "note": "n",
                "log": [{"date": "2026-09-01", "note": "ok"}],
            }
        ],
        "attachments": [{"file": "a.pdf"}],
        "created": "2026-10-01T10:00:00+02:00",
        "modified": "2026-10-02T10:00:00+02:00",
        "verified": "2026-10-03",
    }
    data, problems = parse_inventory(raw)
    assert problems == [] and data is not None
    assert data.to_dict()["nodes"]["x1"] == raw["nodes"]["x1"]


def test_date_helpers() -> None:
    assert is_iso_date("2026-02-28") and not is_iso_date("2026-02-30")
    assert not is_iso_date("20261001") and not is_iso_date(5)
    assert is_iso_datetime("2026-10-10T09:00:00+02:00") and not is_iso_datetime("2026-10-10")


def test_trashed_roundtrip(inv: Inventory, clock: FakeClock) -> None:
    node = inv.create_node("Weg", "ding")
    inv.delete_node(node.id)
    data, problems = parse_inventory(json.loads(json.dumps(inv.data.to_dict())))
    assert problems == [] and data is not None
    assert data.nodes[node.id].trashed is not None
