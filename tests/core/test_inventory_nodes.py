"""Knoten anlegen, ändern, verschieben, löschen (Pflichtenheft 5.1–5.4, 5.13, 5.14, 8.2–8.5)."""

from __future__ import annotations

import pytest

from custom_components.ordnungstracker.core.errors import (
    CycleError,
    InvalidValueError,
    NotFoundError,
    NumberTakenError,
    SystemNodeError,
    TrashError,
)
from custom_components.ordnungstracker.core.inventory import Inventory
from custom_components.ordnungstracker.core.model import (
    TRASH_ID,
    UNSORTED_ID,
    Condition,
    KindClass,
    TrashInfo,
)
from custom_components.ordnungstracker.core.validation import validate_inventory

from .conftest import FakeClock, by_name


def _ok(inv: Inventory) -> None:
    assert validate_inventory(inv.data) == []


# -- anlegen ------------------------------------------------------------------------------
def test_create_minimal_needs_only_name_and_kind(inv: Inventory) -> None:
    node = inv.create_node("  Hammer  ", "ding")
    assert node.name == "Hammer" and node.parent is None
    assert node.created == node.modified == "2026-10-10T09:00:00+02:00"
    _ok(inv)


def test_create_rejects_bad_input(inv: Inventory) -> None:
    with pytest.raises(InvalidValueError, match="Name"):
        inv.create_node("  ", "ding")
    with pytest.raises(NotFoundError, match="Art"):
        inv.create_node("X", "gibtsnicht")
    with pytest.raises(NotFoundError, match="Person"):
        inv.create_node("X", "ding", owner="p9")
    with pytest.raises(NotFoundError):
        inv.create_node("X", "ding", "nirgends")
    with pytest.raises(InvalidValueError):
        inv.create_node("X", "ding", quantity=-1)
    with pytest.raises(TrashError):
        inv.create_node("X", "ding", TRASH_ID)
    assert len(inv.data.nodes) == 2  # nur Systemknoten, nichts halb angelegt


def test_numbers_auto_unique_and_reserved(inv: Inventory) -> None:
    a = inv.create_node("A", "kiste", number="auto")
    b = inv.create_node("B", "kiste", number="auto")
    inv.create_node("C", "kiste", number=4)
    assert (a.number, b.number) == (1, 2)
    assert inv.next_free_number() == 3
    with pytest.raises(NumberTakenError, match="B"):
        inv.create_node("D", "kiste", number=2)
    for bad in (0, -3, True):
        with pytest.raises(InvalidValueError):
            inv.create_node("E", "kiste", number=bad)  # type: ignore[arg-type]
    assert inv.find_by_number(4) is not None and inv.find_by_number(99) is None


def test_number_survives_rename_and_move(inv: Inventory) -> None:
    kiste = inv.create_node("Basteln", "kiste", number=14)
    regal = inv.create_node("Regal", "regal")
    inv.update_node(kiste.id, {"name": "Basteln neu"})
    inv.move_nodes([kiste.id], regal.id)
    assert inv.node(kiste.id).number == 14


def test_item_becomes_group_when_it_gets_a_child(inv: Inventory) -> None:
    ding = inv.create_node("Bastelsachen", "ding")
    inv.create_node("Schere", "ding", ding.id)
    assert inv.kind_of(ding.id).kind_class is KindClass.GROUP
    changes = inv.drain_changes()
    assert any("Gruppe" in h for c in changes for h in c.hints)
    _ok(inv)


def test_item_becomes_group_on_move_and_restore(inv: Inventory) -> None:
    ding = inv.create_node("Ding", "ding")
    other = inv.create_node("Anderes", "ding")
    inv.move_nodes([other.id], ding.id)
    assert inv.kind_of(ding.id).kind_class is KindClass.GROUP
    parent = inv.create_node("Eltern", "ding")
    child = inv.create_node("Kind", "ding", parent.id)  # Eltern -> Gruppe
    inv.delete_node(child.id)
    inv.update_node(parent.id, {"kind": "ding"})
    inv.restore_node(child.id)
    assert inv.kind_of(parent.id).kind_class is KindClass.GROUP


def test_unusual_placement_gives_hint_but_works(inv: Inventory) -> None:
    regal = inv.create_node("Regal", "regal")
    inv.drain_changes()
    inv.create_node("Zimmer", "raum", regal.id)
    (change,) = inv.drain_changes()
    assert change.hints and "Ungewöhnlich" in change.hints[0]
    _ok(inv)


def test_create_with_fields_validates_and_rolls_back(inv: Inventory) -> None:
    node = inv.create_node("Nudeln", "ding", fields={"expiry": "2026-12-01", "vendor": "Aldi"})
    assert node.fields == {"expiry": "2026-12-01", "vendor": "Aldi"}
    with pytest.raises(InvalidValueError):
        inv.create_node("Kaputt", "ding", fields={"expiry": "bald"})
    assert not any(n.name == "Kaputt" for n in inv.data.nodes.values())
    _ok(inv)


def test_aliases_and_tags_are_cleaned(inv: Inventory) -> None:
    node = inv.create_node("X", "ding", aliases=[" a ", "A", "", "b"], tags=["t", "t "])
    assert node.aliases == ["a", "b"] and node.tags == ["t"]


# -- ändern -------------------------------------------------------------------------------
def test_update_applies_and_logs_old_values(inv: Inventory) -> None:
    node = inv.create_node("Alt", "ding")
    inv.drain_changes()
    inv.update_node(
        node.id, {"name": "Neu", "note": "Hinweis", "quantity": 3, "unit": " Stück ", "tags": ["x"]}
    )
    (change,) = inv.drain_changes()
    assert change.action == "update"
    assert change.details["old"]["name"] == "Alt" and change.details["changes"]["name"] == "Neu"
    assert inv.node(node.id).unit == "Stück"


def test_update_noop_records_nothing(inv: Inventory) -> None:
    node = inv.create_node("A", "ding")
    inv.drain_changes()
    inv.update_node(node.id, {"name": "A", "note": ""})
    assert inv.drain_changes() == []


@pytest.mark.parametrize(
    ("changes", "error"),
    [
        ({"name": " "}, InvalidValueError),
        ({"kind": "x"}, NotFoundError),
        ({"owner": "x"}, NotFoundError),
        ({"quantity": -1}, InvalidValueError),
        ({"min_quantity": "viel"}, InvalidValueError),
        ({"condition": "kaputtgelacht"}, InvalidValueError),
        ({"bogus": 1}, InvalidValueError),
        ({"number": 0}, InvalidValueError),
    ],
)
def test_update_validation_changes_nothing(inv: Inventory, changes: dict, error: type[Exception]) -> None:  # type: ignore[type-arg]
    node = inv.create_node("A", "ding")
    snapshot = inv.data.to_dict()
    with pytest.raises(error):
        inv.update_node(node.id, {"note": "nicht übernehmen", **changes})
    assert inv.data.to_dict() == snapshot


def test_update_number_conflict_and_clear(inv: Inventory) -> None:
    a = inv.create_node("A", "kiste", number=1)
    inv.create_node("B", "kiste", number=2)
    with pytest.raises(NumberTakenError):
        inv.update_node(a.id, {"number": 2})
    inv.update_node(a.id, {"number": 1})  # eigene Nummer ist kein Konflikt
    inv.update_node(a.id, {"number": None})
    assert inv.node(a.id).number is None


def test_update_kind_with_children_cannot_become_item(inv: Inventory) -> None:
    g = inv.create_node("G", "gruppe")
    inv.create_node("K", "ding", g.id)
    with pytest.raises(InvalidValueError, match="Unterpunkte"):
        inv.update_node(g.id, {"kind": "ding"})
    inv.update_node(g.id, {"kind": "kiste"})
    assert inv.kind_of(g.id).kind_class is KindClass.CONTAINER


def test_system_nodes_are_locked_but_note_allowed(inv: Inventory) -> None:
    with pytest.raises(SystemNodeError):
        inv.update_node(UNSORTED_ID, {"name": "Chaos"})
    with pytest.raises(SystemNodeError):
        inv.update_node(TRASH_ID, {"condition": Condition.DISPOSED})
    inv.update_node(UNSORTED_ID, {"note": "Erst sortieren"})


def test_set_condition_archives_subtree(sample: Inventory) -> None:
    fernseher = by_name(sample, "Alter Röhrenfernseher")
    assert sample.tree.is_archived(fernseher)
    kiste = by_name(sample, "Winterkleidung")
    sample.set_condition(kiste, Condition.DISPOSED)
    assert sample.tree.is_archived(by_name(sample, "Mützen"))
    assert not sample.tree.is_active(by_name(sample, "Mützen"))


# -- verschieben --------------------------------------------------------------------------
def test_move_takes_content_along_and_logs_paths(sample: Inventory) -> None:
    kiste = by_name(sample, "Basteln")
    ziel = by_name(sample, "Werkstatt")
    sample.move_nodes([kiste], ziel)
    (change,) = [c for c in sample.drain_changes() if c.action == "move"]
    assert change.details["from"] == ["Keller", "Regal B", "Basteln"]
    assert change.details["to"] == ["Keller", "Werkstatt", "Basteln"]
    assert sample.tree.path_names(by_name(sample, "Schere"))[-4:] == [
        "Werkstatt",
        "Basteln",
        "Bastelsachen",
        "Schere",
    ]
    _ok(sample)


def test_move_multiple_and_to_top_level(sample: Inventory) -> None:
    a, b = by_name(sample, "Mützen"), by_name(sample, "Handschuhe")
    moved = sample.move_nodes([a, b, a], UNSORTED_ID)
    assert [n.id for n in moved] == [a, b]
    sample.move_nodes([a], None)
    assert sample.node(a).parent is None


def test_move_rejects_cycles_system_and_trash(sample: Inventory) -> None:
    keller, regal = by_name(sample, "Keller"), by_name(sample, "Regal B")
    snapshot = sample.data.to_dict()
    with pytest.raises(CycleError):
        sample.move_nodes([keller], regal)
    with pytest.raises(CycleError):
        sample.move_nodes([keller], keller)
    with pytest.raises(SystemNodeError):
        sample.move_nodes([UNSORTED_ID], regal)
    with pytest.raises(TrashError):
        sample.move_nodes([regal], TRASH_ID)
    with pytest.raises(InvalidValueError):
        sample.move_nodes([], regal)
    with pytest.raises(NotFoundError):
        sample.move_nodes(["nix"], regal)
    sample.delete_node(by_name(sample, "Schere"))
    with pytest.raises(TrashError):
        sample.move_nodes([by_name(sample, "Schere")], regal)
    assert validate_inventory(sample.data) == []
    assert sample.data.to_dict() != snapshot  # nur das Löschen oben


def test_move_failure_is_all_or_nothing(sample: Inventory) -> None:
    regal = by_name(sample, "Regal B")
    snapshot = sample.data.to_dict()
    with pytest.raises(CycleError):
        sample.move_nodes([by_name(sample, "Mützen"), regal], regal)
    assert sample.data.to_dict() == snapshot


def test_move_selected_ancestor_and_descendant_keeps_structure(sample: Inventory) -> None:
    kiste, schere = by_name(sample, "Basteln"), by_name(sample, "Schere")
    moved = sample.move_nodes([kiste, schere], by_name(sample, "Garage"))
    assert [n.id for n in moved] == [kiste]
    assert sample.node(schere).parent == by_name(sample, "Bastelsachen")


# -- löschen, Papierkorb ------------------------------------------------------------------
def test_delete_moves_whole_subtree_to_trash(sample: Inventory) -> None:
    kiste = by_name(sample, "Basteln")
    sample.delete_node(kiste)
    node = sample.node(kiste)
    assert node.parent == TRASH_ID
    assert node.trashed is not None and node.trashed.from_parent == by_name(sample, "Regal B")
    assert sample.tree.in_trash(by_name(sample, "Schere"))
    (change,) = [c for c in sample.drain_changes() if c.action == "delete"]
    assert change.details["descendants"] == 6 and change.details["mode"] == "trash"
    _ok(sample)


def test_delete_lift_keeps_content_one_level_up(sample: Inventory) -> None:
    bastel = by_name(sample, "Bastelsachen")
    kiste = by_name(sample, "Basteln")
    sample.delete_node(bastel, "lift")
    assert sample.node(by_name(sample, "Schere")).parent == kiste
    assert sample.node(bastel).parent == TRASH_ID
    assert sample.tree.children_ids(bastel) == []
    _ok(sample)


def test_delete_top_level_lift_and_errors(sample: Inventory) -> None:
    keller = by_name(sample, "Keller")
    sample.delete_node(keller, "lift")
    assert sample.node(by_name(sample, "Regal B")).parent is None
    with pytest.raises(SystemNodeError):
        sample.delete_node(UNSORTED_ID)
    with pytest.raises(TrashError):
        sample.delete_node(keller)  # liegt schon im Papierkorb
    with pytest.raises(InvalidValueError):
        sample.delete_node(by_name(sample, "Garage"), "weg")  # type: ignore[arg-type]
    with pytest.raises(NotFoundError):
        sample.delete_node("nix")


def test_restore_to_old_place_or_unsorted(sample: Inventory) -> None:
    schere = by_name(sample, "Schere")
    gruppe = by_name(sample, "Bastelsachen")
    sample.delete_node(schere)
    sample.restore_node(schere)
    assert sample.node(schere).parent == gruppe and sample.node(schere).trashed is None
    # alter Platz selbst gelöscht -> Unsortiert
    sample.delete_node(schere)
    sample.delete_node(gruppe)
    sample.restore_node(schere)
    assert sample.node(schere).parent == UNSORTED_ID
    assert any("alte Platz" in h for c in sample.drain_changes() for h in c.hints)
    _ok(sample)


def test_restore_rules(sample: Inventory) -> None:
    kiste = by_name(sample, "Basteln")
    sample.delete_node(kiste)
    with pytest.raises(TrashError):
        sample.restore_node(by_name(sample, "Schere"))  # nicht der oberste Eintrag
    with pytest.raises(TrashError):
        sample.restore_node(by_name(sample, "Keller"))
    sample.restore_node(kiste)
    assert sample.tree.in_trash(kiste) is False


def test_purge_removes_subtree_and_cleans_references(sample: Inventory) -> None:
    zelt = by_name(sample, "Zelt (4 Personen)")
    liste = next(iter(sample.data.lists.values()))
    schleif = by_name(sample, "Schleifmittel")
    assert any(e.node == zelt for e in liste.entries)
    koernung = next(f.id for f in sample.data.fields.values() if f.name == "Körnung")
    sample.delete_node(by_name(sample, "Camping"))
    sample.delete_node(schleif)
    removed = sample.empty_trash()
    assert removed >= 4
    assert zelt not in sample.data.nodes
    assert not any(e.node == zelt for e in liste.entries)  # Verweis in der Liste verschwunden
    assert koernung not in sample.data.fields  # lokale Felddefinition verschwunden
    assert all(koernung not in n.fields for n in sample.data.nodes.values())
    assert 40 not in sample.used_numbers()  # Nummer wieder frei
    _ok(sample)


def test_purge_only_from_trash(sample: Inventory) -> None:
    with pytest.raises(TrashError):
        sample.purge_node(by_name(sample, "Garage"))
    assert sample.empty_trash() == 0


def test_purge_expired_after_30_days(inv: Inventory, clock: FakeClock) -> None:
    alt = inv.create_node("Alt", "ding")
    inv.delete_node(alt.id)
    clock.advance(days=29, hours=23)
    neu = inv.create_node("Neu", "ding")
    inv.delete_node(neu.id)
    assert inv.purge_expired_trash() == 0
    clock.advance(hours=2)  # Alt ist jetzt über 30 Tage im Papierkorb
    assert inv.purge_expired_trash() == 1
    assert alt.id not in inv.data.nodes and neu.id in inv.data.nodes
    inv.data.settings.trash_days = 1
    clock.advance(days=2)
    assert inv.purge_expired_trash() == 1
    _ok(inv)


def test_normalization_on_load(clock: FakeClock) -> None:
    from custom_components.ordnungstracker.core.defaults import new_inventory_data
    from custom_components.ordnungstracker.core.model import Node

    data = new_inventory_data("2026-10-10T09:00:00+02:00")
    data.nodes["a"] = Node("a", "Ding mit Kind", "ding")
    data.nodes["b"] = Node("b", "Kind", "ding", parent="a")
    data.nodes["c"] = Node("c", "Weggeworfen", "ding", parent=TRASH_ID)
    loaded = Inventory(data, clock=clock)
    assert len(loaded.normalizations) == 2
    assert data.nodes["a"].kind == "gruppe"
    assert isinstance(data.nodes["c"].trashed, TrashInfo)
    _ok(loaded)


def test_replace_data_notifies_listeners(inv: Inventory) -> None:
    from custom_components.ordnungstracker.core.defaults import new_inventory_data

    seen: list[str] = []
    inv.subscribe(lambda c: seen.append(c.action))
    inv.replace_data(new_inventory_data("2026-10-10T09:00:00+02:00"))
    assert seen == ["reload"]


def test_unknown_node_message_is_helpful(inv: Inventory) -> None:
    with pytest.raises(NotFoundError) as info:
        inv.node("x")
    assert "Lade die Ansicht neu" in info.value.message and info.value.code == "not_found"


def test_failed_create_under_item_leaves_parent_untouched(inv: Inventory) -> None:
    ding = inv.create_node("Ding", "ding")
    snapshot = inv.data.to_dict()
    with pytest.raises(InvalidValueError):
        inv.create_node("Kind", "ding", ding.id, fields={"expiry": "kaputt"})
    assert inv.data.to_dict() == snapshot  # Elternknoten ist weiterhin ein Ding
    assert inv.kind_of(ding.id).kind_class is KindClass.ITEM


def test_template_failure_leaves_nothing_behind_and_index_stays_correct(inv: Inventory) -> None:
    from custom_components.ordnungstracker.core.model import TemplateNode
    from custom_components.ordnungstracker.core.search import SearchIndex

    tpl = inv.add_template(
        "Koffer",
        "kiste",
        children=[TemplateNode("Gut", "ding"), TemplateNode("Schlecht", "ding", fields={"expiry": "x"})],
    )
    index = SearchIndex(inv)
    snapshot = inv.data.to_dict()
    with pytest.raises(InvalidValueError):
        inv.create_from_template(tpl.id, None)
    assert inv.data.to_dict() == snapshot
    assert index.search("gut").hits == [] and index.search("koffer").hits == []
    assert [c.action for c in inv.drain_changes()] == ["template_add"]  # keine Reste für das Protokoll
