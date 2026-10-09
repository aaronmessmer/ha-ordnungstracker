"""Baum, Vererbung von Besitz, Sortierung und Zählung (Pflichtenheft 5.5, 8.1)."""

from __future__ import annotations

from custom_components.ordnungstracker.core.inventory import Inventory
from custom_components.ordnungstracker.core.model import TRASH_ID, Condition

from .conftest import by_name


def test_path_and_ancestors(sample: Inventory) -> None:
    schere = by_name(sample, "Schere")
    assert sample.tree.path_names(schere) == [
        "Keller",
        "Regal B",
        "Basteln",
        "Bastelsachen",
        "Schere",
    ]
    assert sample.tree.depth(schere) == 4
    assert sample.tree.is_ancestor(by_name(sample, "Keller"), schere)
    assert not sample.tree.is_ancestor(schere, schere)
    assert sample.tree.ancestors(by_name(sample, "Keller")) == []


def test_descendants_and_subtree(sample: Inventory) -> None:
    kiste = by_name(sample, "Basteln")
    names = [sample.node(i).name for i in sample.tree.descendants(kiste)]
    assert names[0] == "Bastelsachen" and "Schere" in names and len(names) == 6
    assert sample.tree.subtree_ids(kiste)[0] == kiste


def test_owner_inheritance_and_override(sample: Inventory) -> None:
    papa = next(p.id for p in sample.data.persons.values() if p.name == "Papa")
    mama = next(p.id for p in sample.data.persons.values() if p.name == "Mama")
    mia = next(p.id for p in sample.data.persons.values() if p.name == "Mia")
    bohrer = by_name(sample, "Bohrmaschine")
    assert sample.tree.effective_owner(bohrer) == (papa, True)  # Werkstatt gehört Papa
    assert sample.tree.effective_owner(by_name(sample, "Werkstatt")) == (papa, False)
    assert sample.tree.effective_owner(by_name(sample, "Nähzeug")) == (mama, True)  # überschrieben
    assert sample.tree.effective_owner(by_name(sample, "Schere")) == (mia, True)
    assert sample.tree.effective_owner(by_name(sample, "Garage")) == (None, False)


def test_owner_change_on_parent_cascades(sample: Inventory) -> None:
    mama = next(p.id for p in sample.data.persons.values() if p.name == "Mama")
    sample.update_node(by_name(sample, "Werkstatt"), {"owner": mama})
    assert sample.tree.effective_owner(by_name(sample, "Bohrmaschine")) == (mama, True)
    sample.update_node(by_name(sample, "Werkstatt"), {"owner": None})
    assert sample.tree.effective_owner(by_name(sample, "Bohrmaschine")) == (None, False)


def test_sorted_children_places_first_by_number_then_things_by_name(sample: Inventory) -> None:
    regal = by_name(sample, "Regal B")
    sample.create_node("Zange", "ding", regal)
    sample.create_node("Axt", "ding", regal)
    sample.create_node("Kiste ohne Nummer", "kiste", regal)
    names = [sample.node(i).name for i in sample.tree.sorted_children(regal)]
    assert names == [
        "Basteln",
        "Weihnachten",
        "Winterkleidung",
        "Kiste ohne Nummer",
        "Axt",
        "Campingstuhl",
        "Zange",
    ]


def test_sorted_children_natural_order_of_numbers(inv: Inventory) -> None:
    for n in (10, 2, 1):
        inv.create_node(f"K{n}", "kiste", number=n)
    names = [inv.node(i).name for i in inv.tree.sorted_children(None)]
    assert names[:3] == ["K1", "K2", "K10"]


def test_content_counts_direct_and_total(sample: Inventory) -> None:
    assert sample.tree.content_counts(by_name(sample, "Basteln")) == (1, 6)
    assert sample.tree.content_counts(by_name(sample, "Schere")) == (0, 0)
    fern = by_name(sample, "Alter Röhrenfernseher")
    wohnzimmer = by_name(sample, "Wohnzimmer")
    # archivierte (entsorgte) Knoten zählen nicht
    assert fern in sample.tree.children_ids(wohnzimmer)
    assert fern not in sample.tree.sorted_children(wohnzimmer)
    assert fern in sample.tree.sorted_children(wohnzimmer, include_archived=True)
    assert sample.tree.content_counts(wohnzimmer) == (2, 4)


def test_trash_and_archive_states(sample: Inventory) -> None:
    schere = by_name(sample, "Schere")
    assert sample.tree.is_active(schere)
    sample.delete_node(by_name(sample, "Basteln"))
    assert sample.tree.in_trash(schere) and not sample.tree.is_active(schere)
    assert not sample.tree.is_active(TRASH_ID)
    assert sample.node(by_name(sample, "Winterkleidung")).condition is Condition.OK


# -- Art-Vorschlag (8.2) ------------------------------------------------------------------
def test_suggest_kind_by_parent_class(inv: Inventory) -> None:
    raum = inv.create_node("Keller", "raum")
    regal = inv.create_node("Regal", "regal")
    kiste = inv.create_node("Kiste", "kiste")
    gruppe = inv.create_node("Gruppe", "gruppe")
    ding = inv.create_node("Ding", "ding")
    tree = inv.tree
    assert tree.suggest_kind(None) == "raum"
    assert tree.suggest_kind(raum.id) == "regal"  # in einem Raum eher Regal
    assert tree.suggest_kinds(raum.id)[:3] == ["regal", "schrank", "kiste"]
    assert tree.suggest_kind(regal.id) == "kiste"
    assert tree.suggest_kind(kiste.id) == "ding"  # in einer Kiste eher Ding
    assert tree.suggest_kind(gruppe.id) == "ding"
    assert tree.suggest_kind(ding.id) == "ding"


def test_suggest_kind_prefers_what_the_parent_already_contains(inv: Inventory) -> None:
    raum = inv.create_node("Keller", "raum")
    for name in ("A", "B"):
        inv.create_node(name, "kiste", raum.id)
    inv.create_node("C", "regal", raum.id)
    assert inv.tree.suggest_kind(raum.id) == "kiste"  # häufigste Art der Kinder
    suggestions = inv.tree.suggest_kinds(raum.id)
    assert suggestions[:2] == ["kiste", "regal"] and set(suggestions) == set(inv.data.kinds)
    assert len(suggestions) == len(set(suggestions))
