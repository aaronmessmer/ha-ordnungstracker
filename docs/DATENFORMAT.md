# Datenformat

Beschreibung von `inventar.json` (Pflichtenheft 6.2). **Version 1.** Dazu gehören ein JSON-Schema (`docs/inventar.schema.json`, gegen das die Tests alle Dateien in `beispiele/` prüfen) und ein vollständiges
Beispiel (`beispiele/beispiel-haushalt.json`, 67 Knoten, alle Funktionen).

Die Datei darf von Hand bearbeitet werden. Beim Start und bei Änderungen von außen wird sie geprüft; ist sie ungültig, überschreibt die Integration nichts und meldet, **was** und **in welchem Knoten** nicht stimmt.

## Allgemeines

* Kodierung UTF-8, zwei Leerzeichen Einrückung, Umlaute unverändert, Schlüssel englisch, Inhalte in der Sprache des Nutzers.
* Es stehen nur Angaben in der Datei, die vom Standard abweichen. Kurze Objekte stehen in einer Zeile.
* **Unbekannte Schlüssel sind ein Fehler** (Schutz vor Tippfehlern).
* Datum: `JJJJ-MM-TT`. Zeitstempel: `JJJJ-MM-TTThh:mm:ss+hh:mm` (ein reines Datum ist ebenfalls erlaubt).
* Kennungen (`id`, Schlüssel in `nodes`) sind kurz, zufällig und dauerhaft (z. B. `n4k2q9`); nur die zwei Systemknoten haben feste Kennungen (`unsortiert`, `papierkorb`).
* Die Datei ist die **einzige Quelle der Wahrheit**. Daneben liegen `benutzer.json`, `verlauf.jsonl`, `zustand.json` (siehe unten).

## Oberste Ebene

```json
{
  "schema_version": 1,
  "meta": { "created": "…", "modified": "…" },
  "settings": { "lent_days": 30, "stale_days": 365, "trash_days": 30 },
  "kinds": [ … ], "persons": [ … ], "fields": [ … ],
  "synonyms": [ ["tacker", "hefter"] ],
  "templates": [ … ], "lists": [ … ],
  "nodes": { "r7m1x3": { … } }
}
```

| Schlüssel | Pflicht | Bedeutung |
|---|---|---|
| `schema_version` | ja | Ganze Zahl ab 1. Eine neuere Version als die Integration kennt wird **nicht** angefasst. |
| `meta` | nein | `created`, `modified`; `sample` (Kennungen der Beispieldaten: `nodes`, `persons`, `templates`, `lists`, `synonyms`) |
| `settings` | nein | Schwellen, nur bei Abweichung geschrieben. `lent_days` (Standard 30): Ausgeliehenes ohne Datum gilt danach als überfällig. `stale_days` (365): „lange nicht bestätigt“. `trash_days` (30): Aufbewahrung im Papierkorb. |
| `kinds` | nein | Arten (siehe unten) |
| `persons` | nein | Personen |
| `fields` | nein | Felddefinitionen |
| `synonyms` | nein | Liste von Gruppen (je mindestens zwei Begriffe) |
| `templates`, `lists` | nein | Vorlagen, Listen |
| `nodes` | ja | Objekt: Kennung → Knoten (flach, Verweis über `parent`) |

## Arten (`kinds`)

| Schlüssel | Pflicht | Bedeutung |
|---|---|---|
| `id` | ja | Kennung |
| `name` | ja | Anzeigename |
| `class` | ja | `place` (Raum), `furniture` (Regal, Schrank), `container` (Kiste, Tasche), `group`, `item` |
| `icon` | nein | z. B. `mdi:package-variant` |
| `numbered` | nein | `true`: Knoten dieser Art bekommen üblicherweise eine Nummer |

Mitgeliefert: Raum, Regal, Schrank, Kiste (nummeriert), Tasche (nummeriert), Gruppe, Ding. Es muss mindestens eine Art der Klasse `group` geben.

## Personen (`persons`)

`id`, `name`, optional `ha_person` (z. B. `person.papa`).

## Felddefinitionen (`fields`)

| Schlüssel | Pflicht | Bedeutung |
|---|---|---|
| `id`, `name` | ja | |
| `type` | ja | `text`, `multiline`, `number`, `date`, `bool`, `choice`, `link` |
| `group` | nein | Gruppenüberschrift in der Anzeige |
| `scope` | nein | `{ "type": "global" }` (Standard) oder `{ "type": "local", "node": "<Kennung>" }` – gilt für diesen Knoten **und alles darunter** |
| `kinds`, `classes` | nein | Einschränkung auf Arten bzw. Klassen |
| `unit` | nein | Einheit bei Zahlen |
| `options` | bei `choice` | Auswahlliste |
| `remind_days_before` | nein | Nur bei `date`: so viele Tage vorher gilt der Eintrag als „läuft bald ab“ |
| `builtin` | nein | mitgeliefert (nicht löschbar, nur ausblendbar) |
| `hidden` | nein | ausgeblendet (keine Anzeige, keine Erinnerung) |

Mitgelieferte Felder: `expiry` (Ablaufdatum, 30 Tage), `purchase_date`, `price` (€), `vendor`, `warranty_until` (30 Tage), `manufacturer`, `model`, `serial_number`, `manual_url`.
Die Werte stehen im Knoten unter `fields` (`"fields": { "expiry": "2026-12-01" }`); ihr Typ muss zur Definition passen.

## Knoten (`nodes`)

Pflicht sind nur `name` und `kind`.

| Schlüssel | Typ | Bedeutung |
|---|---|---|
| `name` | Text | |
| `kind` | Text | Kennung einer Art |
| `parent` | Text | Elternknoten; fehlt = oberste Ebene |
| `number` | Ganzzahl ≥ 1 | im ganzen Inventar eindeutig; bleibt beim Verschieben und Umbenennen |
| `aliases` | Liste | weitere Namen, werden durchsucht |
| `tags` | Liste | Schlagwörter |
| `note` | Text | mehrzeilig |
| `owner` | Text | Kennung einer Person; **vererbt sich nach unten**, bis weiter unten etwas anderes steht |
| `quantity`, `unit`, `min_quantity` | Zahl, Text, Zahl | Menge, Einheit, Mindestbestand (darunter: „Nachkaufen“) |
| `condition` | Text | `ok` (Standard, nicht geschrieben), `missing`, `defective`, `to_sell`, `to_give_away`, `disposed` (archiviert, samt Inhalt) |
| `checkout` | Objekt | Entnahme: `type` (`lent` ausgeliehen / `out` entnommen), `to` (an wen / wo), `since`, optional `until`, `note`, `no_reminder` (`true` = Langzeit-Ausleihe, keine Erinnerung „lange nicht zurück“) |
| `fields` | Objekt | Feldkennung → Wert |
| `maintenance` | Liste | Aufgaben: `id`, `title`, optional `interval` (`{ "value": 6, "unit": "months" }`, Einheiten `days/weeks/months/years`), `next_due`, `note`, `log` (Liste `{ "date", "note" }`) |
| `attachments` | Liste | **reserviert** (Dokumente und Fotos, Pflichtenheft 14); ohne Funktion |
| `created`, `modified` | Zeitstempel | automatisch |
| `verified` | Zeitstempel | zuletzt bei der Inventur bestätigt |
| `trashed` | Objekt | nur am **obersten** gelöschten Knoten direkt im Papierkorb: `at` (Zeitpunkt), `from` (alter Elternknoten), `by` (Benutzer) |

### Systemknoten

`unsortiert` und `papierkorb` müssen existieren und auf oberster Ebene liegen. Gelöschte Knoten liegen **samt Inhalt** unter `papierkorb`; nach `trash_days` Tagen werden sie endgültig entfernt. Inhalte des Papierkorbs und archivierte Knoten
erscheinen weder in Suche noch in Zählungen.

## Vorlagen (`templates`)

`id`, `name`, `kind`; optional `tags`, `owner`, `fields`, `children` (Liste von `{ "name", "kind", "tags", "quantity", "unit", "fields", "children" }`, beliebig tief).

## Listen (`lists`)

`id`, `name`, `entries`: je Eintrag `id` und entweder `node` (Verweis auf einen Knoten) oder `text` (freier Text), optional `quantity`, `note`, `checked`.

## Regeln, die immer gelten (Pflichtenheft 5.14)

1. Kein Knoten ist sein eigener Vorfahre (auch nicht über mehrere Stufen).
2. Jedes `parent` zeigt auf einen vorhandenen Knoten.
3. `number` ist eindeutig.
4. Jede verwiesene Art, Person und Felddefinition existiert. Eine Art lässt sich nur löschen, wenn sie unbenutzt ist oder ein Ersatz angegeben wird; beim Löschen einer Person entfällt die Zuordnung.
5. Beim endgültigen Löschen eines Knotens verschwinden Verweise darauf aus Listen und lokalen Felddefinitionen (samt deren Werten).
6. Die zwei Systemknoten bleiben erhalten.

Zusätzlich geprüft: Feldwerte passen zum Typ, lokale Felder nennen einen vorhandenen Knoten, Auswahlfelder haben Optionen, Erinnerungen gibt es nur bei Datumsfeldern, Wartungs- und Listeneintragskennungen sind innerhalb eines Knotens bzw. einer Liste eindeutig.

Beim Laden normalisiert der Kern, ohne Daten zu verlieren: Ein `item` mit Unterpunkten wird zur Gruppe; ein Knoten direkt im Papierkorb ohne `trashed` bekommt das Löschdatum „jetzt“.

## Versionierung und Migration

`schema_version` und eine Kette von Funktionen „Version *n* → *n + 1*“ (`core/migrations.py`). Vor jeder Migration wird die Datei nach `sicherungen/inventar-…-vor-migration.json` kopiert. Aktuell gibt es nur Version 1.

## Weitere Dateien in `/config/ordnungstracker/`

| Datei | Inhalt |
|---|---|
| `inventar.json` | siehe oben |
| `benutzer.json` | je HA-Benutzer: `favorites`, `recent` (zuletzt angesehen, höchstens 20), `recent_targets` (zuletzt verwendete Verschiebe-Ziele, höchstens 8), `view` (Ansichtsvorlieben), `stocktake` (begonnene Inventur) |
| `verlauf.jsonl` | eine JSON-Zeile je Änderung: `time`, `user`, `action`, `node`, `name`, `details` (bei Verschieben alter/neuer Pfad, bei Bearbeiten alte und neue Werte); rotiert ab 2 MB (`verlauf.1.jsonl` …) |
| `zustand.json` | interner Merker, welche Fälligkeiten schon gemeldet wurden |
| `sicherungen/` | `inventar-JJJJMMTT-hhmmss[-grund].json`; die neuesten 20 und je eine pro Tag der letzten 30 Tage |
| `anhaenge/` | reserviert |
| `inventar.konflikt-….json` | entsteht, wenn die Datei von Hand geändert wurde, während ungespeicherte eigene Änderungen vorlagen |
