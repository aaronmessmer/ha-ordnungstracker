# Schnittstellen

Stand: Phase 5 (Version 0.6.0; seit 0.3.0 nur um die genannten Felder von `due` und `status` und den Fehlercode `unauthorized` erweitert). Die Oberfläche (Phase 3), Dienste, Automationen und Skripte nutzen dieselbe Logik des Kerns und liefern dieselben Ergebnisse.

## Konventionen

* WebSocket-Befehle heißen `ordnungstracker/<aktion>`. Alle schreibenden Befehle laufen über `OrdnungsTrackerRuntime.async_mutate` und vermerken den aufrufenden Home-Assistant-Benutzer im Änderungsprotokoll.
* **Feldnamen:** `id` und `type` sind in WebSocket-Nachrichten von Home Assistant belegt (Nachrichtenkennung, Befehlsname). Deshalb heißen die Felder `node_id`, `kind_id`, `person_id`, `field_id`, `template_id`, `checkout_type`, `field_type`.
* **Fehler:** Der Kern wirft `InventoryError` (Unterklassen: siehe unten). Die Antwort enthält `error.code` (stabil, englisch) und `error.message` (deutsch, mit Handlungshinweis). Falsch geformte Aufrufe meldet Home Assistant selbst als `invalid_format`.
* Ist die Integration nicht geladen (z. B. weil `inventar.json` ungültig ist), antworten alle Befehle mit `not_loaded`; Dienste mit einem Dienstfehler. Der Grund steht unter *Einstellungen → Reparaturen*.
* **Abo:** `ordnungstracker/subscribe` liefert danach bei jeder Änderung – auch von anderen Geräten, Diensten oder durch Bearbeiten der Datei von Hand – ein Ereignis `{"revision", "actions", "nodes", "reload"}`. `nodes` nennt die betroffenen Einträge
  (`null` bei `reload: true`, dann alles neu laden).
* **Einträge ansprechen** (nur Dienste): mit Kennung **oder Nummer** (`14`, `#14`).

## WebSocket-Befehle

| Befehl | Felder (`?` = freiwillig) |
|---|---|
| `ordnungstracker/status` | – |
| `ordnungstracker/overview` | – |
| `ordnungstracker/node` | `node_id`, `include_archived`?, `track`? |
| `ordnungstracker/by_number` | `number` |
| `ordnungstracker/search` | `query`?, `filters`?, `limit`? |
| `ordnungstracker/due` | – |
| `ordnungstracker/checkouts` | – |
| `ordnungstracker/catalog` | – |
| `ordnungstracker/trash` | – |
| `ordnungstracker/journal` | `node_id`?, `limit`?, `offset`? |
| `ordnungstracker/calendar` | `start`, `end` |
| `ordnungstracker/list` | `list_id` |
| `ordnungstracker/backups` | – |
| `ordnungstracker/user` | – |
| `ordnungstracker/suggest` | `parent`? |
| `ordnungstracker/export` | `format`, `node_id`? |
| `ordnungstracker/quickadd_preview` | `text`, `split_commas`? |
| `ordnungstracker/stocktake_get` | `node_id` |
| `ordnungstracker/print_url` | `view`, `node`?, `list`? |
| `ordnungstracker/import` | `text` |
| `ordnungstracker/backup_create` | – |
| `ordnungstracker/backup_restore` | `name` |
| `ordnungstracker/reload` | – |
| `ordnungstracker/favorite` | `node_id`, `value` |
| `ordnungstracker/recent_add` | `node_id` |
| `ordnungstracker/target_add` | `node_id` |
| `ordnungstracker/view_set` | `key`, `value` |
| `ordnungstracker/stocktake_set` | `node_id`, `state`? |
| `ordnungstracker/todo_transfer` | `entity_id`? |
| **Ändernde Befehle** (laufen über `async_mutate`, vermerken den Benutzer im Protokoll) | |
| `ordnungstracker/create` | `name`, `kind`?, `parent`?, `number`?, `aliases`?, `tags`?, `note`?, `owner`?, `quantity`?, `unit`?, `min_quantity`?, `fields`? |
| `ordnungstracker/update` | `node_id`, `changes` |
| `ordnungstracker/move` | `ids`, `parent`? |
| `ordnungstracker/delete` | `node_id`, `mode`? |
| `ordnungstracker/restore` | `node_id` |
| `ordnungstracker/purge` | `node_id` |
| `ordnungstracker/trash_empty` | – |
| `ordnungstracker/checkout` | `node_id`, `checkout_type`, `to`, `since`?, `until`?, `note`?, `no_reminder`? |
| `ordnungstracker/return` | `node_id` |
| `ordnungstracker/checkout_reminder` | `node_id`, `enabled` |
| `ordnungstracker/quantity` | `node_id`, `delta`?, `quantity`? |
| `ordnungstracker/field_value` | `node_id`, `field`, `value`? |
| `ordnungstracker/maintenance_add` | `node_id`, `title`, `interval`?, `next_due`?, `note`? |
| `ordnungstracker/maintenance_update` | `node_id`, `task`, `changes` |
| `ordnungstracker/maintenance_remove` | `node_id`, `task` |
| `ordnungstracker/maintenance_done` | `node_id`, `task`, `date`?, `note`? |
| `ordnungstracker/stocktake_apply` | `results` |
| `ordnungstracker/verify` | `ids` |
| `ordnungstracker/kind_add` | `name`, `class`, `icon`?, `numbered`? |
| `ordnungstracker/kind_update` | `kind_id`, `changes` |
| `ordnungstracker/kind_delete` | `kind_id`, `replacement`? |
| `ordnungstracker/person_add` | `name`, `ha_person`? |
| `ordnungstracker/person_update` | `person_id`, `changes` |
| `ordnungstracker/person_delete` | `person_id` |
| `ordnungstracker/field_def_add` | `name`, `field_type`, `group`?, `scope_node`?, `kinds`?, `classes`?, `unit`?, `options`?, `remind_days_before`? |
| `ordnungstracker/field_def_update` | `field_id`, `changes` |
| `ordnungstracker/field_def_delete` | `field_id` |
| `ordnungstracker/template_add` | `name`, `kind`, `tags`?, `owner`?, `fields`?, `children`? |
| `ordnungstracker/template_delete` | `template_id` |
| `ordnungstracker/create_from_template` | `template`, `parent`?, `name`?, `number`? |
| `ordnungstracker/synonyms` | `groups` |
| `ordnungstracker/settings` | `settings` |
| `ordnungstracker/quickadd_apply` | `parent`, `text`, `split_commas`? |
| `ordnungstracker/list_create` | `name` |
| `ordnungstracker/list_rename` | `list_id`, `name` |
| `ordnungstracker/list_delete` | `list_id` |
| `ordnungstracker/list_entry_add` | `list_id`, `node`?, `text`?, `quantity`?, `note`? |
| `ordnungstracker/list_entry_update` | `list_id`, `entry_id`, `changes` |
| `ordnungstracker/list_entry_remove` | `list_id`, `entry_id` |
| `ordnungstracker/list_reset` | `list_id` |
| `ordnungstracker/sample_load` | – |
| `ordnungstracker/sample_remove` | – |
| `ordnungstracker/subscribe` | – |

Antworten der wichtigsten Befehle (Auswahl):

* `node` → Knotenseite: `path`, Angaben, `effective_owner` (mit `inherited`), `checkout`, `effective_checkout` (auch die eines Behälters, in dem der Eintrag liegt), `fields` (mit `assigned: false` für „nicht mehr zugeordnet“), `maintenance`, `contents` (sortiert, mit `children`/`descendants`), `suggested_kinds`. Ohne `node_id`: oberste Ebene.
* `search` → `{"total", "number_hit", "hits": [{id, name, path, owner, hints, matched_in, …}]}`. `filters`: `kinds`, `classes`, `within`, `owner`, `tag`, `condition`, `checked_out`, `has_number`, `empty`, `stale`, `include_archived`.
* `overview` → Kennzahlen, `favorites`, `recent` des aufrufenden Benutzers. `due` → die fünf Rubriken (bei „unter Mindestbestand“ zusätzlich `quantity`, `min_quantity`, `unit`, damit die Ansicht „Nachkaufen“ die Menge ändern kann). `status` nennt auch `todo_entity`, `todo_auto` und `can_admin` (darf der Benutzer löschen und Einstellungen ändern?). Ist die Option „nur Administratoren“ an, antworten `delete`, `purge`, `trash_empty`, `import`, `backup_restore`, `sample_load/remove`, `kind_*`, `person_*`, `field_def_*`, `template_*`, `synonyms`, `settings` und `list_delete` Nicht-Administratoren mit dem Fehler `unauthorized`; die Dienste `delete_node`, `load_sample`, `remove_sample` mit einem Dienstfehler. `checkouts` → alles, was nicht an seinem Platz ist, längste Dauer zuerst.
* `print_url` → `{"url", "expires_in"}`: signierte Adresse (5 Minuten) für `GET /api/ordnungstracker/print/<ansicht>` mit `tree`, `containers`, `sheet` (`node`), `packlist` (`list`), `markdown`, `json`. Ohne Anmeldung oder Signatur antwortet die Adresse mit 401.
* `import` ersetzt das Inventar nach Prüfung (vorher Sicherung `…-vor-import.json`); bei ungültigem Text `load_failed` und **keine** Änderung. `backup_restore` ebenso (`…-vor-wiederherstellung.json`).
* `reload` liest `inventar.json` neu: `unchanged`, `reloaded`, `conflict` (eigene ungespeicherte Änderungen liegen dann in `inventar.konflikt-….json`) oder `invalid`.

## Dienste

Alle Dienste liegen in der Domain `ordnungstracker`. Lesende Dienste liefern Antwortdaten (`return_response`), ändernde wahlweise. Einen Eintrag nennt man mit Kennung oder Nummer.

| Dienst | Wirkung | Antwort |
|---|---|---|
| `search` | sucht (`query`, `kind`, `within`, `owner`, `tag`, `condition`, `checked_out`, `include_archived`, `limit`) | `total`, `results` mit Pfad, Besitzer, Hinweisen |
| `get_node` | liest einen Eintrag (`node`) samt Pfad und Inhalt | wie WebSocket `node` |
| `create_node` | legt an (`name`; `parent`, `kind`, `number` oder `auto`, `tags`, `aliases`, `note`, `quantity`, `unit`, `min_quantity`, `owner`) | `id`, `number` |
| `update_node` | ändert genannte Angaben (`node`, …, `condition`) | `id` |
| `move_node` | verschiebt `nodes` (Liste) nach `target` | `moved` |
| `delete_node` | Papierkorb (`mode`: `trash` oder `lift`) | `id`, `descendants` |
| `check_out` | entnimmt (`type`: `lent`/`out`, `to`, `since`, `until`, `note`, `no_reminder`) | `id` |
| `return_node` | legt zurück | `id` |
| `adjust_quantity` | `delta` oder `quantity` | `id`, `quantity` |
| `transfer_to_todo` | trägt alles unter dem Mindestbestand in eine To-do-Liste ein (ohne Doppelte; `todo_entity` oder die Liste aus den Optionen) | `entity_id`, `added`, `skipped` |
| `load_sample` | lädt den Beispielhaushalt (nur in ein leeres Inventar) | `created` |
| `remove_sample` | entfernt die Beispieldaten wieder (eigene Einträge darin → „Unsortiert“) | `removed` |
| `reload` | liest `inventar.json` neu | `status` |
| `create_backup` | Sicherung jetzt | `name` |
| `export` | `format` `json` oder `markdown`, optional `node` | `filename`, `text` |

Beispiel (Entwicklerwerkzeuge → Aktionen):

```yaml
action: ordnungstracker.search
data:
  query: schrauben keller
response_variable: treffer
```

## Entitäten und Ereignis

* Sensoren (Zustand = Anzahl): *Dinge gesamt*, *Behälter gesamt*, *Leere Behälter*, *Unsortiert*, *Entnommen* (Attribut `overdue`), *Unter Mindestbestand*, *Läuft bald ab*, *Wartung fällig*, *Vermisst*. Attribute: `total` und `items` (höchstens 10 mit `name`, `path`, `detail`, `due`).
* Kalender *Termine*: Ablauf, Garantieende, Rückgabe, Wartung.
* Ereignis `ordnungstracker_due` (einmalig, wenn ein Eintrag neu fällig wird): `category` (`expiring`, `checkout_overdue`, `below_min`, `maintenance_due`, `missing`), `node_id`, `name`, `path`, `detail`, `due`, `days`, `overdue`, `key`.

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
| `not_loaded` | – | Integration nicht geladen (nur WebSocket) |

## Kern-Schnittstelle (Python)

```python
store = InventoryStore(Path(hass.config.path("ordnungstracker")))
inventory = await store.async_load()
index = SearchIndex(inventory)

result = index.search("schrauben keller", SearchFilter(classes=frozenset({KindClass.ITEM})), limit=50)
node = await store.async_mutate(lambda inv: inv.create_node("Hammer", "ding", parent_id, number="auto"), user)
await store.async_mutate(lambda inv: inv.move_nodes([a, b], ziel_id), user)
await store.async_mutate(lambda inv: inv.delete_node(node_id, "trash"), user)   # oder "lift"
due = collect_due(inventory)            # Fälligkeiten in fünf Rubriken
text = render_markdown(inventory)       # lesbarer Export; render_*_html für den Druck
```
