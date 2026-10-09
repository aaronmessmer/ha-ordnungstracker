"""Schnellerfassung (8.3) und Exporte (8.10)."""

from __future__ import annotations

import pytest

from custom_components.ordnungstracker.core.errors import TrashError
from custom_components.ordnungstracker.core.export import (
    render_container_sheet_html,
    render_containers_html,
    render_markdown,
    render_packlist_html,
    render_tree_html,
)
from custom_components.ordnungstracker.core.inventory import Inventory
from custom_components.ordnungstracker.core.quickadd import (
    QuickEntry,
    apply_quickadd,
    format_preview,
    parse_item,
    parse_quickadd,
)
from custom_components.ordnungstracker.core.validation import validate_inventory

from .conftest import by_name


# -- Schnellerfassung ---------------------------------------------------------------------
@pytest.mark.parametrize(
    ("line", "name", "quantity", "unit"),
    [
        ("Schere", "Schere", None, ""),
        ("3x Batterien AA", "Batterien AA", 3, ""),
        ("3 x Batterien AA", "Batterien AA", 3, ""),
        ("3× Batterien", "Batterien", 3, ""),
        ("3xBatterien", "Batterien", 3, ""),
        ("2 Rollen Klebeband", "Klebeband", 2, "Rollen"),
        ("2 Paar Socken", "Socken", 2, "Paar"),
        ("1,5 l Milch", "Milch", 1.5, "l"),
        ("7 Zwerge", "Zwerge", 7, ""),
        ("3 xylophon", "xylophon", 3, ""),  # kein "x" als Malzeichen
        ("2 Rollen", "Rollen", 2, ""),  # Einheit ohne Namen bleibt Name
        ("42", "42", None, ""),
        ("1. Hilfe Set", "1. Hilfe Set", None, ""),
        ("10er Pack Tesa", "10er Pack Tesa", None, ""),
        ("- Aufzählung", "Aufzählung", None, ""),
        ("• 2x Kerzen", "Kerzen", 2, ""),
    ],
)
def test_parse_item(line: str, name: str, quantity: float | None, unit: str) -> None:
    entry = parse_item(line)
    assert entry is not None
    assert (entry.name, entry.quantity, entry.unit) == (name, quantity, unit)


def test_parse_item_empty() -> None:
    assert parse_item("   ") is None
    assert parse_item("-") is None or parse_item("-").name == "-"  # type: ignore[union-attr]


def test_one_line_per_item_and_blank_lines_skipped() -> None:
    entries = parse_quickadd("Schere\n\n  \nKleber\r\nBuntpapier\n")
    assert [e.name for e in entries] == ["Schere", "Kleber", "Buntpapier"]


def test_indentation_makes_children() -> None:
    text = "Bastelsachen\n  Schere\n  Kleber\n    Klebestift\n  Papier\nWerkzeug\n\tHammer"
    entries = parse_quickadd(text)
    assert [e.name for e in entries] == ["Bastelsachen", "Werkzeug"]
    first = entries[0]
    assert [c.name for c in first.children] == ["Schere", "Kleber", "Papier"]
    assert [c.name for c in first.children[1].children] == ["Klebestift"]
    assert [c.name for c in entries[1].children] == ["Hammer"]
    assert first.count() == 5


def test_irregular_indentation_still_nests_sensibly() -> None:
    entries = parse_quickadd("A\n      B\n   C\nD")
    assert [e.name for e in entries] == ["A", "D"]
    assert [c.name for c in entries[0].children] == ["B", "C"]


def test_comma_switch() -> None:
    text = "Schere, Kleber, Buntpapier"
    assert [e.name for e in parse_quickadd(text)] == ["Schere, Kleber, Buntpapier"]
    entries = parse_quickadd(text, split_commas=True)
    assert [e.name for e in entries] == ["Schere", "Kleber", "Buntpapier"]


def test_comma_split_keeps_decimal_numbers_and_nesting() -> None:
    entries = parse_quickadd("Gruppe\n  1,5 l Milch, 2x Eier,, Brot", split_commas=True)
    group = entries[0]
    assert [(c.name, c.quantity) for c in group.children] == [
        ("Milch", 1.5),
        ("Eier", 2),
        ("Brot", None),
    ]


def test_preview() -> None:
    entries = parse_quickadd("Bastelsachen\n  3x Schere\n  2 Rollen Klebeband")
    assert format_preview(entries) == ["• Bastelsachen", "  • 3× Schere", "  • 2 Rollen Klebeband"]


def test_apply_creates_groups_and_items(sample: Inventory) -> None:
    kiste = by_name(sample, "Winterkleidung")
    entries = parse_quickadd("Bastelsachen\n  3x Schere\nKleber")
    created = apply_quickadd(sample, kiste, entries)
    assert [n.name for n in created] == ["Bastelsachen", "Schere", "Kleber"]
    group, schere, kleber = created
    assert sample.kind_of(group.id).name == "Gruppe" and sample.kind_of(kleber.id).name == "Ding"
    assert schere.quantity == 3 and schere.parent == group.id
    assert validate_inventory(sample.data) == []


def test_apply_checks_target_first(sample: Inventory) -> None:
    sample.delete_node(by_name(sample, "Winterkleidung"))
    before = len(sample.data.nodes)
    with pytest.raises(TrashError):
        apply_quickadd(sample, by_name(sample, "Winterkleidung"), [QuickEntry("X")])
    assert len(sample.data.nodes) == before


# -- Markdown -----------------------------------------------------------------------------
def test_markdown_full(sample: Inventory) -> None:
    md = render_markdown(sample)
    assert md.startswith("# Inventar\n")
    assert "- **Keller**" in md
    assert "  - **Regal B**" in md
    assert "    - **Basteln** (Kiste 14)" in md
    assert "      - Bastelsachen" in md
    assert "Heißklebepistole – ausgeliehen an Nachbar Huber" in md
    assert "Batterien AA – 2 Stück" in md
    assert "Schal (blau) – vermisst" in md
    assert "Papierkorb" not in md
    assert "Röhrenfernseher" not in md  # entsorgt: archiviert
    assert "_Nur im Dezember öffnen._" in md


def test_markdown_subtree_and_unsorted_handling(sample: Inventory) -> None:
    md = render_markdown(sample, by_name(sample, "Basteln"))
    assert md.startswith("# Basteln\n") and "Keller" not in md and "Schere" in md
    assert "Unbekannter Schlüssel" in render_markdown(sample)
    sample.move_nodes([by_name(sample, "Unbekannter Schlüssel")], by_name(sample, "Garage"))
    assert "Unsortiert" not in render_markdown(sample)
    assert "Unsortiert" in render_markdown(sample, include_empty_unsorted=True)


# -- HTML ---------------------------------------------------------------------------------
def test_html_pages_are_standalone_and_escaped(inv: Inventory) -> None:
    inv.create_node("<script>alert(1)</script>", "ding")
    page = render_tree_html(inv)
    assert page.startswith("<!doctype html>") and "<script>alert" not in page
    assert "&lt;script&gt;" in page
    assert "http://" not in page and "https://" not in page  # keine externen Dateien
    assert "@media print" in page


def test_tree_print_view(sample: Inventory) -> None:
    page = render_tree_html(sample)
    assert "Keller" in page and '<span class="num">14</span> Basteln' in page
    part = render_tree_html(sample, by_name(sample, "Basteln"))
    assert "<h1>Basteln</h1>" in part and "Regal B" not in part


def test_container_list_with_numbers_and_places(sample: Inventory) -> None:
    page = render_containers_html(sample)
    assert page.index("Basteln") < page.index("Weihnachten") < page.index("Camping")  # nach Nummer
    assert "Keller › Regal B" in page and "Erste-Hilfe-Tasche" in page
    assert "8 Behälter" in page


def test_container_sheet(sample: Inventory) -> None:
    page = render_container_sheet_html(sample, by_name(sample, "Basteln"))
    assert '<p class="big">14</p>' in page and "Heißklebepistole" in page
    assert "Keller › Regal B" in page
    plain = render_container_sheet_html(sample, by_name(sample, "Regal B"))
    assert 'class="big"' not in plain


def test_packlist_print_view(sample: Inventory) -> None:
    liste = next(iter(sample.data.lists.values()))
    sample.update_list_entry(liste.id, liste.entries[0].id, {"checked": True})
    page = render_packlist_html(sample, liste.id)
    assert "Campingausrüstung" in page and "Wasserkanister füllen" in page
    assert "box on" in page and "Heringe nicht vergessen" in page
    assert "8× Batterien AA" in page
