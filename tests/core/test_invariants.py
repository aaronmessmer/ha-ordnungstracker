"""Die Regeln aus 5.14 gelten nach jeder Operation – auch bei zufälligen Folgen (Fuzz)."""

from __future__ import annotations

import ast
import contextlib
import random
from pathlib import Path

import pytest

from custom_components.ordnungstracker.core.defaults import new_inventory_data
from custom_components.ordnungstracker.core.errors import InventoryError
from custom_components.ordnungstracker.core.inventory import Inventory
from custom_components.ordnungstracker.core.model import CheckoutType, Condition, FieldType
from custom_components.ordnungstracker.core.parse import parse_inventory
from custom_components.ordnungstracker.core.validation import validate_inventory

from .conftest import FakeClock

CORE = Path(__file__).resolve().parents[2] / "custom_components" / "ordnungstracker" / "core"


def test_core_does_not_import_home_assistant() -> None:
    """Architektur (Pflichtenheft 4): Der Kern kennt Home Assistant nicht."""
    offenders: list[str] = []
    for path in CORE.glob("*.py"):
        for node in ast.walk(ast.parse(path.read_text("utf-8"))):
            names: list[str] = []
            if isinstance(node, ast.Import):
                names = [a.name for a in node.names]
            elif isinstance(node, ast.ImportFrom):
                names = [node.module or ""]
            offenders += [f"{path.name}: {n}" for n in names if n.split(".")[0] == "homeassistant"]
    assert offenders == []


@pytest.mark.parametrize("seed", range(12))
def test_random_operations_never_break_the_rules(seed: int, clock: FakeClock) -> None:
    rnd = random.Random(seed)
    inv = Inventory(new_inventory_data("2026-10-10T09:00:00+02:00"), clock=clock, rng=random.Random(seed))
    person = inv.add_person("P")
    inv.create_node("Basis", "raum")
    field = inv.add_field_def("Wahl", FieldType.CHOICE, options=["a", "b"])
    liste = inv.create_list("L")

    def pick(include_system: bool = False) -> str:
        ids = [i for i in inv.data.nodes if include_system or i not in ("unsortiert", "papierkorb")]
        return rnd.choice(ids or ["gibtsnicht"])

    operations = [
        lambda: inv.create_node(
            f"N{rnd.randint(0, 99)}",
            rnd.choice(list(inv.data.kinds)),
            rnd.choice([None, pick()]),
            number=rnd.choice([None, "auto", rnd.randint(1, 20)]),
            owner=rnd.choice([None, person.id]),
        ),
        lambda: inv.update_node(
            pick(),
            {
                "kind": rnd.choice(list(inv.data.kinds)),
                "number": rnd.choice([None, rnd.randint(1, 20)]),
                "owner": rnd.choice([None, person.id]),
            },
        ),
        lambda: inv.move_nodes(
            rnd.sample(list(inv.data.nodes), k=min(3, len(inv.data.nodes))),
            rnd.choice([None, *inv.data.nodes]),
        ),
        lambda: inv.delete_node(pick(), rnd.choice(["trash", "lift"])),
        lambda: inv.restore_node(rnd.choice(inv.tree.children_ids("papierkorb") or ["x"])),
        lambda: inv.purge_node(rnd.choice(inv.tree.children_ids("papierkorb") or ["x"])),
        lambda: inv.empty_trash() if rnd.random() < 0.2 else inv.purge_expired_trash(),
        lambda: inv.set_field_value(pick(), field.id, rnd.choice(["a", "b", "c", None])),
        lambda: inv.checkout_node(pick(), CheckoutType.LENT, "Jemand"),
        lambda: inv.return_node(pick()),
        lambda: inv.add_list_entry(liste.id, node=pick()),
        lambda: inv.set_condition(pick(), rnd.choice(list(Condition))),
        lambda: inv.add_field_def("Lokal", FieldType.TEXT, scope_node=pick()),
        lambda: inv.delete_kind(rnd.choice(list(inv.data.kinds)), rnd.choice([None, *inv.data.kinds])),
        lambda: inv.delete_person(person.id) if rnd.random() < 0.1 else inv.add_person("Q"),
        lambda: inv.create_from_template(rnd.choice(list(inv.data.templates) or ["x"]), pick()),
    ]
    for _ in range(250):
        # abgelehnte Eingaben sind in Ordnung; das Ergebnis muss trotzdem gültig bleiben
        with contextlib.suppress(InventoryError):
            rnd.choice(operations)()
        problems = validate_inventory(inv.data)
        assert problems == [], problems[:2]
        clock.advance(hours=rnd.randint(0, 20))
        if rnd.random() < 0.1 and not inv.data.templates:
            inv.add_template("T", rnd.choice(list(inv.data.kinds)))
    # Serialisierung bleibt verlustfrei
    data, parse_problems = parse_inventory(inv.data.to_dict())
    assert parse_problems == [] and data is not None and data.to_dict() == inv.data.to_dict()
