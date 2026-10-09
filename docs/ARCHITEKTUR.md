# Architektur

Verbindliche Vorgaben: `docs/PFLICHTENHEFT.md`, Abschnitt 4. Dieses Dokument beschreibt, wie sie umgesetzt sind. Stand: Phase 0 (Entwurf).

## Drei Schichten

```
Oberfläche (TypeScript, Lit)        frontend/ → custom_components/ordnungstracker/frontend/   (Phase 3)
   │  WebSocket-Befehle + Abo
Home-Assistant-Schicht (Python)     __init__.py, config_flow.py, … (Phase 2)
   │  gewöhnliche Python-Aufrufe
Kern (reines Python)                custom_components/ordnungstracker/core/                   (Phase 1)
```

* **Der Kern importiert nichts aus `homeassistant`.** (Ein Test, der das erzwingt, kommt mit dem Kern in Phase 1.)
* **Die Fachlogik sitzt im Kern.** Suche, Vererbung, Fälligkeiten und Regeln werden dort berechnet; Oberfläche, Dienste und Sprachabfrage rufen dasselbe auf.
* **Keine zusätzlichen Python-Abhängigkeiten** (`manifest.json: "requirements": []`). Die unscharfe Suche ist eine eigene Implementierung (Damerau-Levenshtein über ein Wörterbuch).
* **Eine Instanz, keine YAML-Konfiguration.** Einrichtung per Config Flow (`single_config_entry`).

## Geplante Module des Kerns (Phase 1)

`model` (Datenklassen), `parse` und `validation` (Datei einlesen, Regeln aus 5.14), `tree` (Baumoperationen), `inventory` (alle ändernden Operationen), `fields`, `search` (Suchindex), `reminders` (Fälligkeiten),
`quickadd`, `export`, `store` (Laden/Speichern), `migrations`, `journal`/`backup`, `sample`. Sie werden in Phase 1 gebaut und dann hier im Einzelnen beschrieben.

## Warum flach?

Knoten liegen flach in `nodes` und verweisen über `parent` aufeinander. Verschieben ändert genau eine Zeile, Verweise aus Listen bleiben stabil, und die Datei lässt sich mit jedem Werkzeug verarbeiten. Für die Navigation baut `Tree` einen Kinder-Index
(`parent → [Kinder]`), der nach jeder strukturellen Änderung neu aufgebaut wird (bei 5.000 Knoten ≈ 1 ms).

## Geplante Home-Assistant-Schicht (Phase 2)

`__init__.py` (Laden des Speichers, Ablage in `entry.runtime_data`, Timer für Fremdänderungen und tägliche Pflege), `websocket_api.py`, `services.py`/`services.yaml`, `sensor.py`, `calendar.py`, `intent.py`, `diagnostics.py`, `repairs.py`, geschützte Ansichten für Export und Druck.
Sie übersetzt nur zwischen Home Assistant und Kern. Einzelheiten der Plattform-Recherche: `docs/ENTSCHEIDUNGEN.md`, Abschnitt A.

## Tests

* `tests/core/` – Kern ohne Home Assistant (ab Phase 1), Abdeckung ≥ 90 %.
* `tests/ha/` – Home-Assistant-Schicht mit `pytest-homeassistant-custom-component`.
* `tests/test_repository.py` – Gerüst (Manifest, Übersetzungen, HACS, Dokumente).
