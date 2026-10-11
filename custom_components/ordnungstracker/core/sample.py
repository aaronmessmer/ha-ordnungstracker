"""Beispielhaushalt (Pflichtenheft 8.14).

Etwa 60 Knoten, die alle Funktionen zeigen: Nummern, Verschachtelung, Besitz mit Vererbung,
lokale Felder, Entnahme, Zustände, Mindestbestand, Ablaufdatum, Wartung, Listen, Vorlagen und
Synonyme. Alle Datumsangaben beziehen sich auf „heute“, damit „Fällig“ etwas zeigt.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from .errors import InvalidValueError
from .inventory import Inventory
from .model import (
    TRASH_ID,
    UNSORTED_ID,
    CheckoutType,
    Condition,
    FieldType,
    Interval,
    IntervalUnit,
    SampleInfo,
    TemplateNode,
)

_SYSTEM = {UNSORTED_ID, TRASH_ID}


def is_pristine(inv: Inventory) -> bool:
    """Ist das Inventar leer (nur die zwei Systemknoten, keine Listen, Vorlagen, Personen)?"""
    data = inv.data
    return (
        set(data.nodes) <= _SYSTEM
        and not data.lists
        and not data.templates
        and not data.persons
        and not data.synonyms
        and not any(not f.builtin for f in data.fields.values())
    )


def load_sample(inv: Inventory) -> int:
    """Beispielhaushalt laden. Nur in ein leeres Inventar; liefert die Zahl angelegter Knoten."""
    if not is_pristine(inv):
        raise InvalidValueError(
            "Beispieldaten lassen sich nur in ein leeres Inventar laden. Entferne vorher deine "
            "Einträge oder lege die Beispieldaten in einer frischen Installation an."
        )
    today = inv.today()

    def day(offset: int) -> str:
        return (today + timedelta(days=offset)).isoformat()

    papa = inv.add_person("Papa", "person.papa")
    mama = inv.add_person("Mama", "person.mama")
    kind = inv.add_person("Mia")
    created_nodes: list[str] = []

    def add(name: str, kind_id: str, parent: str | None, **kw: Any) -> str:
        node = inv.create_node(name, kind_id, parent, **kw)
        created_nodes.append(node.id)
        return node.id

    # Räume
    keller = add("Keller", "raum", None)
    kueche = add("Küche", "raum", None)
    wohnen = add("Wohnzimmer", "raum", None)
    werkstatt = add("Werkstatt", "raum", keller, owner=papa.id)
    garage = add("Garage", "raum", None)

    # Keller: Regal B mit nummerierten Kisten
    regal_b = add("Regal B", "regal", keller)
    k14 = add("Basteln", "kiste", regal_b, number=14, tags=["Kinder"], owner=kind.id)
    bastel = add("Bastelsachen", "gruppe", k14)
    pistole = add("Heißklebepistole", "ding", bastel, aliases=["Klebepistole"])
    add("Heißkleber-Patronen", "ding", bastel, quantity=12, unit="Stück", min_quantity=5)
    add("Buntpapier", "ding", bastel, quantity=3, unit="Pack")
    add("Schere", "ding", bastel, aliases=["Bastelschere"])
    add("Glitzer", "ding", bastel, tags=["bunt"])
    k15 = add("Weihnachten", "kiste", regal_b, number=15, note="Nur im Dezember öffnen.")
    schmuck = add("Christbaumschmuck", "ding", k15, quantity=48, unit="Stück")
    add(
        "Lichterkette",
        "ding",
        k15,
        note="Defekt? Vor Gebrauch testen.",
        condition=Condition.DEFECTIVE,
    )
    add("Krippe", "ding", k15)
    k16 = add("Winterkleidung", "kiste", regal_b, number=16)
    add("Mützen", "ding", k16, quantity=4)
    add("Handschuhe", "ding", k16, quantity=3, unit="Paar")
    add("Schal (blau)", "ding", k16, condition=Condition.MISSING)
    add("Campingstuhl", "ding", regal_b, condition=Condition.TO_SELL)

    # Werkstatt (Besitzer Papa wird vererbt; Schublade überschreibt)
    wregal = add("Werkzeugregal", "regal", werkstatt)
    k20 = add("Schrauben", "kiste", wregal, number=20)
    add("Holzschrauben 4x40", "ding", k20, quantity=200, unit="Stück", min_quantity=50)
    add("Spanplattenschrauben", "ding", k20, quantity=40, unit="Stück", min_quantity=50)
    add("Dübel 8mm", "ding", k20, quantity=60, unit="Stück")
    k21 = add("Elektro", "kiste", wregal, number=21)
    batterien = add("Batterien AA", "ding", k21, quantity=2, unit="Stück", min_quantity=8, tags=["Verbrauch"])
    add("Isolierband", "ding", k21, quantity=3, unit="Rollen")
    tacker = add("Tacker", "ding", wregal, aliases=["Handtacker"])
    schublade = add("Schublade Mama", "regal", werkstatt, owner=mama.id)
    add("Nähzeug", "ding", schublade)
    add("Knöpfe", "ding", schublade, quantity=40, unit="Stück")
    schleif = add("Schleifmittel", "gruppe", werkstatt)
    add("Schleifpapier K80", "ding", schleif)
    add("Schleifpapier K120", "ding", schleif)
    add("Schleifschwamm", "ding", schleif)
    bohrer = add("Bohrmaschine", "ding", werkstatt, aliases=["Schlagbohrer"], tags=["Elektro"])
    add("Stichsäge", "ding", werkstatt)
    heizung = add("Heizung", "ding", keller, note="Gas-Brennwertgerät im Heizungsraum.")

    # Küche
    vorrat = add("Vorratsschrank", "schrank", kueche)
    k30 = add("Vorrat", "kiste", vorrat, number=30)
    nudeln = add("Nudeln", "ding", k30, quantity=4, unit="Pack")
    add("Reis", "ding", k30, quantity=2, unit="kg")
    add("Tomatensauce", "ding", k30, quantity=3, unit="Gläser", min_quantity=2)
    add("Mehl", "ding", vorrat)
    add("Kaffeemaschine", "ding", kueche, aliases=["Kaffeevollautomat"], tags=["Elektro"])
    schrank_geschirr = add("Geschirrschrank", "schrank", kueche)
    add("Teller", "ding", schrank_geschirr, quantity=12, unit="Stück")
    add("Gläser", "ding", schrank_geschirr, quantity=8, unit="Stück")

    # Wohnzimmer
    sideboard = add("Sideboard", "schrank", wohnen)
    add("Spiele", "gruppe", sideboard)
    add("Fotoalben", "ding", sideboard)
    add("Fernbedienung Beamer", "ding", wohnen, condition=Condition.OK)
    add(
        "Alter Röhrenfernseher",
        "ding",
        wohnen,
        condition=Condition.DISPOSED,
        note="Zum Wertstoffhof gebracht.",
    )

    # Garage
    rasenmaeher = add("Rasenmäher", "ding", garage, tags=["Garten"])
    add("Reifen (Sommer)", "ding", garage, quantity=4, unit="Stück")
    leiter = add("Leiter", "ding", garage)
    k40 = add("Camping", "kiste", garage, number=40)
    zelt = add("Zelt (4 Personen)", "ding", k40)
    add("Schlafsäcke", "ding", k40, quantity=4, unit="Stück")
    add("Gaskocher", "ding", k40)
    tasche = add("Erste-Hilfe-Tasche", "tasche", garage, number=41)
    add("Pflaster", "ding", tasche, quantity=20, unit="Stück", min_quantity=10)
    add("Verbandsmaterial", "ding", tasche)

    # Unsortiert
    add("Unbekannter Schlüssel", "ding", UNSORTED_ID)

    # Felder
    koernung = inv.add_field_def("Körnung", FieldType.NUMBER, group="Schleifen", scope_node=schleif)
    for nid, grit in (("Schleifpapier K80", 80), ("Schleifpapier K120", 120)):
        target = next(n for n in inv.data.nodes.values() if n.name == nid)
        inv.set_field_value(target.id, koernung.id, grit)
    inv.set_field_value(nudeln, "expiry", day(12))
    inv.set_field_value(nudeln, "price", 3.6)
    inv.set_field_value(bohrer, "warranty_until", day(20))
    inv.set_field_value(bohrer, "price", 129)
    inv.set_field_value(bohrer, "manufacturer", "Bosch")
    inv.set_field_value(bohrer, "serial_number", "SN-4711")
    inv.set_field_value(rasenmaeher, "purchase_date", day(-400))
    inv.set_field_value(rasenmaeher, "price", 349)

    # Entnahme
    inv.checkout_node(pistole, CheckoutType.LENT, "Nachbar Huber", since=day(-45))
    inv.checkout_node(schmuck, CheckoutType.OUT, "hängt am Christbaum", since=day(-3), until=day(30))
    inv.checkout_node(leiter, CheckoutType.LENT, "Onkel Bernd", since=day(-10), until=day(-2))

    # Wartung
    task = inv.add_maintenance(
        heizung,
        "Wartung durch den Installateur",
        interval=Interval(1, IntervalUnit.YEARS),
        next_due=day(-5),
    )
    inv.update_maintenance(heizung, task.id, {"note": "Termin: Fa. Meier, 0123 456789"})
    inv.add_maintenance(
        rasenmaeher, "Messer schärfen", interval=Interval(6, IntervalUnit.MONTHS), next_due=day(60)
    )
    inv.add_maintenance(tacker, "Ölen", next_due=day(0))

    # Bestätigt
    inv.verify_nodes([k14, k15])

    # Synonyme, Vorlage, Liste
    synonyms = inv.set_synonyms(
        [["Tacker", "Hefter", "Klammermaschine"], ["Bohrmaschine", "Bohrer", "Akkuschrauber"]]
    )
    template = inv.add_template(
        "Werkzeugkoffer",
        "kiste",
        tags=["Werkzeug"],
        children=[
            TemplateNode("Schraubendreher", "gruppe", children=[TemplateNode("Kreuzschlitz", "ding")]),
            TemplateNode("Zangen", "gruppe"),
            TemplateNode("Maßband", "ding"),
        ],
    )
    packlist = inv.create_list("Campingausrüstung")
    inv.add_list_entry(packlist.id, node=zelt, note="Heringe nicht vergessen")
    inv.add_list_entry(packlist.id, node=batterien, quantity=8)
    inv.add_list_entry(packlist.id, text="Wasserkanister füllen")
    inv.add_list_entry(packlist.id, node=tacker)

    inv.data.meta.sample = SampleInfo(
        nodes=list(created_nodes),
        persons=[papa.id, mama.id, kind.id],
        templates=[template.id],
        lists=[packlist.id],
        synonyms=synonyms,
    )
    return len(created_nodes)


def remove_sample(inv: Inventory) -> int:
    """Beispieldaten wieder entfernen. Eigene Einträge in Beispielknoten wandern nach „Unsortiert“.

    Liefert die Zahl entfernter Beispielknoten.
    """
    sample = inv.data.meta.sample
    if sample is None:
        raise InvalidValueError("Es sind keine Beispieldaten geladen.")
    sample_nodes = set(sample.nodes) & set(inv.data.nodes)
    # Eigene Einträge retten
    rescue = [
        n.id
        for n in inv.data.nodes.values()
        if n.id not in sample_nodes and n.id not in _SYSTEM and n.parent in sample_nodes
    ]
    if rescue:
        inv.move_nodes(rescue, UNSORTED_ID)
    tops = [nid for nid in sample_nodes if inv.data.nodes[nid].parent not in sample_nodes]
    count = len(sample_nodes)
    for nid in tops:
        if nid in inv.data.nodes and inv.data.nodes[nid].parent != TRASH_ID:
            inv.delete_node(nid, "trash")
        if nid in inv.data.nodes:
            inv.purge_node(nid)
    for lid in sample.lists:
        if lid in inv.data.lists:
            inv.delete_list(lid)
    for tid in sample.templates:
        if tid in inv.data.templates:
            inv.delete_template(tid)
    for pid in sample.persons:
        if pid in inv.data.persons:
            inv.delete_person(pid)
    remaining = [g for g in inv.data.synonyms if g not in sample.synonyms]
    if len(remaining) != len(inv.data.synonyms):
        inv.set_synonyms(remaining)
    inv.data.meta.sample = None
    return count


def build_example_inventory() -> Inventory:
    """Beispielhaushalt mit festem Datum und festem Zufall (für ``beispiele/``, reproduzierbar)."""
    import random
    from datetime import datetime, timezone

    from .defaults import new_inventory_data

    tz = timezone(timedelta(hours=2))

    def clock() -> datetime:
        return datetime(2026, 10, 10, 9, 0, 0, tzinfo=tz)

    inv = Inventory(
        new_inventory_data(clock().isoformat(timespec="seconds")),
        clock=clock,
        rng=random.Random(2026),
    )
    load_sample(inv)
    return inv


if __name__ == "__main__":  # pragma: no cover
    import sys
    from pathlib import Path

    from . import jsonio

    target = Path(sys.argv[1] if len(sys.argv) > 1 else "beispiele/beispiel-haushalt.json")
    target.write_text(jsonio.dumps(build_example_inventory().data.to_dict()), encoding="utf-8")
    print(f"geschrieben: {target}")  # noqa: T201
