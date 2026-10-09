"""Gemeinsame Hilfen der Kerntests."""

from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone

import pytest

from custom_components.ordnungstracker.core.defaults import new_inventory_data
from custom_components.ordnungstracker.core.inventory import Inventory
from custom_components.ordnungstracker.core.sample import load_sample

TZ = timezone(timedelta(hours=2))


class FakeClock:
    """Steuerbare Uhr für Tests (Datumsgrenzen!)."""

    def __init__(self, moment: datetime | None = None) -> None:
        self.moment = moment or datetime(2026, 10, 10, 9, 0, 0, tzinfo=TZ)

    def __call__(self) -> datetime:
        return self.moment

    def advance(self, **kwargs: float) -> None:
        self.moment += timedelta(**kwargs)

    def set_day(self, year: int, month: int, day: int) -> None:
        self.moment = self.moment.replace(year=year, month=month, day=day)


@pytest.fixture
def clock() -> FakeClock:
    return FakeClock()


@pytest.fixture
def inv(clock: FakeClock) -> Inventory:
    """Leeres, gültiges Inventar (Standardarten, mitgelieferte Felder, Systemknoten)."""
    return Inventory(
        new_inventory_data(clock().isoformat(timespec="seconds")), clock=clock, rng=random.Random(7)
    )


@pytest.fixture
def sample(inv: Inventory) -> Inventory:
    """Inventar mit Beispielhaushalt."""
    load_sample(inv)
    inv.drain_changes()
    return inv


def by_name(inv: Inventory, name: str) -> str:
    """Kennung des (ersten) Knotens mit diesem Namen."""
    for node in inv.data.nodes.values():
        if node.name == name:
            return node.id
    raise AssertionError(f"Knoten {name!r} nicht gefunden")
