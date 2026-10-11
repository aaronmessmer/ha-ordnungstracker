"""Arten, Personen, Felder, Entnahme, Menge, Wartung, Listen, Vorlagen, Inventur."""

from __future__ import annotations

import pytest

from custom_components.ordnungstracker.core.errors import (
    InUseError,
    InvalidValueError,
    NotFoundError,
)
from custom_components.ordnungstracker.core.inventory import Inventory
from custom_components.ordnungstracker.core.model import (
    CheckoutType,
    Condition,
    FieldType,
    Interval,
    IntervalUnit,
    KindClass,
    TemplateNode,
)
from custom_components.ordnungstracker.core.validation import validate_inventory

from .conftest import FakeClock, by_name


def _ok(inv: Inventory) -> None:
    assert validate_inventory(inv.data) == []


# -- Arten --------------------------------------------------------------------------------
def test_custom_kind_lifecycle(inv: Inventory) -> None:
    kind = inv.add_kind("Schublade", KindClass.FURNITURE, icon="mdi:inbox", numbered=True)
    assert kind.id == "schublade"
    assert inv.add_kind("Schublade", KindClass.FURNITURE).id == "schublade_2"
    node = inv.create_node("Oben", kind.id)
    inv.update_kind(kind.id, {"name": "Lade", "icon": "mdi:x", "numbered": False})
    assert inv.data.kinds["schublade"].name == "Lade"
    with pytest.raises(InUseError, match="Ersatz"):
        inv.delete_kind("schublade")
    inv.delete_kind("schublade", replacement="regal")
    assert inv.node(node.id).kind == "regal"
    inv.delete_kind("schublade_2")  # unbenutzt
    _ok(inv)


def test_kind_errors(inv: Inventory) -> None:
    with pytest.raises(InvalidValueError):
        inv.add_kind(" ", KindClass.ITEM)
    with pytest.raises(InvalidValueError):
        inv.add_kind("X", KindClass.ITEM, kind_id="ding")
    with pytest.raises(NotFoundError):
        inv.update_kind("nix", {})
    with pytest.raises(InvalidValueError):
        inv.update_kind("ding", {"bogus": 1})
    with pytest.raises(InvalidValueError):
        inv.update_kind("ding", {"name": ""})
    inv.create_node("a", "ding")
    with pytest.raises(NotFoundError):
        inv.delete_kind("ding", replacement="nix")
    with pytest.raises(InUseError, match="Gruppe"):
        inv.delete_kind("gruppe")
    with pytest.raises(InUseError, match="Gruppe"):
        inv.update_kind("gruppe", {"class": "item"})


def test_kind_class_change_and_replacement_with_children(inv: Inventory) -> None:
    box = inv.add_kind("Koffer", KindClass.CONTAINER)
    outer = inv.create_node("Koffer1", box.id)
    inv.create_node("Inhalt", "ding", outer.id)
    with pytest.raises(InvalidValueError):
        inv.update_kind(box.id, {"class": "item"})
    with pytest.raises(InvalidValueError, match="Unterpunkte"):
        inv.delete_kind(box.id, replacement="ding")
    inv.update_kind(box.id, {"class": "furniture"})
    assert inv.data.kinds[box.id].kind_class is KindClass.FURNITURE


def test_delete_kind_rewrites_templates_and_fields(inv: Inventory) -> None:
    inv.add_kind("Koffer", KindClass.CONTAINER)
    inv.add_template("Vorlage", "koffer", children=[TemplateNode("x", "koffer")])
    inv.add_field_def("Nur Koffer", FieldType.TEXT, kinds=["koffer"])
    inv.delete_kind("koffer", replacement="kiste")
    assert inv.data.templates[next(iter(inv.data.templates))].kind == "kiste"
    assert next(iter(inv.data.templates.values())).children[0].kind == "kiste"
    assert inv.data.fields["nur_koffer"].kinds == ["kiste"]
    _ok(inv)


def test_last_kind_cannot_be_deleted(inv: Inventory) -> None:
    for kid in [k for k in list(inv.data.kinds) if k not in ("gruppe", "raum")]:
        inv.delete_kind(kid, replacement="raum")
    inv.delete_kind("raum", replacement="gruppe")
    with pytest.raises(InUseError, match="letzte"):
        inv.delete_kind("gruppe")


# -- Personen -----------------------------------------------------------------------------
def test_person_lifecycle_and_owner_cleanup(inv: Inventory) -> None:
    papa = inv.add_person("Papa", "person.papa")
    node = inv.create_node("Werkstatt", "raum", owner=papa.id)
    tpl = inv.add_template("T", "kiste", owner=papa.id)
    inv.update_person(papa.id, {"name": "Vater", "ha_person": None})
    assert inv.data.persons[papa.id].ha_person is None
    assert inv.delete_person(papa.id) == 1
    assert inv.node(node.id).owner is None and inv.data.templates[tpl.id].owner is None
    _ok(inv)


def test_person_errors(inv: Inventory) -> None:
    with pytest.raises(InvalidValueError):
        inv.add_person("")
    inv.add_person("A", person_id="p")
    with pytest.raises(InvalidValueError):
        inv.add_person("B", person_id="p")
    with pytest.raises(NotFoundError):
        inv.delete_person("x")
    with pytest.raises(InvalidValueError):
        inv.update_person("p", {"x": 1})
    with pytest.raises(InvalidValueError):
        inv.update_person("p", {"name": " "})


# -- Felder -------------------------------------------------------------------------------
def test_field_values_are_validated(inv: Inventory) -> None:
    node = inv.create_node("Nudeln", "ding")
    inv.set_field_value(node.id, "expiry", "2026-12-01")
    inv.set_field_value(node.id, "price", 3.5)
    with pytest.raises(InvalidValueError, match="Datum"):
        inv.set_field_value(node.id, "expiry", "1.12.2026")
    with pytest.raises(NotFoundError):
        inv.set_field_value(node.id, "gibtsnicht", 1)
    inv.set_field_value(node.id, "expiry", None)
    assert "expiry" not in inv.node(node.id).fields
    inv.set_field_value(node.id, "vendor", "")  # leer = löschen
    _ok(inv)


def test_choice_fields_and_definition_errors(inv: Inventory) -> None:
    fd = inv.add_field_def("Farbe", FieldType.CHOICE, options=["rot", "blau", "rot"])
    assert fd.options == ["rot", "blau"]
    node = inv.create_node("Ball", "ding")
    inv.set_field_value(node.id, fd.id, "rot")
    with pytest.raises(InvalidValueError, match="Auswahl"):
        inv.set_field_value(node.id, fd.id, "grün")
    with pytest.raises(InvalidValueError):
        inv.add_field_def("Leer", FieldType.CHOICE)
    with pytest.raises(InvalidValueError):
        inv.add_field_def("", FieldType.TEXT)
    with pytest.raises(InvalidValueError):
        inv.add_field_def("Erinnerung", FieldType.TEXT, remind_days_before=3)
    with pytest.raises(NotFoundError):
        inv.add_field_def("X", FieldType.TEXT, kinds=["nix"])
    with pytest.raises(NotFoundError):
        inv.add_field_def("X", FieldType.TEXT, scope_node="nix")
    with pytest.raises(InvalidValueError):
        inv.add_field_def("Y", FieldType.TEXT, field_id="expiry")


def test_local_field_scope_and_orphans(sample: Inventory) -> None:
    from custom_components.ordnungstracker.core.fields import applicable_fields, field_view

    k80 = by_name(sample, "Schleifpapier K80")
    koernung = next(f for f in sample.data.fields.values() if f.name == "Körnung")
    bohrer = by_name(sample, "Bohrmaschine")
    assert koernung in applicable_fields(sample.tree, k80)
    assert koernung not in applicable_fields(sample.tree, bohrer)
    from custom_components.ordnungstracker.core.errors import InvalidValueError as IVE

    with pytest.raises(IVE, match="gilt für"):
        sample.set_field_value(bohrer, koernung.id, 5)
    # Verschieben aus dem Geltungsbereich: Wert bleibt, wird "nicht mehr zugeordnet"
    sample.move_nodes([k80], by_name(sample, "Garage"))
    assert sample.node(k80).fields[koernung.id] == 80
    view = {v.definition.id: v for v in field_view(sample.tree, k80)}
    assert view[koernung.id].assigned is False and view[koernung.id].value == 80
    assert _assigned_ids(sample, k80) >= {"expiry"}
    _ok(sample)


def _assigned_ids(inv: Inventory, node_id: str) -> set[str]:
    from custom_components.ordnungstracker.core.fields import field_view

    return {v.definition.id for v in field_view(inv.tree, node_id) if v.assigned}


def test_field_restrictions_by_kind_and_class(inv: Inventory) -> None:
    from custom_components.ordnungstracker.core.fields import applicable_fields

    inv.add_field_def("Nur Dinge", FieldType.TEXT, classes=[KindClass.ITEM], field_id="nd")
    inv.add_field_def("Nur Kisten", FieldType.TEXT, kinds=["kiste"], field_id="nk")
    ding = inv.create_node("D", "ding")
    kiste = inv.create_node("K", "kiste")
    assert {"nd", "nk"} & {f.id for f in applicable_fields(inv.tree, ding.id)} == {"nd"}
    assert {"nd", "nk"} & {f.id for f in applicable_fields(inv.tree, kiste.id)} == {"nk"}


def test_hidden_fields_not_applicable_by_default(inv: Inventory) -> None:
    from custom_components.ordnungstracker.core.fields import applicable_fields, field_view

    node = inv.create_node("D", "ding", fields={"vendor": "Aldi"})
    inv.update_field_def("vendor", {"hidden": True})
    assert "vendor" not in {f.id for f in applicable_fields(inv.tree, node.id)}
    assert "vendor" in {f.id for f in applicable_fields(inv.tree, node.id, include_hidden=True)}
    assert "vendor" not in {v.definition.id for v in field_view(inv.tree, node.id)}


def test_update_and_delete_field_def(inv: Inventory) -> None:
    fd = inv.add_field_def("Datum X", FieldType.DATE, remind_days_before=10)
    node = inv.create_node("A", "ding", fields={fd.id: "2026-11-01"})
    inv.update_field_def(
        fd.id,
        {
            "name": "Termin",
            "group": "G",
            "remind_days_before": 5,
            "kinds": ["ding"],
            "classes": ["item"],
            "unit": "",
            "hidden": False,
        },
    )
    assert inv.data.fields[fd.id].name == "Termin"
    with pytest.raises(InvalidValueError):
        inv.update_field_def(fd.id, {"remind_days_before": -1})
    with pytest.raises(InvalidValueError):
        inv.update_field_def(fd.id, {"type": "text"})
    with pytest.raises(InvalidValueError):
        inv.update_field_def(fd.id, {"name": " "})
    with pytest.raises(NotFoundError):
        inv.update_field_def(fd.id, {"kinds": ["nix"]})
    choice = inv.add_field_def("C", FieldType.CHOICE, options=["a"])
    with pytest.raises(InvalidValueError):
        inv.update_field_def(choice.id, {"options": []})
    inv.update_field_def(choice.id, {"options": ["a", "b"]})
    inv.delete_field_def(fd.id)
    assert fd.id not in inv.node(node.id).fields
    with pytest.raises(InUseError, match=r"ausblenden|Blende"):
        inv.delete_field_def("expiry")
    with pytest.raises(NotFoundError):
        inv.delete_field_def("expiry-x")
    _ok(inv)


# -- Entnahme -----------------------------------------------------------------------------
def test_checkout_keeps_home_and_return_is_one_step(sample: Inventory, clock: FakeClock) -> None:
    schere = by_name(sample, "Schere")
    before = sample.tree.path_names(schere)
    sample.checkout_node(schere, CheckoutType.LENT, "Nachbar Huber", until="2026-11-01", note="bis Samstag")
    node = sample.node(schere)
    assert node.checkout is not None and node.checkout.since == "2026-10-10"
    assert sample.tree.path_names(schere) == before  # Stammplatz bleibt
    sample.return_node(schere)
    assert sample.node(schere).checkout is None
    _ok(sample)


def test_checkout_validation(inv: Inventory) -> None:
    node = inv.create_node("A", "ding")
    with pytest.raises(InvalidValueError, match="wo"):
        inv.checkout_node(node.id, CheckoutType.OUT, "  ")
    with pytest.raises(InvalidValueError):
        inv.checkout_node(node.id, CheckoutType.OUT, "x", since="morgen")
    with pytest.raises(InvalidValueError, match="vor"):
        inv.checkout_node(node.id, CheckoutType.OUT, "x", since="2026-10-10", until="2026-10-01")
    with pytest.raises(InvalidValueError, match="gar nicht"):
        inv.return_node(node.id)
    from custom_components.ordnungstracker.core.errors import SystemNodeError

    with pytest.raises(SystemNodeError):
        inv.checkout_node("unsortiert", CheckoutType.OUT, "x")


def test_checkout_of_container_is_inherited_by_content(sample: Inventory) -> None:
    kiste = by_name(sample, "Camping")
    sample.checkout_node(kiste, CheckoutType.OUT, "im Urlaub")
    checkout, source = sample.tree.effective_checkout(by_name(sample, "Gaskocher"))
    assert checkout is not None and source == kiste
    assert sample.tree.effective_checkout(by_name(sample, "Schere")) == (None, None)


# -- Menge --------------------------------------------------------------------------------
def test_quantity_plus_minus_never_negative(inv: Inventory) -> None:
    node = inv.create_node("Batterien", "ding", quantity=1)
    assert inv.adjust_quantity(node.id, 3).quantity == 4
    assert inv.adjust_quantity(node.id, -10).quantity == 0
    other = inv.create_node("Neu", "ding")
    assert inv.adjust_quantity(other.id, 2).quantity == 2
    assert inv.set_quantity(other.id, None).quantity is None


# -- Wartung ------------------------------------------------------------------------------
def test_maintenance_done_logs_and_computes_next_due(inv: Inventory, clock: FakeClock) -> None:
    node = inv.create_node("Heizung", "ding")
    task = inv.add_maintenance(
        node.id, "Wartung", interval=Interval(6, IntervalUnit.MONTHS), next_due="2026-10-01"
    )
    inv.complete_maintenance(node.id, task.id, note="alles gut")
    assert task.log[0].date == "2026-10-10" and task.log[0].note == "alles gut"
    assert task.next_due == "2027-04-10"
    once = inv.add_maintenance(node.id, "Einmalig", next_due="2026-10-09")
    inv.complete_maintenance(node.id, once.id, on="2026-10-05")
    assert once.next_due is None and once.log[0].date == "2026-10-05"


@pytest.mark.parametrize(
    ("start", "interval", "expected"),
    [
        ("2026-01-31", Interval(1, IntervalUnit.MONTHS), "2026-02-28"),
        ("2024-01-31", Interval(1, IntervalUnit.MONTHS), "2024-02-29"),
        ("2026-12-15", Interval(2, IntervalUnit.MONTHS), "2027-02-15"),
        ("2024-02-29", Interval(1, IntervalUnit.YEARS), "2025-02-28"),
        ("2026-10-10", Interval(2, IntervalUnit.WEEKS), "2026-10-24"),
        ("2026-12-30", Interval(5, IntervalUnit.DAYS), "2027-01-04"),
    ],
)
def test_interval_arithmetic(inv: Inventory, start: str, interval: Interval, expected: str) -> None:
    node = inv.create_node("X", "ding")
    task = inv.add_maintenance(node.id, "T", interval=interval)
    assert inv.complete_maintenance(node.id, task.id, on=start).next_due == expected


def test_maintenance_crud_and_errors(inv: Inventory) -> None:
    node = inv.create_node("X", "ding")
    task = inv.add_maintenance(node.id, " Ölen ")
    assert task.title == "Ölen"
    inv.update_maintenance(
        node.id,
        task.id,
        {
            "title": "Schmieren",
            "interval": {"value": 3, "unit": "days"},
            "next_due": "2026-11-01",
            "note": "n",
        },
    )
    assert task.interval == Interval(3, IntervalUnit.DAYS)
    inv.update_maintenance(node.id, task.id, {"interval": None, "next_due": None})
    for bad in (
        {"title": " "},
        {"next_due": "bald"},
        {"interval": Interval(0, IntervalUnit.DAYS)},
        {"x": 1},
    ):
        with pytest.raises(InvalidValueError):
            inv.update_maintenance(node.id, task.id, bad)
    with pytest.raises(InvalidValueError):
        inv.add_maintenance(node.id, "")
    with pytest.raises(InvalidValueError):
        inv.add_maintenance(node.id, "x", next_due="bald")
    with pytest.raises(InvalidValueError):
        inv.add_maintenance(node.id, "x", interval=Interval(0, IntervalUnit.DAYS))
    with pytest.raises(NotFoundError):
        inv.complete_maintenance(node.id, "nix")
    with pytest.raises(InvalidValueError):
        inv.complete_maintenance(node.id, task.id, on="gestern")
    inv.remove_maintenance(node.id, task.id)
    assert inv.node(node.id).maintenance == []
    _ok(inv)


# -- Listen -------------------------------------------------------------------------------
def test_list_grouped_by_room(sample: Inventory) -> None:
    liste = next(iter(sample.data.lists.values()))
    groups = sample.list_grouped(liste.id)
    names = [g.place_name for g in groups]
    assert names == [
        "Garage",
        "Werkstatt",
        "Ohne Ort",
    ]  # nächster Raum, alphabetisch; freier Text zuletzt
    garage = next(g for g in groups if g.place_name == "Garage")
    assert garage.entries[0].node == by_name(sample, "Zelt (4 Personen)")
    assert next(g for g in groups if g.place_name == "Ohne Ort").entries[0].text == "Wasserkanister füllen"


def test_list_check_reset_and_errors(inv: Inventory) -> None:
    node = inv.create_node("Zelt", "ding")
    liste = inv.create_list("Camping")
    e1 = inv.add_list_entry(liste.id, node=node.id, quantity=1, note="n")
    e2 = inv.add_list_entry(liste.id, text="Wasser")
    inv.update_list_entry(liste.id, e1.id, {"checked": True, "quantity": 2, "note": "neu"})
    inv.update_list_entry(liste.id, e2.id, {"checked": True, "text": "Wasser holen"})
    assert inv.reset_list(liste.id) == 2
    assert not any(e.checked for e in liste.entries)
    for kwargs in ({}, {"node": node.id, "text": "x"}):
        with pytest.raises(InvalidValueError):
            inv.add_list_entry(liste.id, **kwargs)  # type: ignore[arg-type]
    with pytest.raises(NotFoundError):
        inv.add_list_entry(liste.id, node="nix")
    with pytest.raises(InvalidValueError):
        inv.update_list_entry(liste.id, e1.id, {"text": "x"})
    with pytest.raises(InvalidValueError):
        inv.update_list_entry(liste.id, e2.id, {"text": " "})
    with pytest.raises(InvalidValueError):
        inv.update_list_entry(liste.id, e2.id, {"bogus": 1})
    with pytest.raises(NotFoundError):
        inv.update_list_entry(liste.id, "nix", {})
    inv.remove_list_entry(liste.id, e2.id)
    inv.rename_list(liste.id, "Zelten")
    assert inv.data.lists[liste.id].name == "Zelten"
    with pytest.raises(InvalidValueError):
        inv.rename_list(liste.id, " ")
    with pytest.raises(InvalidValueError):
        inv.create_list(" ")
    with pytest.raises(NotFoundError):
        inv.get_list("nix")
    inv.delete_list(liste.id)
    _ok(inv)


# -- Vorlagen, Synonyme, Einstellungen ----------------------------------------------------
def test_create_from_template(sample: Inventory) -> None:
    template = next(iter(sample.data.templates.values()))
    garage = by_name(sample, "Garage")
    sample.drain_changes()
    root = sample.create_from_template(template.id, garage)
    assert root.number is not None and root.name == "Werkzeugkoffer" and root.tags == ["Werkzeug"]
    names = [sample.node(i).name for i in sample.tree.descendants(root.id)]
    assert names == ["Schraubendreher", "Kreuzschlitz", "Zangen", "Maßband"]
    renamed = sample.create_from_template(template.id, garage, "Koffer 2", number=99)
    assert renamed.name == "Koffer 2" and renamed.number == 99
    _ok(sample)


def test_template_errors_and_delete(inv: Inventory) -> None:
    with pytest.raises(InvalidValueError):
        inv.add_template(" ", "kiste")
    with pytest.raises(NotFoundError):
        inv.add_template("T", "nix")
    with pytest.raises(NotFoundError):
        inv.add_template("T", "kiste", owner="x")
    with pytest.raises(NotFoundError):
        inv.add_template("T", "kiste", children=[TemplateNode("c", "nix")])
    tpl = inv.add_template("T", "ding", fields={"vendor": "X"})
    node = inv.create_from_template(tpl.id, None)
    assert node.fields == {"vendor": "X"}
    inv.delete_template(tpl.id)
    with pytest.raises(NotFoundError):
        inv.create_from_template(tpl.id, None)


def test_synonyms_are_cleaned(inv: Inventory) -> None:
    result = inv.set_synonyms([["Tacker", " Hefter ", "tacker"], ["allein"], []])
    assert result == [["Tacker", "Hefter"]]


def test_settings(inv: Inventory) -> None:
    inv.update_settings(lent_days=14)
    assert inv.data.settings.lent_days == 14
    for bad in ({"lent_days": 0}, {"nope": 1}, {"stale_days": True}):
        with pytest.raises(InvalidValueError):
            inv.update_settings(**bad)  # type: ignore[arg-type]


# -- Inventur -----------------------------------------------------------------------------
def test_stocktake_verifies_and_marks_missing(sample: Inventory) -> None:
    schere, kleber = by_name(sample, "Schere"), by_name(sample, "Glitzer")
    schal = by_name(sample, "Schal (blau)")
    assert sample.node(schal).condition is Condition.MISSING
    assert sample.apply_stocktake({schere: "present", kleber: "missing", schal: "present"}) == (
        2,
        1,
    )
    assert sample.node(schere).verified == "2026-10-10T09:00:00+02:00"
    assert sample.node(kleber).condition is Condition.MISSING
    assert sample.node(schal).condition is Condition.OK  # wiedergefunden
    with pytest.raises(InvalidValueError):
        sample.apply_stocktake({schere: "vielleicht"})  # type: ignore[dict-item]
    with pytest.raises(NotFoundError):
        sample.apply_stocktake({"nix": "present"})
    assert sample.verify_nodes([]) == 0 and sample.mark_missing([]) == 0
