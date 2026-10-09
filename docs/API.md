# Schnittstellen

> **Stand: Phase 1.** Die WebSocket-Befehle und Dienste entstehen in **Phase 2** (Pflichtenheft 9.3, 9.4) und werden hier beschrieben, sobald sie existieren.
> Bis dahin gilt nur, was unten steht.

## Konventionen (verbindlich ab Phase 2)

* WebSocket-Befehle heißen `ordnungstracker/<aktion>`; jeder schreibende Befehl vermerkt den aufrufenden Benutzer im Änderungsprotokoll.
* Fehler: Der Kern wirft `InventoryError` (Unterklassen siehe `core/errors.py`). Die HA-Schicht gibt `code` (stabil, englisch) und die deutsche Meldung weiter.
* Änderungen laufen immer über `InventoryStore.async_mutate`, Lesezugriffe über `store.inventory` und `SearchIndex`.

## Fehlercodes des Kerns

| `code` | Klasse | Bedeutung |
|---|---|---|
| `not_found` | `NotFoundError` | Knoten, Art, Person, Feld, Liste, Vorlage oder Sicherung existiert nicht |
| `invalid_value` | `InvalidValueError` | ungültiger Wert (leerer Name, falsches Datum, negative Menge, …) |
| `cycle` | `CycleError` | Verschieben in sich selbst oder in einen eigenen Unterpunkt |
| `number_taken` | `NumberTakenError` | Nummer schon vergeben (Platzhalter `holder`) |
| `system_node` | `SystemNodeError` | Unsortiert/Papierkorb lassen sich nicht löschen, verschieben oder umbenennen |
| `in_use` | `InUseError` | Art/Feld wird noch gebraucht |
| `trash` | `TrashError` | Aktion für Knoten im Papierkorb nicht erlaubt |
| `invariant_violation` | `InvariantViolation` | Änderung hätte eine Regel aus 5.14 verletzt und wurde zurückgenommen |
| `load_failed` | `InventoryLoadError` | Datei ungültig (`problems`, `last_valid_backup`) |
| `newer_schema` | `NewerSchemaError` | Datei stammt von einer neueren Version |

## Kern-Schnittstelle (Python)

Kurzüberblick der wichtigsten Aufrufe; die Docstrings im Code sind maßgeblich.

```python
store = InventoryStore(Path(hass.config.path("ordnungstracker")))
inventory = await store.async_load()
index = SearchIndex(inventory)

result = index.search("schrauben keller", SearchFilter(classes=frozenset({KindClass.ITEM})), limit=50)
node = await store.async_mutate(lambda inv: inv.create_node("Hammer", "ding", parent_id, number="auto"), user_id)
await store.async_mutate(lambda inv: inv.move_nodes([a, b], ziel_id), user_id)
await store.async_mutate(lambda inv: inv.delete_node(node_id, "trash"), user_id)   # oder "lift"
due = collect_due(inventory)            # Fälligkeiten in fünf Rubriken
text = render_markdown(inventory)       # lesbarer Export; render_*_html für den Druck
```
