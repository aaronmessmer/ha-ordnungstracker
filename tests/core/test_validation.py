"""Regeln aus Pflichtenheft 5.14 beim Laden (Datei von Hand kaputt gemacht)."""

from __future__ import annotations

import copy
from typing import Any

from custom_components.ordnungstracker.core.defaults import new_inventory_data
from custom_components.ordnungstracker.core.errors import Problem
from custom_components.ordnungstracker.core.inventory import Inventory
from custom_components.ordnungstracker.core.model import FieldDef, FieldScope, FieldType, ScopeType
from custom_components.ordnungstracker.core.parse import parse_inventory
from custom_components.ordnungstracker.core.validation import (
    field_value_error,
    unusual_placement,
    validate_inventory,
)

from .conftest import by_name


def _check(raw: dict[str, Any]) -> list[Problem]:
    data, problems = parse_inventory(raw)
    assert data is not None, problems
    return validate_inventory(data)


def _raw() -> dict[str, Any]:
    return copy.deepcopy(new_inventory_data("2026-10-10T09:00:00+02:00").to_dict())


def _codes(problems: list[Problem]) -> set[str]:
    return {p.code for p in problems}


def test_valid_default_and_sample(inv: Inventory, sample: Inventory) -> None:
    assert validate_inventory(inv.data) == []
    assert validate_inventory(sample.data) == []


def test_missing_parent_names_the_node() -> None:
    raw = _raw()
    raw["nodes"]["x1"] = {"name": "Hammer", "kind": "ding", "parent": "weg"}
    problems = _check(raw)
    assert _codes(problems) == {"missing_parent"}
    assert problems[0].node_name == "Hammer" and "weg" in problems[0].message


def test_self_parent_and_cycle() -> None:
    raw = _raw()
    raw["nodes"]["a"] = {"name": "A", "kind": "kiste", "parent": "a"}
    raw["nodes"]["b"] = {"name": "B", "kind": "kiste", "parent": "c"}
    raw["nodes"]["c"] = {"name": "C", "kind": "kiste", "parent": "b"}
    problems = _check(raw)
    assert _codes(problems) == {"cycle"}
    assert len(problems) == 2
    assert any("Kreis" in p.message and "B" in p.message and "C" in p.message for p in problems)


def test_duplicate_numbers() -> None:
    raw = _raw()
    raw["nodes"]["a"] = {"name": "A", "kind": "kiste", "number": 3}
    raw["nodes"]["b"] = {"name": "B", "kind": "kiste", "number": 3}
    problems = _check(raw)
    assert _codes(problems) == {"duplicate_number"}
    assert "3" in problems[0].message


def test_a_group_kind_is_required() -> None:
    raw = _raw()
    raw["kinds"] = [k for k in raw["kinds"] if k["class"] != "group"]
    assert _codes(_check(raw)) == {"no_group_kind"}


def test_unknown_kind_person_field() -> None:
    raw = _raw()
    raw["nodes"]["a"] = {"name": "A", "kind": "unbekannt", "owner": "niemand", "fields": {"nix": 1}}
    assert _codes(_check(raw)) == {"missing_kind", "missing_person", "missing_field"}


def test_field_value_types() -> None:
    raw = _raw()
    raw["nodes"]["a"] = {
        "name": "A",
        "kind": "ding",
        "fields": {"expiry": "morgen", "price": "teuer"},
    }
    problems = _check(raw)
    assert _codes(problems) == {"field_value"}
    assert len(problems) == 2


def test_system_nodes_must_exist_and_stay_on_top() -> None:
    raw = _raw()
    del raw["nodes"]["papierkorb"]
    raw["nodes"]["unsortiert"]["parent"] = "papierkorb"
    assert _codes(_check(raw)) >= {"system_missing"}
    raw2 = _raw()
    raw2["nodes"]["unsortiert"]["parent"] = "papierkorb"
    assert "system_moved" in _codes(_check(raw2))


def test_local_field_must_point_to_existing_node() -> None:
    raw = _raw()
    raw["fields"].append(
        {"id": "k", "name": "Körnung", "type": "number", "scope": {"type": "local", "node": "weg"}}
    )
    raw["fields"].append({"id": "l", "name": "Lokal", "type": "text", "scope": {"type": "local"}})
    raw["fields"].append(
        {"id": "g", "name": "Global", "type": "text", "scope": {"type": "global", "node": "x"}}
    )
    raw["fields"].append({"id": "c", "name": "Wahl", "type": "choice"})
    raw["fields"].append({"id": "r", "name": "Rem", "type": "text", "remind_days_before": 3, "kinds": ["xx"]})
    assert _codes(_check(raw)) == {"missing_node", "scope", "options", "remind", "missing_kind"}


def test_lists_and_templates_references() -> None:
    raw = _raw()
    raw["lists"] = [
        {
            "id": "l",
            "name": "L",
            "entries": [{"id": "e1", "node": "weg"}, {"id": "e1", "text": "x"}],
        }
    ]
    raw["templates"] = [
        {
            "id": "t",
            "name": "T",
            "kind": "nix",
            "owner": "jemand",
            "children": [{"name": "c", "kind": "nope"}],
        }
    ]
    assert _codes(_check(raw)) == {
        "missing_node",
        "duplicate_entry",
        "missing_kind",
        "missing_person",
    }


def test_trash_info_only_directly_in_trash() -> None:
    raw = _raw()
    raw["nodes"]["a"] = {
        "name": "A",
        "kind": "ding",
        "trashed": {"at": "2026-10-01T10:00:00+02:00"},
    }
    raw["nodes"]["b"] = {
        "name": "B",
        "kind": "ding",
        "maintenance": [{"id": "m", "title": "x"}, {"id": "m", "title": "y"}],
    }
    assert _codes(_check(raw)) == {"trash_info", "duplicate_task"}


def test_field_value_error_per_type() -> None:
    def fd(t: FieldType) -> FieldDef:
        return FieldDef("f", "F", t, scope=FieldScope(ScopeType.GLOBAL))

    assert field_value_error(fd(FieldType.TEXT), "x") is None
    assert field_value_error(fd(FieldType.TEXT), 1) is not None
    assert field_value_error(fd(FieldType.MULTILINE), "a\nb") is None
    assert field_value_error(fd(FieldType.LINK), "https://x") is None
    assert field_value_error(fd(FieldType.NUMBER), 3.5) is None
    assert field_value_error(fd(FieldType.NUMBER), True) is not None
    assert field_value_error(fd(FieldType.DATE), "2026-10-10") is None
    assert field_value_error(fd(FieldType.DATE), "10.10.2026") is not None
    assert field_value_error(fd(FieldType.BOOL), False) is None
    assert field_value_error(fd(FieldType.BOOL), "ja") is not None
    assert field_value_error(fd(FieldType.CHOICE), "a") is None
    assert field_value_error(fd(FieldType.CHOICE), 1) is not None


def test_unusual_placement_is_a_hint_not_an_error(sample: Inventory) -> None:
    pistole = sample.data.nodes[by_name(sample, "Heißklebepistole")]
    keller = sample.data.nodes[by_name(sample, "Keller")]
    kiste = sample.data.nodes[by_name(sample, "Basteln")]
    regal = sample.data.nodes[by_name(sample, "Regal B")]
    assert unusual_placement(sample.data, keller, pistole) is not None  # Raum in Ding
    assert unusual_placement(sample.data, kiste, pistole) is not None  # Kiste in Ding
    assert unusual_placement(sample.data, regal, keller) is None
    assert unusual_placement(sample.data, regal, None) is None
    wohn = sample.data.nodes[by_name(sample, "Wohnzimmer")]
    assert unusual_placement(sample.data, wohn, regal) is not None  # Raum in Regal
