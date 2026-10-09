# Architektur

Verbindliche Vorgaben: `docs/PFLICHTENHEFT.md`, Abschnitt 4. Dieses Dokument beschreibt, wie sie umgesetzt sind. Stand: Phase 1.

## Drei Schichten

```
Oberfläche (TypeScript, Lit)        frontend/ → custom_components/ordnungstracker/frontend/   (Phase 3)
   │  WebSocket-Befehle + Abo
Home-Assistant-Schicht (Python)     __init__.py, config_flow.py, … (Phase 2)
   │  gewöhnliche Python-Aufrufe
Kern (reines Python)                custom_components/ordnungstracker/core/                   (Phase 1, fertig)
```

* **Der Kern importiert nichts aus `homeassistant`.** Ein Test (`tests/core/test_invariants.py`) prüft das mit einer Syntaxanalyse aller Kern-Dateien.
* **Die Fachlogik sitzt im Kern.** Suche, Vererbung, Fälligkeiten und Regeln werden dort berechnet; Oberfläche, Dienste und Sprachabfrage rufen dasselbe auf.
* **Keine zusätzlichen Python-Abhängigkeiten** (`manifest.json: "requirements": []`). Die unscharfe Suche ist eine eigene Implementierung (Damerau-Levenshtein über ein Wörterbuch).
* **Eine Instanz, keine YAML-Konfiguration.** Einrichtung per Config Flow (`single_config_entry`).

## Module des Kerns

| Modul | Aufgabe |
|---|---|
| `model.py` | Datenklassen (`Node`, `Kind`, `FieldDef`, `Checkout`, …) und `InventoryData`; `to_dict()` liefert genau die Darstellung der Datei |
| `parse.py` | Datei → `InventoryData`; sammelt **alle** Befunde mit Knotenname und Klartext |
| `validation.py` | Regeln aus 5.14 (`validate_inventory`), Typprüfung von Feldwerten, Hinweis auf ungewöhnliche Ablage |
| `tree.py` | `Tree`: Kinder-Index, Pfad, Vorfahren, Nachkommen, wirksamer Besitzer und Entnahme, Papierkorb/Archiv, Sortierung, Zählung, Art-Vorschlag für neue Knoten |
| `inventory.py` | `Inventory`: **alle ändernden Operationen** (anlegen, ändern, verschieben, löschen, Papierkorb, Arten, Personen, Felder, Entnahme, Menge, Wartung, Inventur, Listen, Vorlagen, Synonyme, Einstellungen) |
| `fields.py` | Geltungsbereich eigener Felder, Feldansicht inklusive „nicht mehr zugeordnet“ |
| `search.py` | `SearchIndex`: Suchindex, Filter, Rangfolge, Hinweise |
| `reminders.py` | Fälligkeiten in fünf Rubriken, Entnommen-Übersicht, Kalendertermine, Ereignis-Merker, „lange nicht bestätigt“, Hinweise je Knoten |
| `overview.py` | Kennzahlen der Startseite und der Sensoren; anonyme Zusammenfassung für die Diagnose |
| `quickadd.py` | Parser der Schnellerfassung, Vorschau, Anlegen |
| `export.py` | Markdown-Export und HTML-Druckansichten |
| `store.py` | `InventoryStore`: Laden, gebündeltes atomares Speichern, Sperre, Rollback, Sicherungen, Fremdänderungen, Import, Wiederherstellen |
| `migrations.py` | Kette von Migrationen und Versionsprüfung |
| `backup.py`, `journal.py` | Aufbewahrungsregeln der Sicherungen; Änderungsprotokoll mit Rotation |
| `userdata.py` | `benutzer.json` (Favoriten, zuletzt angesehen, Ansichten, begonnene Inventur) und `zustand.json` (Merker) |
| `sample.py` | Beispielhaushalt laden/entfernen, reproduzierbares Beispielinventar |
| `jsonio.py`, `textnorm.py`, `dates.py`, `ids.py`, `defaults.py`, `errors.py` | Hilfen |

## Wie eine Änderung abläuft

```
Aufrufer (Dienst / WebSocket / Oberfläche)
   └─ await store.async_mutate(lambda inv: inv.move_nodes([...], ziel), user)
        1. Sperre nehmen (alle Schreibzugriffe sind serialisiert)
        2. Zwischenstand sichern (inventory.data.to_dict())
        3. Operation ausführen – prüft vorab, ändert dann, hinterlässt je einen `Change`
        4. validate_inventory(...)   → bei Fehler: Zwischenstand zurückspielen, `InvariantViolation`
        5. Changes → Protokoll (verlauf.jsonl) und Suchindex (über `Inventory.subscribe`)
        6. Speichern kurz bündeln (1 s), dann im Thread: Sicherung (höchstens stündlich) → atomar schreiben → Protokoll anhängen
```

Eine Operation ist eine Methode von `Inventory`; sie hinterlässt einen `Change` (Aktion, Benutzer, Knoten, Einzelheiten wie alter/neuer Pfad, betroffene Knoten für den Index). Das ist die Grundlage für ein späteres „Rückgängig“ (Pflichtenheft 6.4, 14): Die
Protokollzeilen enthalten bei Änderungen die alten Werte.

## Warum flach?

Knoten liegen flach in `nodes` und verweisen über `parent` aufeinander. Verschieben ändert genau eine Zeile, Verweise aus Listen bleiben stabil, und die Datei lässt sich mit jedem Werkzeug verarbeiten. Für die Navigation baut `Tree` einen Kinder-Index
(`parent → [Kinder]`), der nach jeder strukturellen Änderung neu aufgebaut wird (bei 5.000 Knoten ≈ 1 ms).

## Geplante Home-Assistant-Schicht (Phase 2)

`__init__.py` (Laden des Speichers, Ablage in `entry.runtime_data`, Timer für Fremdänderungen und tägliche Pflege), `websocket_api.py`, `services.py`/`services.yaml`, `sensor.py`, `calendar.py`, `intent.py`, `diagnostics.py`, `repairs.py`, geschützte Ansichten für Export und Druck.
Sie übersetzt nur zwischen Home Assistant und Kern. Einzelheiten der Plattform-Recherche: `docs/ENTSCHEIDUNGEN.md`, Abschnitt A.

## Tests

* `tests/core/` – Kern ohne Home Assistant, schnell (≈ 5 s), Abdeckung ≥ 90 % (aktuell ≈ 97 %).
* `tests/ha/` – Home-Assistant-Schicht mit `pytest-homeassistant-custom-component`.
* `tests/test_repository.py` – Gerüst (Manifest, Übersetzungen, HACS, Dokumente).
* Besondere Tests: Fuzz-Test der Regeln (zufällige Operationsfolgen, 12 feste Startwerte), Fuzz-Test „gepflegter Index = frischer Index“, Leistungstest der Suche mit 5.000 Knoten, Absturz beim Schreiben, Fremdänderungen, Migrationen.
