"""Suche: jede Regel aus Pflichtenheft 7 mit eigenem Test."""

from __future__ import annotations

import random
import time

import pytest

from custom_components.ordnungstracker.core.defaults import new_inventory_data
from custom_components.ordnungstracker.core.inventory import Inventory
from custom_components.ordnungstracker.core.model import (
    CheckoutType,
    Condition,
    InventoryData,
    KindClass,
    Node,
)
from custom_components.ordnungstracker.core.search import SearchFilter, SearchIndex

from .conftest import FakeClock, by_name


def names(inv: Inventory, query: str, flt: SearchFilter | None = None, limit: int | None = 50) -> list[str]:
    index = SearchIndex(inv)
    return [h.name for h in index.search(query, flt, limit).hits]


# -- 7.2 Vergleich ------------------------------------------------------------------------
def test_case_insensitive(sample: Inventory) -> None:
    assert names(sample, "HEIßKLEBEPISTOLE") == ["Heißklebepistole"]
    assert names(sample, "heißklebepistole") == ["Heißklebepistole"]


@pytest.mark.parametrize("query", ["heissklebe", "heißklebe", "heisklebe", "HEISSKLEBE"])
def test_eszett_tolerance(sample: Inventory, query: str) -> None:
    assert "Heißklebepistole" in names(sample, query)


@pytest.mark.parametrize("query", ["tur", "tür", "tuer", "TÜR"])
def test_umlaut_tolerance(inv: Inventory, query: str) -> None:
    inv.create_node("Tür", "ding")
    inv.create_node("Fenster", "ding")
    assert names(inv, query) == ["Tür"]


def test_umlaut_in_data_found_without_umlaut(sample: Inventory) -> None:
    assert "Mützen" in names(sample, "mutzen")
    assert "Küche" in names(sample, "kueche")
    assert "Röhrenfernseher" in " ".join(
        names(sample, "rohrenfernseher", SearchFilter(include_archived=True))
    )


def test_all_words_must_match_in_any_order(sample: Inventory) -> None:
    assert "Heißkleber-Patronen" in names(sample, "patronen heisskleber")
    assert names(sample, "schere buntpapier") == []  # beides gibt es, aber nie im selben Knoten


def test_words_across_name_and_path(sample: Inventory) -> None:
    result = names(sample, "schrauben keller")
    assert "Holzschrauben 4x40" in result and "Spanplattenschrauben" in result
    assert "Schrauben" in result  # die Kiste selbst
    assert "Dübel 8mm" not in names(sample, "schrauben keller")
    assert "Pflaster" not in names(sample, "schrauben garage")


def test_path_only_match_is_no_match(sample: Inventory) -> None:
    # Alles im Keller liegt "im Pfad Keller" – aber nur der Raum selbst heißt so.
    result = names(sample, "keller")
    assert result == ["Keller"]


def test_word_starts_and_components(sample: Inventory) -> None:
    assert names(sample, "heißkl")[0] == "Heißklebepistole"
    assert "Heißklebepistole" in names(sample, "pistole")
    assert "Heißklebepistole" in names(sample, "klebepist")


# -- Tippfehler ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    ("typo", "expected"),
    [
        ("scharuben", "Schrauben"),
        ("hamer", "Hammer"),
        ("hammr", "Hammer"),
        ("hmmer", "Hammer"),
        ("pistoel", "Heißklebepistole"),
    ],
)
def test_typo_tolerance_from_four_letters(inv: Inventory, typo: str, expected: str) -> None:
    for n in ("Schrauben", "Hammer", "Schere"):
        inv.create_node(n, "ding")
    inv.create_node("Heißklebepistole", "ding", aliases=["Pistole"])
    result = names(inv, typo)
    assert expected in result


def test_no_fuzzy_below_four_letters(inv: Inventory) -> None:
    inv.create_node("Axt", "ding")
    assert names(inv, "aat") == []
    assert names(inv, "axt") == ["Axt"]


def test_exact_hits_suppress_fuzzy_noise(inv: Inventory) -> None:
    inv.create_node("Schere", "ding")
    inv.create_node("Schwere Kiste", "ding")
    assert names(inv, "schere") == ["Schere"]


def test_fuzzy_hit_is_labelled(inv: Inventory) -> None:
    inv.create_node("Hammer", "ding")
    hit = SearchIndex(inv).search("hamer").hits[0]
    assert hit.matched_in == "fuzzy"


# -- 7.1 Was durchsucht wird, 7.5 Fundstelle ---------------------------------------------
def test_matched_in_reports_the_place(sample: Inventory) -> None:
    index = SearchIndex(sample)

    def where(query: str) -> str:
        return index.search(query, SearchFilter(include_archived=True)).hits[0].matched_in

    assert where("Heißklebepistole") == "name"
    assert where("Bastelschere") == "alias"
    assert where("Verbrauch") == "tag"
    assert where("Dezember") == "note"
    assert where("Bosch") == "field"
    assert where("Huber") == "checkout"
    assert where("#14") == "number"


def test_searches_all_documented_places(sample: Inventory) -> None:
    assert "Basteln" in names(sample, "Kinder")  # Schlagwort
    assert "Weihnachten" in names(sample, "dezember")  # Notiz
    assert "Bohrmaschine" in names(sample, "SN-4711")  # Wert eines eigenen Feldes
    assert "Heißklebepistole" in names(sample, "huber")  # Entnahme: an wen
    assert "Christbaumschmuck" in names(sample, "christbaum")  # Entnahme: wo
    assert "Bohrmaschine" in names(sample, "schlagbohrer")  # weiterer Name


# -- Nummern ------------------------------------------------------------------------------
@pytest.mark.parametrize("query", ["14", "#14", " # 14 "])
def test_number_jumps_to_node(sample: Inventory, query: str) -> None:
    result = SearchIndex(sample).search(query)
    assert result.number_hit == by_name(sample, "Basteln")
    assert result.hits[0].name == "Basteln" and result.hits[0].number == 14


def test_unknown_number_has_no_jump(sample: Inventory) -> None:
    result = SearchIndex(sample).search("#999")
    assert result.number_hit is None


def test_number_inside_multi_word_query(sample: Inventory) -> None:
    assert names(sample, "basteln 14") == ["Basteln"]
    assert names(sample, "basteln 15") == []


# -- 7.3 Reihenfolge ----------------------------------------------------------------------
def test_ranking_order(inv: Inventory) -> None:
    inv.create_node("Nähzeug", "ding", note="enthält Nadel und Faden")
    inv.create_node("Garn", "ding", aliases=["Nadelgarn"])
    inv.create_node("Feinnadel", "ding")  # Wortbestandteil im Namen
    inv.create_node("Stricknadel", "ding", tags=["nadel-art"])
    inv.create_node("Nadelkissen", "ding")  # Namensanfang
    inv.create_node("Nadel", "ding")  # exakt
    inv.create_node("Rote Nadel", "ding")  # Wortanfang in mehrteiligem Namen
    inv.create_node("Nadeln", "ding", tags=["x"])
    result = names(inv, "nadel")
    assert result[0] == "Nadel"
    assert result.index("Nadel") < result.index("Nadelkissen") < result.index("Rote Nadel")
    assert result.index("Rote Nadel") < result.index("Feinnadel")
    assert result.index("Feinnadel") < result.index("Garn")  # Name vor weiterem Namen
    assert result.index("Garn") < result.index("Nähzeug")  # weiterer Name vor Notiz


def test_tag_ranks_after_alias_before_note(inv: Inventory) -> None:
    inv.create_node("A", "ding", note="werkzeug im Schuppen")
    inv.create_node("B", "ding", tags=["Werkzeug"])
    inv.create_node("C", "ding", aliases=["Werkzeug-Ding"])
    assert names(inv, "werkzeug") == ["C", "B", "A"]


def test_tie_break_items_before_containers_then_shorter_path(inv: Inventory) -> None:
    kiste = inv.create_node("Nadel-Kiste", "kiste")
    regal = inv.create_node("Regal", "regal")
    gruppe = inv.create_node("Nadel-Gruppe", "gruppe", kiste.id)
    inv.create_node("Nadel-Dose", "ding", regal.id)
    inv.create_node("Nadel-Tasche", "ding")
    inv.create_node("Nadel-Tief", "ding", gruppe.id)
    result = names(inv, "nadel")
    # alle gleich gut (Namensanfang): Dinge/Gruppen vor Behältern, dann kürzerer Pfad, dann Name
    assert result == ["Nadel-Tasche", "Nadel-Dose", "Nadel-Gruppe", "Nadel-Tief", "Nadel-Kiste"]


# -- Synonyme -----------------------------------------------------------------------------
def test_synonyms_expand_terms(sample: Inventory) -> None:
    result = names(sample, "hefter")
    assert "Tacker" in result
    assert "Tacker" in names(sample, "klammermaschine")
    assert "Bohrmaschine" in names(sample, "akkuschrauber")


def test_synonym_hits_rank_below_direct_hits(inv: Inventory) -> None:
    inv.set_synonyms([["Tacker", "Hefter"]])
    inv.create_node("Tacker", "ding")
    inv.create_node("Hefter blau", "ding")
    result = names(inv, "hefter")
    assert result == ["Hefter blau", "Tacker"]


def test_synonym_multiword_query(inv: Inventory) -> None:
    inv.set_synonyms([["Akkuschrauber", "Bohrmaschine"]])
    inv.create_node("Akkuschrauber", "ding", tags=["Elektro"])
    assert names(inv, "bohrmaschine elektro") == ["Akkuschrauber"]


# -- 7.4 Filter ---------------------------------------------------------------------------
def test_filter_kind_and_class(sample: Inventory) -> None:
    kisten = names(sample, "", SearchFilter(kinds=frozenset({"kiste"})))
    assert set(kisten) == {
        "Basteln",
        "Weihnachten",
        "Winterkleidung",
        "Schrauben",
        "Elektro",
        "Vorrat",
        "Camping",
    }
    behaelter = names(sample, "", SearchFilter(classes=frozenset({KindClass.CONTAINER})))
    assert "Erste-Hilfe-Tasche" in behaelter and "Basteln" in behaelter and "Schere" not in behaelter
    dinge = names(sample, "k", SearchFilter(classes=frozenset({KindClass.ITEM})))
    assert "Schere" not in dinge and "Krippe" in dinge
    assert (
        set(
            names(
                sample,
                "",
                SearchFilter(kinds=frozenset({"kiste"}), classes=frozenset({KindClass.ITEM})),
            )
        )
        == set()
    )


def test_filter_within(sample: Inventory) -> None:
    kiste = by_name(sample, "Basteln")
    result = names(sample, "", SearchFilter(within=kiste))
    assert set(result) == {
        "Bastelsachen",
        "Heißklebepistole",
        "Heißkleber-Patronen",
        "Buntpapier",
        "Schere",
        "Glitzer",
    }
    assert names(sample, "schere", SearchFilter(within=by_name(sample, "Garage"))) == []
    assert names(sample, "x", SearchFilter(within="nix")) == []


def test_filter_effective_owner(sample: Inventory) -> None:
    papa = next(p.id for p in sample.data.persons.values() if p.name == "Papa")
    result = names(sample, "", SearchFilter(owner=papa))
    assert "Bohrmaschine" in result and "Stichsäge" in result and "Werkstatt" in result  # geerbt
    assert "Nähzeug" not in result  # Mama überschreibt
    assert "Schere" not in result


def test_filter_tag_condition_checkout_number(sample: Inventory) -> None:
    assert names(sample, "", SearchFilter(tag="verbrauch")) == ["Batterien AA"]
    assert set(names(sample, "", SearchFilter(condition=Condition.MISSING))) == {"Schal (blau)"}
    assert set(names(sample, "", SearchFilter(condition=Condition.DEFECTIVE))) == {"Lichterkette"}
    assert set(names(sample, "", SearchFilter(checked_out=True))) == {
        "Heißklebepistole",
        "Christbaumschmuck",
        "Leiter",
    }
    assert "Heißklebepistole" not in names(sample, "", SearchFilter(checked_out=False))
    numbered = names(sample, "", SearchFilter(has_number=True))
    assert "Basteln" in numbered and "Schere" not in numbered
    assert "Basteln" not in names(sample, "", SearchFilter(has_number=False))


def test_filter_empty(sample: Inventory) -> None:
    sample.create_node("Leere Kiste", "kiste", number="auto")
    assert names(sample, "", SearchFilter(empty=True, kinds=frozenset({"kiste"}))) == ["Leere Kiste"]
    assert "Leere Kiste" not in names(sample, "", SearchFilter(empty=False, kinds=frozenset({"kiste"})))


def test_filter_stale(inv: Inventory, clock: FakeClock) -> None:
    alt = inv.create_node("Alt", "ding")
    clock.advance(days=366)
    neu = inv.create_node("Neu", "ding")
    bestaetigt = inv.create_node("Bestätigt", "ding")
    inv.verify_nodes([bestaetigt.id])
    assert names(inv, "", SearchFilter(stale=True)) == ["Alt"]
    assert set(names(inv, "", SearchFilter(stale=False))) == {"Neu", "Bestätigt", "Unsortiert"}
    assert alt.id and neu.id


def test_archived_and_trash_only_on_request(sample: Inventory) -> None:
    assert names(sample, "röhrenfernseher") == []
    assert names(sample, "röhrenfernseher", SearchFilter(include_archived=True)) == ["Alter Röhrenfernseher"]
    hit = SearchIndex(sample).search("röhrenfernseher", SearchFilter(include_archived=True)).hits[0]
    assert hit.archived
    sample.delete_node(by_name(sample, "Schere"))
    assert names(sample, "schere") == []
    assert names(sample, "schere", SearchFilter(include_archived=True)) == []  # Papierkorb nie


def test_combined_filters_and_query(sample: Inventory) -> None:
    result = names(
        sample,
        "schrauben",
        SearchFilter(within=by_name(sample, "Keller"), classes=frozenset({KindClass.ITEM})),
    )
    assert set(result) == {"Holzschrauben 4x40", "Spanplattenschrauben"}


# -- 7.5 Ergebnis -------------------------------------------------------------------------
def test_hit_contains_path_owner_and_hints(sample: Inventory) -> None:
    index = SearchIndex(sample)
    hit = index.search("heißklebepistole").hits[0]
    assert [name for _, name in hit.path] == [
        "Keller",
        "Regal B",
        "Basteln",
        "Bastelsachen",
        "Heißklebepistole",
    ]
    assert hit.kind == "ding" and hit.kind_class is KindClass.ITEM
    mia = next(p.id for p in sample.data.persons.values() if p.name == "Mia")
    assert hit.owner == mia and hit.owner_inherited is True
    codes = {h.code for h in hit.hints}
    assert codes == {"checked_out"}
    assert "Nachbar Huber" in hit.hints[0].text and "seit 2026-08-26" in hit.hints[0].text


def test_hints_for_missing_below_min_and_expiring(sample: Inventory) -> None:
    index = SearchIndex(sample)
    assert {h.code for h in index.search("schal").hits[0].hints} == {"missing"}
    assert {h.code for h in index.search("batterien").hits[0].hints} == {"below_min"}
    assert {h.code for h in index.search("nudeln").hits[0].hints} == {"expiring"}
    assert {h.code for h in index.search("lichterkette").hits[0].hints} == {"defective"}
    assert {h.code for h in index.search("campingstuhl").hits[0].hints} == {"to_sell"}


def test_hint_for_content_of_checked_out_container(sample: Inventory) -> None:
    sample.checkout_node(by_name(sample, "Camping"), CheckoutType.OUT, "im Urlaub")
    hit = SearchIndex(sample).search("gaskocher").hits[0]
    assert hit.hints[0].code == "checked_out" and "Teil von" in hit.hints[0].text


def test_expired_hint(sample: Inventory, clock: FakeClock) -> None:
    clock.advance(days=40)
    hit = SearchIndex(sample).search("nudeln").hits[0]
    assert {h.code for h in hit.hints} == {"expired"}


def test_limit_and_total(sample: Inventory) -> None:
    result = SearchIndex(sample).search("", None, limit=5)
    assert len(result.hits) == 5 and result.total > 5
    assert len(SearchIndex(sample).search("", None, limit=None).hits) == result.total


def test_empty_query_without_filters_lists_active_nodes(inv: Inventory) -> None:
    inv.create_node("A", "ding")
    assert "A" in names(inv, "")


# -- Index bleibt bei Änderungen aktuell --------------------------------------------------
def test_index_follows_changes(sample: Inventory) -> None:
    index = SearchIndex(sample)
    schere = by_name(sample, "Schere")
    sample.update_node(schere, {"name": "Nagelschere"})
    assert [h.name for h in index.search("nagelschere").hits] == ["Nagelschere"]
    assert index.search("schere", None).hits[0].name in {"Nagelschere", "Schere"}
    sample.move_nodes([by_name(sample, "Basteln")], by_name(sample, "Garage"))
    hit = index.search("nagelschere").hits[0]
    assert [n for _, n in hit.path][:2] == ["Garage", "Basteln"]
    sample.delete_node(by_name(sample, "Basteln"))
    assert index.search("nagelschere").hits == []
    sample.restore_node(by_name(sample, "Basteln"))
    assert index.search("nagelschere").total == 1
    sample.empty_trash()
    sample.set_synonyms([["schere", "klinge"]])
    assert "Nagelschere" in [h.name for h in index.search("klinge").hits]


def test_incremental_index_equals_fresh_rebuild(clock: FakeClock) -> None:
    """Zufällige Folgen von Änderungen: der gepflegte Index liefert dasselbe wie ein frischer."""
    rnd = random.Random(42)
    inv = Inventory(new_inventory_data("2026-10-10T09:00:00+02:00"), clock=clock, rng=random.Random(1))
    index = SearchIndex(inv)
    words = ["alpha", "beta", "gamma", "delta", "kiste", "regal", "nagel", "schraube"]
    for step in range(150):
        ids = [i for i in inv.data.nodes if i not in ("unsortiert", "papierkorb")]
        action = rnd.choice(["create", "create", "rename", "move", "delete", "restore", "tag", "dispose"])
        try:
            if action == "create" or not ids:
                parent = rnd.choice([None, *ids]) if ids else None
                inv.create_node(
                    f"{rnd.choice(words)} {rnd.choice(words)}",
                    rnd.choice(["ding", "kiste", "regal"]),
                    parent,
                )
            elif action == "rename":
                inv.update_node(rnd.choice(ids), {"name": f"{rnd.choice(words)} {step}"})
            elif action == "move":
                inv.move_nodes([rnd.choice(ids)], rnd.choice([None, *ids]))
            elif action == "delete":
                inv.delete_node(rnd.choice(ids), rnd.choice(["trash", "lift"]))
            elif action == "restore":
                trashed = inv.tree.children_ids("papierkorb")
                if trashed:
                    inv.restore_node(rnd.choice(trashed))
            elif action == "tag":
                inv.update_node(rnd.choice(ids), {"tags": [rnd.choice(words)]})
            else:
                inv.update_node(
                    rnd.choice(ids), {"condition": rnd.choice([Condition.DISPOSED, Condition.OK])}
                )
        except Exception:  # Regelverstoß wie Kreis wird abgelehnt; der Index muss trotzdem stimmen
            pass
        if step % 10 == 0:
            fresh = SearchIndex(inv)
            for query in ("alpha", "kiste", "nagel 1", "regal beta"):
                a = [
                    (h.node_id, h.score)
                    for h in index.search(query, SearchFilter(include_archived=True), None).hits
                ]
                b = [
                    (h.node_id, h.score)
                    for h in fresh.search(query, SearchFilter(include_archived=True), None).hits
                ]
                assert a == b, (step, action, query)


# -- 7.6 Leistung -------------------------------------------------------------------------
def _big_inventory(count: int, clock: FakeClock) -> Inventory:
    rnd = random.Random(3)
    data: InventoryData = new_inventory_data("2026-10-10T09:00:00+02:00")
    words = [
        "schraube",
        "nagel",
        "kabel",
        "zange",
        "hammer",
        "farbe",
        "pinsel",
        "leim",
        "dübel",
        "band",
        "kleber",
        "schere",
        "messer",
        "gabel",
        "löffel",
        "teller",
        "tasse",
        "kerze",
        "lampe",
        "buch",
    ]
    ids = [f"r{i:04d}" for i in range(20)]
    for rid in ids:
        data.nodes[rid] = Node(rid, f"Raum {rid}", "raum")
    containers: list[str] = []
    for i in range(count // 10):
        cid = f"k{i:05d}"
        data.nodes[cid] = Node(cid, f"Kiste {i}", "kiste", parent=rnd.choice(ids), number=i + 1)
        containers.append(cid)
    for i in range(count - len(data.nodes)):
        nid = f"d{i:05d}"
        name = f"{rnd.choice(words)} {rnd.choice(words)} {i}"
        data.nodes[nid] = Node(
            nid,
            name,
            "ding",
            parent=rnd.choice(containers),
            tags=[rnd.choice(words)],
            note=" ".join(rnd.choice(words) for _ in range(6)),
        )
    return Inventory(data, clock=clock)


def test_search_performance_5000_nodes(clock: FakeClock) -> None:
    inv = _big_inventory(5000, clock)
    assert len(inv.data.nodes) == 5000
    start = time.perf_counter()
    index = SearchIndex(inv)
    build = time.perf_counter() - start
    timings = []
    for query in ("schraube", "schraube nagel", "hamer", "kiste 12", "dübel raum", "#77", "zzzz"):
        t0 = time.perf_counter()
        index.search(query)
        timings.append(time.perf_counter() - t0)
    # Ziel: unter 50 ms auf dem Pi 5; hier großzügige Schranke gegen langsame Testrechner.
    assert max(timings) < 0.5, timings
    assert build < 5
    # Pflege des Index bei einer Änderung ist billig
    t0 = time.perf_counter()
    inv.update_node("d00010", {"name": "Neuer Name"})
    assert time.perf_counter() - t0 < 0.2


def test_query_without_letters_or_digits_finds_nothing(sample: Inventory) -> None:
    index = SearchIndex(sample)
    assert (
        index.search("---").hits == [] and index.search("  ").total > 0
    )  # leer = alles, Satzzeichen = nichts
    assert index.search("").total > 0


def test_generator_arguments_are_not_consumed_twice(inv: Inventory) -> None:
    from custom_components.ordnungstracker.core.model import FieldType

    definition = inv.add_field_def(
        "X", FieldType.TEXT, kinds=(k for k in ["ding"]), classes=(c for c in [KindClass.ITEM])
    )
    assert definition.kinds == ["ding"] and definition.classes == [KindClass.ITEM]
