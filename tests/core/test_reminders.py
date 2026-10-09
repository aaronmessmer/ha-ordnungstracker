"""Fälligkeiten an Datumsgrenzen, Ereignis-Merker, Kalender (Pflichtenheft 8.8, 9.5, 9.6)."""

from __future__ import annotations

import json
from datetime import date

import pytest

from custom_components.ordnungstracker.core.inventory import Inventory
from custom_components.ordnungstracker.core.model import CheckoutType, Condition
from custom_components.ordnungstracker.core.overview import build_overview
from custom_components.ordnungstracker.core.reminders import (
    Category,
    calendar_events,
    collect_due,
    due_by_category,
    list_checkouts,
    new_due_items,
    stale_nodes,
)

from .conftest import FakeClock, by_name


def items(inv: Inventory, category: Category) -> list[tuple[str, int | None, bool]]:
    return [(i.node_name, i.days, i.overdue) for i in collect_due(inv) if i.category is category]


# -- Ablauf / Garantie --------------------------------------------------------------------
@pytest.mark.parametrize(
    ("expiry", "expected"),
    [
        ("2026-11-09", (30, False)),  # genau 30 Tage vorher: fällig
        ("2026-11-10", None),  # 31 Tage: noch nicht
        ("2026-10-10", (0, False)),  # heute
        ("2026-10-09", (-1, True)),  # gestern: abgelaufen
    ],
)
def test_expiry_boundaries(inv: Inventory, expiry: str, expected: tuple[int, bool] | None) -> None:
    inv.create_node("Milch", "ding", fields={"expiry": expiry})
    result = items(inv, Category.EXPIRING)
    assert result == ([] if expected is None else [("Milch", expected[0], expected[1])])


def test_all_date_fields_with_reminder_count_including_warranty(inv: Inventory) -> None:
    inv.create_node("Bohrer", "ding", fields={"warranty_until": "2026-10-20", "purchase_date": "2026-10-11"})
    due = collect_due(inv)
    assert [(i.category, i.detail) for i in due] == [
        (Category.EXPIRING, "Garantie bis")
    ]  # Kaufdatum hat keine Erinnerung


def test_custom_reminder_window_and_hidden_fields(inv: Inventory) -> None:
    from custom_components.ordnungstracker.core.model import FieldType

    fd = inv.add_field_def("TÜV", FieldType.DATE, remind_days_before=60)
    inv.create_node("Auto", "ding", fields={fd.id: "2026-12-01"})
    assert [i.detail for i in collect_due(inv)] == ["TÜV"]
    inv.update_field_def(fd.id, {"hidden": True})
    assert collect_due(inv) == []
    inv.update_field_def(fd.id, {"hidden": False, "remind_days_before": 10})
    assert collect_due(inv) == []


def test_orphaned_values_do_not_remind(sample: Inventory) -> None:
    from custom_components.ordnungstracker.core.model import FieldType

    fd = sample.add_field_def("Nur Kisten", FieldType.DATE, kinds=["kiste"], remind_days_before=999)
    ding = by_name(sample, "Schere")
    sample.node(ding).fields[fd.id] = "2026-10-11"  # Wert ohne gültige Zuordnung (von Hand)
    assert not any(i.detail == "Nur Kisten" for i in collect_due(sample))


# -- Rückgabe -----------------------------------------------------------------------------
def test_checkout_overdue_with_date(inv: Inventory) -> None:
    node = inv.create_node("Leiter", "ding")
    inv.checkout_node(node.id, CheckoutType.LENT, "Bernd", since="2026-10-01", until="2026-10-10")
    assert items(inv, Category.CHECKOUT_OVERDUE) == []  # heute ist noch rechtzeitig
    inv.checkout_node(node.id, CheckoutType.LENT, "Bernd", since="2026-10-01", until="2026-10-09")
    assert items(inv, Category.CHECKOUT_OVERDUE) == [("Leiter", -1, True)]


@pytest.mark.parametrize(("since", "flagged"), [("2026-09-10", False), ("2026-09-09", True)])
def test_lent_without_date_after_30_days(inv: Inventory, since: str, flagged: bool) -> None:
    node = inv.create_node("Pistole", "ding")
    inv.checkout_node(node.id, CheckoutType.LENT, "Huber", since=since)
    assert bool(items(inv, Category.CHECKOUT_OVERDUE)) is flagged  # länger als 30 Tage


def test_lent_threshold_is_configurable_and_out_is_exempt(inv: Inventory) -> None:
    a = inv.create_node("A", "ding")
    b = inv.create_node("B", "ding")
    inv.checkout_node(a.id, CheckoutType.LENT, "x", since="2026-10-05")
    inv.checkout_node(b.id, CheckoutType.OUT, "Keller", since="2026-01-01")  # "out" ohne Datum: nie auffällig
    assert items(inv, Category.CHECKOUT_OVERDUE) == []
    inv.update_settings(lent_days=3)
    assert [n for n, *_ in items(inv, Category.CHECKOUT_OVERDUE)] == ["A"]


# -- Mindestbestand, Wartung, vermisst ----------------------------------------------------
def test_below_min_quantity(inv: Inventory) -> None:
    inv.create_node("Genau", "ding", quantity=5, min_quantity=5)
    inv.create_node("Knapp", "ding", quantity=4, min_quantity=5)
    inv.create_node("Null", "ding", quantity=0, min_quantity=1)
    inv.create_node("Unbekannt", "ding", min_quantity=1)
    assert sorted(n for n, *_ in items(inv, Category.BELOW_MIN)) == ["Knapp", "Null"]


@pytest.mark.parametrize(
    ("due", "flagged"), [("2026-10-11", False), ("2026-10-10", True), ("2026-10-09", True)]
)
def test_maintenance_due_boundaries(inv: Inventory, due: str, flagged: bool) -> None:
    node = inv.create_node("Heizung", "ding")
    inv.add_maintenance(node.id, "Wartung", next_due=due)
    assert bool(items(inv, Category.MAINTENANCE)) is flagged


def test_missing(inv: Inventory) -> None:
    inv.create_node("Schal", "ding", condition=Condition.MISSING)
    assert items(inv, Category.MISSING) == [("Schal", None, False)]


def test_archived_trash_and_system_are_ignored(inv: Inventory) -> None:
    gone = inv.create_node("Weg", "ding", quantity=0, min_quantity=1, condition=Condition.MISSING)
    entsorgt = inv.create_node("Alt", "ding", quantity=0, min_quantity=1)
    inv.set_condition(entsorgt.id, Condition.DISPOSED)
    inv.delete_node(gone.id)
    assert collect_due(inv) == []


def test_sample_has_every_rubric(sample: Inventory) -> None:
    grouped = due_by_category(sample)
    assert {c: len(v) for c, v in grouped.items() if v}.keys() == set(Category)
    # dringendstes zuerst
    expiring = grouped[Category.EXPIRING]
    assert [i.days for i in expiring] == sorted(i.days for i in expiring if i.days is not None)


# -- Merker für Ereignisse ----------------------------------------------------------------
def test_new_due_items_reports_once_and_can_retrigger(inv: Inventory) -> None:
    node = inv.create_node("Milch", "ding", fields={"expiry": "2026-10-12"})
    current = collect_due(inv)
    new, reported = new_due_items(current, set())
    assert [i.node_name for i in new] == ["Milch"]
    again, reported = new_due_items(collect_due(inv), reported)
    assert again == []  # schon gemeldet
    inv.set_field_value(node.id, "expiry", "2026-12-12")  # nicht mehr fällig
    nothing, reported = new_due_items(collect_due(inv), reported)
    assert nothing == [] and reported == set()
    inv.set_field_value(node.id, "expiry", "2026-10-13")  # neues Datum: neue Meldung
    retrigger, _ = new_due_items(collect_due(inv), reported)
    assert len(retrigger) == 1


def test_due_item_key_is_stable(inv: Inventory) -> None:
    node = inv.create_node("Milch", "ding", fields={"expiry": "2026-10-12"})
    (item,) = collect_due(inv)
    assert item.key == f"expiring|{node.id}|expiry|2026-10-12"


# -- Entnommen-Übersicht ------------------------------------------------------------------
def test_list_checkouts_sorted_by_duration(sample: Inventory) -> None:
    result = list_checkouts(sample)
    assert [c.node_name for c in result] == ["Heißklebepistole", "Leiter", "Christbaumschmuck"]
    assert result[0].days_out == 45 and not result[0].overdue
    assert result[1].overdue and result[2].until == "2026-11-09"


# -- Kalender -----------------------------------------------------------------------------
def test_calendar_events(sample: Inventory) -> None:
    events = calendar_events(sample, date(2026, 10, 1), date(2026, 12, 31))
    titles = [e.title for e in events]
    assert "Ablaufdatum: Nudeln" in titles
    assert "Garantie bis: Bohrmaschine" in titles
    assert any(t.startswith("Rückgabe: Leiter") for t in titles)
    assert any(t.startswith("Wartung: Wartung durch den Installateur") for t in titles)
    assert [e.day for e in events] == sorted(e.day for e in events)
    only_oct = calendar_events(sample, date(2026, 10, 5), date(2026, 10, 9))
    assert [e.title for e in only_oct if e.category == "maintenance"] == [
        "Wartung: Wartung durch den Installateur (Heizung)"
    ]
    assert calendar_events(sample, date(2020, 1, 1), date(2020, 1, 2)) == []


# -- lange nicht bestätigt ----------------------------------------------------------------
def test_stale_nodes(inv: Inventory, clock: FakeClock) -> None:
    alt = inv.create_node("Alt", "ding")
    best = inv.create_node("Best", "ding")
    clock.advance(days=364)
    assert stale_nodes(inv) == set()
    clock.advance(days=1)
    assert stale_nodes(inv) == {alt.id, best.id}
    inv.verify_nodes([best.id])
    assert stale_nodes(inv) == {alt.id}
    inv.update_settings(stale_days=1)
    clock.advance(days=2)
    assert stale_nodes(inv) == {alt.id, best.id}


# -- Übersicht ----------------------------------------------------------------------------
def test_overview_numbers(sample: Inventory) -> None:
    over = build_overview(sample)
    assert over.containers == 8 and over.items > 30
    assert over.checked_out == 3 and over.checked_out_overdue == 1
    assert over.unsorted == 1
    assert over.next_free_number == 1
    assert over.due["missing"] == 1 and over.due["below_min"] == 2
    assert over.total_value is not None and over.total_value == pytest.approx(3.6 + 129 + 349)
    assert over.value_per_place == {"Werkstatt": 129.0, "Küche": 3.6, "Garage": 349.0}
    assert by_name(sample, "Erste-Hilfe-Tasche") not in over.empty_containers


def test_overview_empty_containers_and_no_prices(inv: Inventory) -> None:
    kiste = inv.create_node("Leer", "kiste", number="auto")
    over = build_overview(inv)
    assert over.empty_containers == [kiste.id] and over.total_value is None
    assert over.containers == 1 and over.items == 0


def test_diagnostics_summary_has_numbers_but_no_content(sample: Inventory) -> None:
    from custom_components.ordnungstracker.core.overview import diagnostics_summary

    summary = diagnostics_summary(sample)
    assert summary["nodes"] == len(sample.data.nodes) and summary["nodes_by_class"]["container"] == 8
    assert summary["checked_out"] == 3 and summary["numbered"] == 8 and summary["lists"] == 1
    assert summary["custom_fields"] == 1 and summary["local_fields"] == 1 and summary["sample_loaded"] is True
    assert summary["max_depth"] == 4
    text = json.dumps(summary, ensure_ascii=False)
    for secret in ("Heißklebepistole", "Huber", "Papa", "Keller", "Schere", "Basteln", "Bosch", "SN-4711"):
        assert secret not in text, secret  # keine Namen oder Inhalte
