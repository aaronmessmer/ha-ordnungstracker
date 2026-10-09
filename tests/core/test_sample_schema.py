"""Beispielinventar, JSON-Schema und Beispieldaten-Funktion (Pflichtenheft 6.2, 8.14, 11)."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

import jsonschema
import pytest

from custom_components.ordnungstracker.core import jsonio
from custom_components.ordnungstracker.core.defaults import new_inventory_data
from custom_components.ordnungstracker.core.errors import InvalidValueError
from custom_components.ordnungstracker.core.inventory import Inventory
from custom_components.ordnungstracker.core.model import TRASH_ID, UNSORTED_ID
from custom_components.ordnungstracker.core.sample import (
    build_example_inventory,
    is_pristine,
    load_sample,
    remove_sample,
)
from custom_components.ordnungstracker.core.store import parse_inventory_text
from custom_components.ordnungstracker.core.validation import validate_inventory

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = json.loads((ROOT / "docs" / "inventar.schema.json").read_text("utf-8"))
EXAMPLES = sorted((ROOT / "beispiele").glob("*.json"))


def test_schema_is_itself_valid() -> None:
    jsonschema.Draft202012Validator.check_schema(SCHEMA)


@pytest.mark.parametrize("path", EXAMPLES, ids=lambda p: p.name)
def test_every_example_file_matches_schema_and_rules(path: Path) -> None:
    text = path.read_text("utf-8")
    jsonschema.validate(json.loads(text), SCHEMA)
    data, _ = parse_inventory_text(text)  # Regeln aus 5.14
    assert validate_inventory(data) == []


def test_there_is_at_least_the_household_example() -> None:
    assert any(p.name == "beispiel-haushalt.json" for p in EXAMPLES)


def test_example_file_is_up_to_date() -> None:
    expected = jsonio.dumps(build_example_inventory().data.to_dict())
    actual = (ROOT / "beispiele" / "beispiel-haushalt.json").read_text("utf-8")
    assert actual == expected, (
        "beispiele/beispiel-haushalt.json ist veraltet. Neu erzeugen mit: "
        "python -m custom_components.ordnungstracker.core.sample beispiele/beispiel-haushalt.json"
    )


def test_fresh_inventory_and_sample_match_schema(inv: Inventory, sample: Inventory) -> None:
    jsonschema.validate(json.loads(jsonio.dumps(inv.data.to_dict())), SCHEMA)
    jsonschema.validate(json.loads(jsonio.dumps(sample.data.to_dict())), SCHEMA)


def _mutated(**changes: Any) -> dict[str, Any]:
    raw = copy.deepcopy(new_inventory_data("2026-10-10T09:00:00+02:00").to_dict())
    raw["nodes"]["x"] = {"name": "X", "kind": "ding", **changes}
    return raw


@pytest.mark.parametrize(
    "changes",
    [
        {"number": 0},
        {"number": "3"},
        {"quantity": -1},
        {"condition": "kaputt"},
        {"nummer": 3},
        {"checkout": {"type": "lent", "to": "X"}},
        {"checkout": {"type": "gone", "to": "X", "since": "2026-10-01"}},
        {"created": "gestern"},
        {"tags": "a"},
        {"maintenance": [{"title": "t"}]},
        {"fields": {"price": [1]}},
        {"name": ""},
    ],
)
def test_schema_rejects_bad_nodes(changes: dict[str, Any]) -> None:
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(_mutated(**changes), SCHEMA)


def test_schema_rejects_bad_top_level() -> None:
    for patch in (
        {"schema_version": 2},
        {"surprise": 1},
        {"kinds": [{"id": "k", "name": "K", "class": "x"}]},
        {"fields": [{"id": "f", "name": "F", "type": "text", "scope": {"type": "local"}}]},
        {"lists": [{"id": "l", "name": "L", "entries": [{"id": "e"}]}]},
        {"synonyms": [["allein"]]},
    ):
        raw = _mutated()
        raw.update(patch)
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate(raw, SCHEMA)


# -- Beispieldaten laden / entfernen (8.14) -----------------------------------------------
def test_sample_has_about_60_nodes_and_every_feature(sample: Inventory) -> None:
    sample_nodes = sample.data.meta.sample
    assert sample_nodes is not None and 55 <= len(sample_nodes.nodes) <= 70
    nodes = list(sample.data.nodes.values())
    assert any(n.number for n in nodes) and any(n.aliases for n in nodes) and any(n.tags for n in nodes)
    assert (
        any(n.owner for n in nodes) and any(n.checkout for n in nodes) and any(n.maintenance for n in nodes)
    )
    assert any(n.quantity is not None for n in nodes) and any(n.min_quantity is not None for n in nodes)
    assert any(n.condition.value == "disposed" for n in nodes)
    assert any(n.verified for n in nodes) and any(n.note for n in nodes)
    assert sample.data.lists and sample.data.templates and sample.data.synonyms
    assert any(not f.builtin for f in sample.data.fields.values())  # lokales Feld
    assert validate_inventory(sample.data) == []


def test_sample_only_loads_into_empty_inventory(inv: Inventory) -> None:
    assert is_pristine(inv)
    inv.create_node("Eigenes", "ding")
    assert not is_pristine(inv)
    with pytest.raises(InvalidValueError, match="leeres Inventar"):
        load_sample(inv)


def test_remove_sample_restores_pristine_state(inv: Inventory) -> None:
    before = inv.data.to_dict()
    count = load_sample(inv)
    removed = remove_sample(inv)
    assert removed == count
    after = inv.data.to_dict()
    for key in ("meta",):
        before.pop(key), after.pop(key)
    # Felder: die Körnung gehörte zum Beispiel und ist weg
    assert after == before
    assert set(inv.data.nodes) == {UNSORTED_ID, TRASH_ID}
    assert validate_inventory(inv.data) == []


def test_remove_sample_keeps_own_entries(sample: Inventory) -> None:
    from .conftest import by_name

    kiste = by_name(sample, "Basteln")
    mine = sample.create_node("Mein eigenes Ding", "ding", kiste)
    sample.checkout_node(
        mine.id,
        __import__("custom_components.ordnungstracker.core.model", fromlist=["x"]).CheckoutType.OUT,
        "x",
    )
    remove_sample(sample)
    assert sample.node(mine.id).parent == UNSORTED_ID  # gerettet
    assert "Basteln" not in {n.name for n in sample.data.nodes.values()}
    assert sample.data.meta.sample is None
    assert validate_inventory(sample.data) == []
    with pytest.raises(InvalidValueError, match="keine Beispieldaten"):
        remove_sample(sample)
