"""Mitgelieferte Arten, Felddefinitionen und Systemknoten (Pflichtenheft 5.2, 5.8, 5.13)."""

from __future__ import annotations

from .model import (
    DEFAULT_ROOM_KIND,
    TRASH_ID,
    UNSORTED_ID,
    FieldDef,
    FieldType,
    InventoryData,
    Kind,
    KindClass,
    Meta,
    Node,
)


def default_kinds() -> list[Kind]:
    return [
        Kind(DEFAULT_ROOM_KIND, "Raum", KindClass.PLACE, "mdi:door"),
        Kind("regal", "Regal", KindClass.FURNITURE, "mdi:bookshelf"),
        Kind("schrank", "Schrank", KindClass.FURNITURE, "mdi:wardrobe"),
        Kind("kiste", "Kiste", KindClass.CONTAINER, "mdi:package-variant", numbered=True),
        Kind("tasche", "Tasche", KindClass.CONTAINER, "mdi:bag-personal", numbered=True),
        Kind("gruppe", "Gruppe", KindClass.GROUP, "mdi:shape"),
        Kind("ding", "Ding", KindClass.ITEM, "mdi:circle-small"),
    ]


def builtin_fields() -> list[FieldDef]:
    """Von Homebox bekannte Angaben als mitgelieferte Felddefinitionen (5.8)."""
    haltbarkeit, kauf, geraet = "Haltbarkeit", "Kauf und Garantie", "Gerät"
    return [
        FieldDef(
            "expiry",
            "Ablaufdatum",
            FieldType.DATE,
            haltbarkeit,
            remind_days_before=30,
            builtin=True,
        ),
        FieldDef("purchase_date", "Kaufdatum", FieldType.DATE, kauf, builtin=True),
        FieldDef("price", "Preis", FieldType.NUMBER, kauf, unit="€", builtin=True),
        FieldDef("vendor", "Händler", FieldType.TEXT, kauf, builtin=True),
        FieldDef(
            "warranty_until",
            "Garantie bis",
            FieldType.DATE,
            kauf,
            remind_days_before=30,
            builtin=True,
        ),
        FieldDef("manufacturer", "Hersteller", FieldType.TEXT, geraet, builtin=True),
        FieldDef("model", "Modell", FieldType.TEXT, geraet, builtin=True),
        FieldDef("serial_number", "Seriennummer", FieldType.TEXT, geraet, builtin=True),
        FieldDef("manual_url", "Link zur Anleitung", FieldType.LINK, geraet, builtin=True),
    ]


def new_inventory_data(now: str) -> InventoryData:
    """Leeres, gültiges Inventar: Standardarten, mitgelieferte Felder und die zwei Systemknoten."""
    data = InventoryData(meta=Meta(created=now, modified=now))
    for kind in default_kinds():
        data.kinds[kind.id] = kind
    for definition in builtin_fields():
        data.fields[definition.id] = definition
    data.nodes[UNSORTED_ID] = Node(UNSORTED_ID, "Unsortiert", DEFAULT_ROOM_KIND, created=now, modified=now)
    data.nodes[TRASH_ID] = Node(TRASH_ID, "Papierkorb", DEFAULT_ROOM_KIND, created=now, modified=now)
    return data
