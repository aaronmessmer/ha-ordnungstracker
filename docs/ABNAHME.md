# Abnahme gegen das Pflichtenheft (Phase 6)

Jede Funktion aus Abschnitt 8 und 9 (sowie 10 bis 12) des [Pflichtenhefts](PFLICHTENHEFT.md), mit Umsetzung und Nachweis.
Stand: Version 1.0.0.

**Zeichen:** ✔ umgesetzt **und** automatisch geprüft · ◐ umgesetzt, automatisch geprüft, aber das Verhalten im *echten* Home Assistant oder in der Companion-App muss der Auftraggeber bestätigen (Punkt steht in [`PRUEFLISTEN.md`](PRUEFLISTEN.md)) · △ bewusst anders oder enger umgesetzt (Begründung in [`ENTSCHEIDUNGEN.md`](ENTSCHEIDUNGEN.md)).

Kürzel der Nachweise: **K** = `tests/core/`, **H** = `tests/ha/`, **O** = `frontend/test/`, **B** = in einer echten Home-Assistant-Instanz mit Chromium durchgespielt (nicht Teil der CI, siehe D11). Eine Home-Assistant-Instanz des Auftraggebers mit Companion-App stand nicht zur Verfügung; das ist der Grund für alle ◐.

## 8 Funktionen

| § | Funktion | Umsetzung | Nachweis |
|---|---|---|---|
| 8.1 | Seite je Knoten: Pfad antippbar, Angaben, Inhalt gruppiert und sortiert, Anzahl direkter/gesamter Inhalte | `ot-node-page`, `ot-path`, `ot-node-list`; Sortierung `Tree.sorted_children` | K `test_tree`, B |
| 8.2 | Neu aus der Elternseite, nur Name Pflicht, Art wird vorgeschlagen; Bearbeiten in einem Dialog mit eingeklappten Angaben; Anlegen aus Vorlage | `ot-node-form`, `ot-template-create`, `Tree.suggest_kinds` | K `test_tree`, `test_inventory_features`, B |
| 8.3 | Schnellerfassung: Menge (`3x`, `2 Rollen`), Einrückung, Schalter „Kommas trennen“, Vorschau | `core/quickadd.py`, `ot-quickadd` (Vorschau vom Server) | K `test_quickadd_export`, O `quickadd`, B |
| 8.4 | Verschieben über Suche, Stöbern, Nummer; Mehrfachauswahl; Inhalt wandert mit; zuletzt genutzte Ziele | `ot-move`, `Inventory.move_nodes`, `benutzer.json` | K `test_inventory_nodes`, H `test_websocket`, B |
| 8.5 | Löschen mit Rückfrage (Anzahl betroffener Unterpunkte), samt Inhalt in den Papierkorb oder Inhalt eine Ebene hoch | `ot-node-page` (Dialog), `Inventory.delete_node` | K `test_inventory_nodes`, B |
| 8.6 | Ausleihen, Entnehmen, Zurücklegen (ein Tipp), Übersicht „Entnommen“ nach Dauer, Entnahme eines Behälters betrifft den Inhalt sichtbar | `ot-checkout`, `ot-out-page`, `Tree.effective_checkout` | K `test_inventory_features`, `test_reminders`, O `phase4`, B |
| 8.7 | Plus/Minus in der Liste, „Nachkaufen“, wahlweise selbsttätig auf die To-do-Liste (ohne Doppelte) | `ot-stepper`, `ot-due-page only=below_min`, `todo_transfer.py`, Option `todo_auto` | H `test_services`, O `phase4`, ◐ (To-do-Liste in echtem HA) |
| 8.8 | „Fällig“ mit fünf Rubriken (läuft ab, Rückgabe überfällig inkl. einstellbarer Frist, Mindestbestand, Wartung, vermisst) | `core/reminders.py`, `ot-due-page` | K `test_reminders` (Datumsgrenzen), O `phase4` |
| 8.9 | Inventur: Abhakliste, da/fehlt/woanders, Ergänzen, Abschluss setzt Prüfdatum bzw. „vermisst“, Zwischenstand bleibt | `ot-stocktake-page`, `Inventory.apply_stocktake`, `stocktake_*` | K `test_inventory_features`, H `test_websocket`, O `phase5`, B |
| 8.10 | Export `inventar.json`; Import ersetzt nach Prüfung mit Rückfrage und vorheriger Sicherung; Markdown-Export (ganz oder Teilbaum); vier Druckansichten über geschützte, signierte Adresse | `ot-settings-page`, Menü „Als Markdown-Liste exportieren“, `views.py`, `ot-lists-page`, `lib/print.ts` | K `test_store`, `test_quickadd_export`, H `test_views` (401 ohne Anmeldung/Signatur, Ablauf), B; ◐ Download und Druck in der Companion-App |
| 8.11 | Übersicht: Suchfeld, Zahlen, Kacheln, Favoriten, zuletzt angesehen, leere Behälter, nächste freie Nummer, Gesamtwert und Wert je Raum | `ot-overview`, `core/overview.py` | K `test_inventory_features`, H `test_websocket`, B |
| 8.12 | Favoriten und Verlauf je HA-Benutzer | `core/userdata.py`, `benutzer.json` | K `test_files`, H `test_websocket` |
| 8.13 | Einstellungen: Arten, Personen, Felder, Synonyme, Vorlagen, To-do-Liste (Anzeige; Wahl in den Optionen), Schwellen, Papierkorb, Protokoll, Export/Import, Sicherungen, Berechtigungen | `ot-settings-*`, `permissions.py` | H `test_permissions`, O `phase4/5`, B; △ To-do-Liste wählt man in den Optionen der Integration (E2) |
| 8.14 | Beispieldaten (67 Knoten) nur in ein leeres Inventar, mit einem Tipp wieder entfernbar | `core/sample.py` | K `test_sample_schema`, B |

## 9 Schnittstellen zu Home Assistant

| § | Funktion | Umsetzung | Nachweis |
|---|---|---|---|
| 9.1 | Config Flow, genau eine Instanz, keine Pflichtangaben; Optionen: To-do-Liste, selbsttätige Übertragung, Seitenleiste, Berechtigungen; Schwellen in der Oberfläche | `config_flow.py` | H `test_config_flow`, `test_setup` |
| 9.2 | Seitenleiste „Ordnung“; Karte `custom:ordnungstracker-card` (Suche / Kacheln / Eintrag) mit grafischem Editor; Bündel wird selbst ausgeliefert und angemeldet | `frontend_registration.py`, `ot-card`, `ot-card-editor` | H `test_views`, B, ◐ (Seitenleiste/Karte im echten Dashboard) |
| 9.3 | Ausschließlich WebSocket-Befehle, Abo für alle Geräte, Benutzer im Protokoll, Beschreibung in `API.md` | `websocket_api.py` | H `test_websocket`, `test_frontend_contract` (Oberfläche nutzt nur vorhandene Befehle/Felder) |
| 9.4 | Dienste mit Antwortdaten: suchen, lesen, anlegen, ändern, verschieben, löschen, entnehmen, zurücklegen, Menge, To-do, neu laden, Sicherung, exportieren (+ weitere); deutsche und englische Beschreibungen | `services.py`, `services.yaml` | H `test_services`, `test_metadata` (YAML, Übersetzungen und Registrierung stimmen überein) |
| 9.5 | Sensoren (Dinge, Behälter, leere Behälter, Unsortiert, Entnommen/überfällig, Mindestbestand, läuft ab, Wartung, vermisst) mit höchstens 10 Einträgen; Kalender mit Ablauf, Garantie, Rückgabe, Wartung | `sensor.py`, `calendar.py` | H `test_entities` (inkl. Attributgröße weit unter 16 KB) |
| 9.6 | Ereignis `ordnungstracker_due` einmalig, Merker überlebt Neustart; zwei Beispiel-Automationen im README | `runtime.py` | H `test_services`, `test_setup` |
| 9.7 | Assist (Deutsch, nur lesend): „Wo ist …?“, „Was ist in Kiste …/in …?“; Antworten aus derselben Suche | `voice.py`, `core/voice.py`, `sentences/de.yaml` | K `test_voice`, H `test_voice` (echte Sätze durch den Standard-Agenten), ◐ gesprochene Zahlen |
| 9.8 | Diagnose ohne Namen und Inhalte | `diagnostics.py` | H `test_setup` |

## 10 Oberfläche

| Grundsatz | Stand | Nachweis |
|---|---|---|
| Zuerst das Handy, Daumenbedienung, Breite am PC nutzen (Baum links) | Zielgrößen ≥ 40 px, Einspalten-Layout, Baum ab breitem Fenster | B (390 px und Desktop), ◐ echtes Gerät |
| Anlegen leicht: wenige Pflichtangaben, Vorschläge | nur Name Pflicht; Art und nächste Nummer vorgeschlagen | B |
| Nichts verschwindet überraschend | Seite bleibt, Meldungen oben, Dialoge schließen zum selben Ort | B |
| Lange drücken = Abkürzung, ohne Rückfrage; Rückfragen nur bei Verlust | Mehrfachauswahl (450 ms), Rückfragen nur beim Löschen/Import/Wiederherstellen/Verwerfen | O, B |
| Sieht aus wie Home Assistant | nur HA-Designvariablen; hell/dunkel geprüft | B |
| Pfad immer sichtbar und antippbar | `ot-path` | B |
| Leere Zustände erklären sich | je Klasse eigener Text | B |
| Keine internen `ha-*`-Bausteine außer `ha-icon`; eigene Elemente | eingehalten (D2) | O `locales` (Test sucht in allen Quelldateien) |
| Lange Listen flüssig, Suche mit Verzögerung ohne Flackern, Zurück-Taste, Sprachdateien, Tastatur/Screenreader | Stapelweise Anzeige, 250 ms Entprellung, `Latest`, History-API, `de.ts`/`en.ts` (Test auf gleiche Schlüssel), Fokusführung in Dialogen | O `state`, `router`, `locales`, B |

## 11 Qualität und 12 Repository

| Anforderung | Stand |
|---|---|
| ruff, mypy (Kern streng), Typangaben | CI-Job „Lint“; mypy ohne Befunde |
| Kerntests ≥ 90 % | 97,5 % (CI erzwingt 90 %); Regeln aus 5.14, Suche je Regel, Datumsgrenzen, kaputte Dateien, Migration, Konflikt, atomares Schreiben (`test_store`: Absturz beim Schreiben lässt die alte Datei unversehrt) |
| Tests HA-Schicht gegen aktuelle **und** älteste unterstützte Version | 2026.10.0 und 2026.3.1, alle grün |
| Tests Oberfläche (Parser, Zustand, Navigation) | `frontend/test/`, 58 Tests |
| CI: Lint, Typen, Tests, Bau samt Aktualitätsprüfung des Bündels, hassfest, HACS | `.github/workflows/ci.yml`, `validate.yml` |
| Fehlermeldungen deutsch, konkret, mit Handlungshinweis | `InventoryError`-Klassen mit `code`; Reparaturhinweise; Oberfläche zeigt sie unverändert |
| Release von Hand auslösbar | `.github/workflows/release.yml` |
| Dateien und Ordner nach 12 | vorhanden; △ die Absichten für Assist liegen in `voice.py` statt `intent.py`, die Sätze in `sentences/` statt `custom_sentences/` (F2) |
| README (Installation, Einrichtung, erste Schritte, Sicherung, Handbearbeitung, Automationen), CHANGELOG, LICENSE (MIT), `hacs.json`, `CLAUDE.md` | vorhanden und aktuell |

## Zurückgestellt (14) – nur vorbereitet

Anhänge (`attachments`, Ordner `anhaenge/`), schreibende Sprachbefehle (Absichten sind ergänzbar), Etiketten/QR/NFC (stabile Adresse `/ordnungstracker/node/<Kennung>` und `/nr/<Nummer>`), allgemeines Rückgängig (abgegrenzte Operationen mit Protokoll). Siehe [`ROADMAP.md`](ROADMAP.md).

## Bei der Abnahme gefundene und behobene Abweichungen

- Der Markdown-Export eines **Teilbaums** (8.10) war in der Schnittstelle, aber nicht in der Oberfläche; er steht jetzt im Menü ⋮ eines Behälters oder Ortes.
- Die Karte benutzte `ha-card`; das Pflichtenheft erlaubt außer `ha-icon` keine Home-Assistant-Elemente. Sie nutzt jetzt ein eigenes Element mit den Design-Variablen von `ha-card`, und ein Test verhindert Rückfälle.
- Das README beschrieb noch den Zielzustand und „bis die Oberfläche da ist“; es ist auf den tatsächlichen Stand gebracht.

## Nicht abnehmbar ohne echtes Home Assistant

Alle ◐-Punkte. Sie sind in [`PRUEFLISTEN.md`](PRUEFLISTEN.md) nach Phasen aufgeführt; die wichtigsten drei: Druck und Download in der Companion-App, Sprachabfrage mit gesprochener Zahl, selbsttätige To-do-Übertragung.
