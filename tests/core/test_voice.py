"""Antworten der Sprachabfrage (Pflichtenheft 9.7)."""

from __future__ import annotations

from custom_components.ordnungstracker.core import voice
from custom_components.ordnungstracker.core.inventory import Inventory
from custom_components.ordnungstracker.core.search import SearchIndex

from .conftest import by_name


def test_where_names_the_place_from_inside_out(sample: Inventory) -> None:
    index = SearchIndex(sample)
    answer = voice.answer_where(sample, index, "Heißklebepistole")
    assert answer.startswith("Heißklebepistole liegt in ")
    assert "Kiste 14 Basteln" in answer and "Keller" in answer
    assert answer.index("Basteln") < answer.index("Keller")  # nearest first


def test_where_adds_the_checkout_note(sample: Inventory) -> None:
    index = SearchIndex(sample)
    answer = voice.answer_where(sample, index, "Heißklebepistole")
    assert "Aber es ist ausgeliehen an Nachbar Huber." in answer
    assert "seit" not in answer and "2026" not in answer  # nothing to stumble over when spoken
    out = voice.answer_where(sample, index, "Christbaumschmuck")
    assert "gerade entnommen: hängt am Christbaum" in out


def test_where_with_several_hits_lists_at_most_three(sample: Inventory) -> None:
    index = SearchIndex(sample)
    answer = voice.answer_where(sample, index, "e")  # matches a lot
    assert answer.startswith("Ich habe ") and "1. " in answer and "3. " in answer and "4. " not in answer


def test_where_unknown_and_empty(sample: Inventory) -> None:
    index = SearchIndex(sample)
    assert voice.answer_where(sample, index, "Zeppelin") == "Ich habe „Zeppelin“ nicht gefunden."
    assert "Wonach" in voice.answer_where(sample, index, "  ")


def test_where_top_level_item(inv: Inventory) -> None:
    inv.create_node("Kellerraum", "raum", None)
    index = SearchIndex(inv)
    assert voice.answer_where(inv, index, "Kellerraum") == "Kellerraum liegt auf der obersten Ebene."


def test_contents_by_number(sample: Inventory) -> None:
    answer = voice.answer_contents_by_number(sample, 14)
    assert answer.startswith("In Kiste 14 Basteln ist ein Eintrag: ")
    assert "Bastelsachen" in answer
    assert voice.answer_contents_by_number(sample, 999) == "Eine Kiste mit der Nummer 999 gibt es nicht."


def test_contents_by_name_and_empty(sample: Inventory) -> None:
    index = SearchIndex(sample)
    assert "Kiste 14 Basteln" in voice.answer_contents_by_name(sample, index, "Basteln")
    sample.create_node("Leere Kiste", "kiste", None, number="auto")
    empty = voice.answer_contents_by_name(sample, SearchIndex(sample), "Leere Kiste")
    assert empty.endswith("ist leer.") and "Leere Kiste" in empty
    assert "keinen Behälter" in voice.answer_contents_by_name(sample, index, "Zeppelin")
    assert "Wessen" in voice.answer_contents_by_name(sample, index, "")


def test_long_contents_are_shortened_with_the_count(inv: Inventory) -> None:
    box = inv.create_node("Kiste", "kiste", None, number="auto").id
    for i in range(14):
        inv.create_node(f"Ding {i:02d}", "ding", box)
    answer = voice.answer_contents_by_number(inv, 1)
    assert "sind 14 Einträge" in answer and answer.endswith("und 4 weitere.")
    assert answer.count(",") == 9  # ten names


def test_amounts_are_spoken_and_single_entry_grammar(inv: Inventory) -> None:
    box = inv.create_node("Kiste", "kiste", None, number="auto").id
    inv.create_node("Batterien", "ding", box, quantity=3)
    answer = voice.answer_contents_by_number(inv, 1)
    assert answer == "In Kiste 1 Kiste ist ein Eintrag: 3 Batterien."
    assert by_name(inv, "Batterien")
