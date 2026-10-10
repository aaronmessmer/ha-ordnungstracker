# Entscheidungen

Dieses Dokument hält fest, **was bei der Entwicklung nachgeschlagen** und **was entschieden** wurde (Pflichtenheft
Abschnitte 1, 15). Jede Entscheidung hat einen Satz Begründung. Neue Einträge werden unten ergänzt.

Stand: Phase 0 bis Phase 2.

## A. Ergebnisse der Prüfung aus Abschnitt 15

> **Hinweis zur Quelle.** In der Entwicklungsumgebung war `developers.home-assistant.io` gesperrt (HTTP 403). Gelesen
> wurden stattdessen die **Markdown-Quellen der Entwicklerdokumentation** (Repository `home-assistant/developers.home-assistant`,
> Zweig `master`, abgerufen am 2026-10-09) und – wo die Dokumentation offen lässt – der **Quellcode von Home Assistant 2026.10.0**
> (aktuelle stabile Version) sowie **2026.3.1** (älteste unterstützte Version). Wo etwas nur aus dem Quellcode folgt, steht das dabei.
> Nichts davon konnte in einem echten Home Assistant ausprobiert werden; was nur dort prüfbar ist, steht in `docs/PRUEFLISTEN.md`.

**Aktueller Stand der Plattform:** Home Assistant 2026.10.0 verlangt **Python ≥ 3.14.2**. Die Integration wird mit Python 3.14 entwickelt
und gegen 2026.10.0 **und** 2026.3.1 getestet.

### A1. Eigenes Panel in der Seitenleiste (Punkt 1)
- Die Dokumentation („Custom panels“) beschreibt `panel_custom` per YAML. Aus einer Integration heraus gibt es dasselbe als Python-Aufruf:
  `homeassistant.components.panel_custom.async_register_panel(hass, frontend_url_path, webcomponent_name, sidebar_title, sidebar_icon, module_url, require_admin, config, …)`
  (vorhanden in 2026.3.1 und 2026.10.0; 2026.10 hat zusätzlich `handle_safe_area`).
- Das Panel ist ein eigenes Web-Element (Custom Element) und bekommt `hass`, `narrow`, `route`, `panel` gesetzt.
- **Entscheidung (Phase 2):** `panel_custom.async_register_panel` aufrufen; `dependencies: ["frontend", "panel_custom", "http"]`. Der Seitenleisten-Eintrag
  lässt sich in den Optionen abschalten (dann `async_remove_panel`). `require_admin` bleibt aus; Administratorrechte werden pro Aktion geprüft.

### A2. Statische Dateien und Karten-Ressource (Punkt 2)
- Die Dokumentation („Registering resources“) kennt nur den Ordner `www` (erreichbar ohne Anmeldung unter `/local`) und die manuelle Ressourcen-Eintragung.
  Für Integrationen gibt es im Quellcode: `hass.http.async_register_static_paths([StaticPathConfig(url, pfad, cache_headers)])` und
  `homeassistant.components.frontend.add_extra_js_url(hass, url)` (beides in 2026.3.1 und 2026.10.0 vorhanden). `add_extra_js_url` lädt das Modul in jeder
  Frontend-Sitzung, sodass die Karte ohne Eintrag unter „Ressourcen“ verfügbar ist.
- Statische Pfade sind **ohne Anmeldung** abrufbar. Das ist hier unkritisch: Die Datei enthält nur Programmcode, keine Daten; alle Daten laufen
  über die angemeldete WebSocket-Verbindung.
- **Entscheidung (Phase 2/3):** Bündel unter `/ordnungstracker_static/ordnungstracker.js?v=<Version>` ausliefern (Version in der Adresse gegen alte Zwischenspeicher) und per
  `add_extra_js_url` anmelden. Der Nutzer trägt nichts von Hand ein.

### A3. Zeitlich begrenzte, signierte Adressen (Punkt 3)
- `homeassistant.components.http.auth.async_sign_path(hass, path, expiration, …)` liefert eine Adresse mit Signatur (`authSig`), die ohne Kopfzeile funktioniert; im
  Frontend gibt es dafür den WebSocket-Befehl `auth/sign_path` (beides in beiden Versionen vorhanden). Die Signatur ist an das Zugriffstoken der Sitzung gebunden.
- **Entscheidung (Phase 2/5):** Export- und Druckseiten werden von einer eigenen, angemeldeten `HomeAssistantView` ausgeliefert (`requires_auth = True`); die Oberfläche holt
  sich über `auth/sign_path` eine Adresse mit kurzer Gültigkeit (Vorschlag: 5 Minuten) und öffnet sie.
- **Offen, nur auf dem Gerät prüfbar:** Verhalten in der Companion-App (öffnet sich ein externer Browser? Funktioniert Drucken aus der App?). Steht in der Prüfliste für Phase 2.

### A4. Herunterladen und Hochladen aus der Oberfläche (Punkt 4)
- Die Dokumentation sagt dazu nichts Zuverlässiges. `inventar.json` ist klein (5.000 Knoten ≈ 0,9 MB), also passt der Inhalt in eine WebSocket-Nachricht.
- **Entscheidung (Phase 3):** Hochladen: Datei im Browser lesen und den Text per WebSocket-Befehl senden. Herunterladen: Text per WebSocket-Befehl holen und im Browser als Datei
  speichern; zusätzlich „In die Zwischenablage“ und die Teilen-Funktion des Betriebssystems als Rückfall, falls die Companion-App Downloads blockiert. Die Größenbeschränkung für
  WebSocket-Nachrichten wird in Phase 2 am Quellcode geprüft.

### A5. Eigene Absichten (Assist) (Punkt 5)
- Eine Integration kann **keine** Beispielsätze über das Manifest mitbringen. Home Assistant liest benutzerdefinierte Sätze aus
  `<config>/custom_sentences/<Sprache>/*.yaml` (Quellcode `conversation/default_agent.py`, `_load_intents`; die zugehörige Seite der Entwicklerdokumentation war als Markdown nicht auffindbar).
  Absichten (Intents) selbst registriert die Integration mit `homeassistant.helpers.intent.async_register`.
- **Entscheidung (Phase 5):** Die Integration legt die Satzdatei beim Einrichten **selbst** unter `<config>/custom_sentences/de/ordnungstracker.yaml` an (und aktualisiert sie nur, wenn sie
  unverändert von uns stammt – erkennbar an einer Kennzeile). Der Nutzer muss nichts kopieren. Die Quelle liegt in der Integration unter `custom_components/ordnungstracker/sentences/de.yaml` (HACS installiert nur diesen Ordner; Umsetzung siehe F2). Das kommt ins README.
  Der Weg „von Hand kopieren“ bleibt als Rückfall beschrieben.

### A6. Config Flow, Laufzeitdaten, Reparaturen, Diagnose (Punkt 6)
- **Eine Instanz:** Manifest-Schlüssel `"single_config_entry": true` (Dokumentation „Integration manifest“); Home Assistant bricht weitere Einrichtungen mit
  `single_instance_allowed` ab. Umgesetzt und getestet.
- **Laufzeitdaten:** `entry.runtime_data` mit typisiertem `ConfigEntry[...]` (Qualitätsstufen-Regel `runtime-data`). Umgesetzt.
- **Reparaturhinweise:** `homeassistant.helpers.issue_registry.async_create_issue(...)` und `async_delete_issue` (Dokumentation „Repairs“). Phase 2.
- **Diagnose:** `diagnostics.py` mit `async_get_config_entry_diagnostics` und `async_redact_data` (Dokumentation „Diagnostics“). Phase 2: nur Zahlen und Struktur, keine Namen.
- **Neu und wichtig – Schemata:** Die aktuelle Dokumentation und Home Assistant 2026.10 verwenden **`probatio`** statt `voluptuous` (HA hängt von `probatio==0.13.0` ab).
  Home Assistant ≥ 2026.10 installiert `probatio` unter dem Namen `voluptuous` (`install_as_voluptuous()` in `homeassistant/__init__.py`), 2026.3.1 verwendet noch `voluptuous`.
  Ein Test zeigt: `websocket_api.websocket_command` akzeptiert in 2026.10 sowohl `voluptuous`- als auch `probatio`-Schemata.
  **Entscheidung:** In Phase 2 bleibt der Code bei `import voluptuous as vol` (läuft auf beiden), und die Tests der HA-Schicht laufen in CI gegen die aktuelle **und** die älteste
  unterstützte Version, damit ein Bruch auffällt.

### A7. To-do-Listen (Punkt 7)
- Dienste `todo.add_item` (Felder u. a. `item`, `due_date`, `description`) und `todo.get_items` (mit Antwortdaten, Filter `status`) existieren in beiden Versionen (`todo/services.yaml`).
- **Entscheidung (Phase 4):** Nachkäufe werden mit `todo.get_items` auf Doppelte geprüft und mit `todo.add_item` eingetragen; Ziel-Entität in den Optionen des Config-Eintrags.

### A8. HACS (Punkt 8)
- Pflicht laut HACS-Dokumentation: genau eine Integration unter `custom_components/<name>/`; `manifest.json` mit `domain`, `documentation`, `issue_tracker`, `codeowners`, `name`, `version`;
  `hacs.json` im Wurzelverzeichnis mit `name`; GitHub-Beschreibung und Themen (Topics) am Repository; README; Markenbilder mit mindestens `icon.png` (`brand/`-Ordner in der Integration, ab Home Assistant 2026.3 möglich).
  Releases sind empfohlen, aber nicht Pflicht. `hacs.json` kennt außerdem `homeassistant` (niedrigste Version) und `persistent_directory`.
- **Entscheidung:** `hacs.json`: `"homeassistant": "2026.3.0"`. Begründung: Ab 2026.3 verlangt Home Assistant Python 3.14 (für Python 3.13 findet `pip` nur bis 2026.2.3), und ab 2026.3 werden lokale `brand/`-Bilder
  unterstützt. Getestet ist die Integration mit 2026.3.1 und 2026.10.0. Der Auftraggeber muss in GitHub **Beschreibung und Themen** am Repository eintragen (HACS prüft das), siehe `docs/PRUEFLISTEN.md`.
- Die Daten liegen in `/config/ordnungstracker/`, nicht im Integrationsordner. Ein HACS-Update lässt sie unberührt; `persistent_directory` ist deshalb nicht nötig.

### A9. Größe von Attributen, Sensoren mit Listen (Punkt 9)
- Der Recorder speichert Attribute nur bis `MAX_STATE_ATTRS_BYTES = 16384` Byte (Quellcode `recorder/db_schema.py`); größere Zustände werden nicht in die Datenbank geschrieben. Die Dokumentation
  rät außerdem, zusätzliche Entitäten statt vieler Attribute zu nutzen.
- **Entscheidung (Phase 2):** Der Zustand ist die Anzahl; das Attribut `items` enthält höchstens 10 Einträge (Name und Pfad, gekürzt), plus `total`. Vollständige Listen liefern WebSocket-Befehle und Dienste mit Antwortdaten.

## B. Entscheidungen zur Umsetzung

### Plattform und Gerüst
- **B1. Python 3.14, Ruff, strenges mypy im Kern.** Zeilenlänge 110 (das Pflichtenheft nennt keine; deutsche Texte sind länger). Regelwerk in `pyproject.toml`.
- **B2. Keine Oberfläche in Phase 0/1.** Der Ordner `frontend/` enthält nur einen Hinweis; die CI-Stufe für die Oberfläche baut erst, wenn dort eine `package.json` liegt, und prüft dann, dass das eingecheckte Bündel aktuell ist.
- **B3. Lizenz MIT, Urheber „Aaron Messmer“** (Name des GitHub-Kontos; bitte prüfen).
- **B4. hassfest und HACS-Validierung laufen in GitHub Actions** (`validate.yml`), nicht lokal – sie benötigen Docker bzw. GitHub. Sie konnten in dieser Umgebung nicht ausgeführt werden; Manifest und Übersetzungen werden zusätzlich durch Tests geprüft (`tests/test_repository.py`).
- **B5. Phasen als Commits.** Jede Phase ist ein eigener Commit auf dem Entwicklungszweig; Pull Requests werden erst auf Wunsch angelegt. Der Text für den Pull Request steht in `docs/PRUEFLISTEN.md`.

### Datenmodell
- **B6. Systemknoten haben feste Kennungen** `unsortiert` und `papierkorb` (statt zufälliger), damit Code, Dokumentation und Dateien darauf verweisen können. Beide gehören zur Art „Raum“ und liegen auf oberster Ebene.
- **B7. Dateiformat gegenüber dem Beispiel im Pflichtenheft ergänzt** (alles optional, nur bei Abweichung vom Standard geschrieben): `settings` (Schwellen `lent_days`, `stale_days`, `trash_days`), `meta.sample` (Merker für Beispieldaten),
  `trashed` (am obersten gelöschten Knoten: Zeitpunkt, alter Elternknoten, Benutzer), `hidden` an Felddefinitionen (Ausblenden mitgelieferter Felder), `classes` und `kinds` an Felddefinitionen. Der Schlüssel `"$schema"` ist erlaubt (Editor-Unterstützung).
- **B8. Unbekannte Schlüssel in der Datei sind ein Fehler**, kein stillschweigendes Weglassen: Ein Tippfehler wie `numer` würde sonst Daten verlieren. Die Meldung nennt den Knoten und die erlaubten Schlüssel.
- **B9. Einstellungen im Inventar, Ziel-To-do-Liste in der Integration.** Schwellen (Ausgeliehenes ohne Datum, „lange nicht bestätigt“, Papierkorb-Dauer) gehören zu den Daten und wandern mit dem Export mit. Die Ziel-To-do-Liste ist eine Entität dieser Installation und liegt in den Optionen des Config-Eintrags (Phase 4).
- **B10. Dinge, Behälter, Gruppen zählen.** „Dinge“ = Klasse `item`; „Behälter“ = Klasse `container`; Gruppen, Orte und Möbel zählen als weder noch. „Leere Behälter“ umfasst Behälter und Möbel ohne aktiven Inhalt. Archivierte Knoten und der Papierkorb zählen nie.
- **B11. Preis gilt für den Eintrag als Ganzes**, nicht je Stück (sonst wäre „Wert pro Raum“ nur mit Mengen sinnvoll, die oft fehlen).
- **B12. Dinge mit Unterpunkten werden Gruppen**, auch beim Verschieben, Wiederherstellen und beim Laden einer von Hand bearbeiteten Datei (dann wird die Normalisierung gespeichert). Eine Art lässt sich nicht auf „Ding“ ändern, solange Einträge dieser Art Unterpunkte haben.
- **B13. Archivierung wird vererbt:** ist ein Knoten „entsorgt“, gilt sein ganzer Inhalt als archiviert.
- **B14. Nummern bleiben im Papierkorb reserviert** und werden erst beim endgültigen Löschen frei; so geht beim Wiederherstellen nichts verloren. Die vorgeschlagene Nummer ist die kleinste, die nirgends (auch nicht im Papierkorb) vergeben ist.
- **B15. Löschen mit „Inhalt eine Ebene hochschieben“:** Nur der Knoten selbst kommt in den Papierkorb (wiederherstellbar), sein Inhalt wird Inhalt des bisherigen Elternknotens (oder oberste Ebene).
- **B16. Mehrfachauswahl beim Verschieben:** Ist ein ausgewählter Knoten Vorfahre eines anderen ausgewählten, wandert der untere mit ihm mit (Struktur bleibt erhalten).
- **B17. Wiederherstellen:** nur der oberste gelöschte Knoten; ist sein alter Platz weg oder selbst gelöscht, landet er in „Unsortiert“ (mit Hinweis).
- **B18. Entnahme für Behälter:** Hinweise zeigen auch die Entnahme eines Vorfahren („Teil von …“). Der Filter „ist entnommen“ und die Übersicht „Entnommen“ zählen nur Knoten mit **eigener** Entnahme, damit ein ausgeliehener Behälter nicht seinen ganzen Inhalt in die Liste spült.
- **B19. Besitzer vererbt sich beim Lesen, nicht durch Kopieren:** Es wird nichts abgeleitet gespeichert; ändert sich der Besitzer eines Raums, ändert sich der wirksame Besitzer des Inhalts sofort.
- **B20. Felder:** Werte nicht mehr geltender Felder bleiben erhalten und werden als „nicht mehr zugeordnet“ geliefert (`FieldValue.assigned = False`). Beim Löschen einer Felddefinition (nur nicht mitgelieferte) verschwinden auch alle Werte. Ausgeblendete Felder erinnern nicht.
- **B21. Wartung:** Die nächste Fälligkeit nach „Erledigt“ wird ab dem **Erledigungsdatum** berechnet; Monate werden am Monatsende begrenzt (31.1. + 1 Monat = 28.2.). Ohne Intervall entfällt die Fälligkeit.
- **B22. Inventur:** „Vorhanden“ setzt `verified` und macht einen als vermisst markierten Knoten wieder `ok`; „fehlt“ setzt `missing`; „gehört woanders hin“ ist ein normales Verschieben. Der Stand einer begonnenen Inventur liegt pro Benutzer in `benutzer.json`.
- **B23. Beispieldaten** (67 Knoten) merken sich ihre Kennungen in `meta.sample`; Entfernen löscht genau diese (samt Beispiel-Personen, -Liste, -Vorlage, -Synonymen). Eigene Einträge, die jemand in einen Beispielknoten gelegt hat, wandern vorher nach „Unsortiert“. Laden geht nur in ein leeres Inventar.

### Suche
- **B24. Falten statt Suchen in Varianten:** Beide Seiten werden gleich gefaltet (klein, `ß`=`ss`, `ss`→`s`, Umlaute und Akzente weg, `ae/oe/ue`→`a/o/u`). So finden `heissklebe`, `heißklebe`, `heisklebe` dasselbe, und `tur`, `tür`, `tuer` finden „Tür“. Folge: sehr selten zusätzliche Treffer (z. B. „Kuehl“ ≈ „Kul“) – akzeptiert, weil nie ein Treffer verloren geht.
- **B25. Ein Treffer braucht mindestens einen Begriff im Knoten selbst.** Begriffe dürfen zusätzlich im Pfad stehen („schrauben keller“), aber „keller“ allein listet nur den Raum, nicht seinen ganzen Inhalt.
- **B26. Rangfolge (kleiner = besser):** exakter Name 0 · Namensanfang 10 · Wortanfang im Namen 20 · Wortteil im Namen 30 · weitere Namen 40/42 · Schlagwörter 44/46 · Notiz 50 · Felder 52 · Entnahme 54 · unscharf 70 · Synonym ab 100. Bei mehreren Begriffen zählt der schlechteste eigene Begriff. Gleichstand: Dinge/Gruppen vor Orten/Möbeln/Behältern, dann kürzerer Pfad, dann Name (natürliche Zahlenreihenfolge).
- **B27. Tippfehler:** nur für Begriffe ab 4 Buchstaben, Editierabstand 1 (bis 7 Buchstaben) bzw. 2 (ab 8), Vertauschung benachbarter Buchstaben zählt als ein Fehler. Unscharfe Treffer erscheinen **nur**, wenn es für den Begriff keinen genauen Treffer gibt – sonst würde jede Suche Rauschen liefern. Verglichen wird mit Wörtern aus Name, weiteren Namen und Schlagwörtern.
- **B28. Synonyme** gelten, wenn der Begriff (oder die ganze Eingabe) ein Mitglied einer Gruppe ist; ihre Treffer stehen hinter allen direkten Treffern (`matched_in = "synonym"`).
- **B29. Nummern:** Eine Eingabe `14` oder `#14` liefert den Knoten mit dieser Nummer zuerst (`number_hit`), danach die gewöhnlichen Treffer. In mehrteiligen Eingaben („basteln 14“) ist die Nummer ein gewöhnlicher Begriff.
- **B30. Leistung:** gemessen auf der Entwicklungsumgebung bei 5.000 Knoten 4–17 ms je Suche (Ziel < 50 ms auf dem Pi 5), Index-Aufbau ≈ 0,12 s. Der Test verlangt großzügig < 0,5 s. Der Index wird über `Inventory.subscribe` gezielt aktualisiert; ein Fuzz-Test stellt sicher, dass er nach zufälligen Änderungen dasselbe liefert wie ein frisch gebauter.

### Fälligkeiten
- **B31. Grenzen:** „läuft bald ab“ gilt ab `remind_days_before` Tage vor dem Datum einschließlich (30 Tage vorher = fällig, 31 = noch nicht); am Tag selbst ist es fällig, ab dem Folgetag überfällig. Wartung ist fällig am Fälligkeitstag. Unter Mindestbestand heißt **strikt kleiner**; ohne Menge keine Meldung.
- **B32. Ausgeliehenes ohne Datum** wird nach **mehr als** `lent_days` Tagen gemeldet (Standard 30) und nur für „ausgeliehen“; „entnommen/ausgelagert“ ohne Rückgabedatum ist nie auffällig. Mit Rückgabedatum ist es überfällig ab dem Tag danach.
- **B33. „Lange nicht bestätigt“:** maßgeblich ist `verified`, sonst das Anlegedatum; Schwelle `stale_days` (Standard 365).
- **B34. Ereignis-Merker:** Jeder fällige Eintrag hat einen stabilen Schlüssel aus Rubrik, Knoten, Detail und Fälligkeitsdatum. Was nicht mehr fällig ist, fällt aus dem Merker und kann später erneut gemeldet werden; ändert sich das Datum, gilt es als neu.

### Speichern
- **B35. Jede Änderung läuft durch `InventoryStore.async_mutate`:** Sperre → Zwischenstand sichern → Operation → vollständige Regelprüfung (5.14) → bei Verstoß oder Fehler **zurückrollen** → Protokoll und gebündeltes Speichern. Die Operationen prüfen außerdem vorab, sodass sie in der Regel gar nichts halb ändern.
- **B36. Formatieren und Schreiben im Thread.** Schon bei 5.000 Knoten dauert das Formatieren etwa 0,15 s; im Event-Loop läuft nur das schnelle `to_dict()`.
- **B37. Fremdänderung erkennen:** durch Vergleich einer Prüfsumme (SHA-256) der Datei – nicht nur des Änderungsdatums. Ist die Datei danach ungültig, wird **nicht** mehr geschrieben (Meldung mit Handlungshinweis), bis sie wieder gültig ist; ungespeicherte eigene Änderungen werden als `inventar.konflikt-<Zeit>.json` gesichert. Home Assistant ruft die Prüfung regelmäßig und beim Dienst „Neu laden“ auf (Phase 2).
- **B38. Sicherungen** heißen `inventar-JJJJMMTT-hhmmss[-grund].json`. „Grund“ ist `manuell`, `vor-import`, `vor-wiederherstellung` oder `vor-migration`. Aufbewahrt werden die neuesten 20 sowie die jeweils neueste je Kalendertag der letzten 30 Tage.
- **B39. Protokoll:** `verlauf.jsonl`, eine Zeile je Änderung; ab 2 MB wird nach `verlauf.1.jsonl` … `verlauf.5.jsonl` rotiert, die älteste fällt weg.
- **B40. Beschädigte Hilfsdateien** (`benutzer.json`, `zustand.json`) werden als `….kaputt` beiseitegelegt und neu begonnen – anders als `inventar.json`, die nie überschrieben wird.

### Schnellerfassung
- **B41. Menge:** `3x`, `3 x`, `3×` (mit Leerzeichen dahinter) und `3xName` (x direkt an der Zahl) sind Malzeichen; `3 xylophon` ist Menge 3 mit dem Namen „xylophon“. `2 Rollen Klebeband` → Menge 2, Einheit „Rollen“, Name „Klebeband“ (nur bekannte Einheiten, Liste in `quickadd.UNITS`). `1,5 l Milch` → 1,5 l. Kommas zwischen Ziffern trennen nie.

### Fehler
- **B42. Fehlerklassen mit Codes.** Jede erwartbare Ablehnung ist ein `InventoryError` mit deutschem Text, Handlungshinweis, stabilem `code` (`not_found`, `number_taken`, `cycle`, …) und `placeholders`; die HA-Schicht kann daraus Übersetzungsschlüssel machen (Phase 2).

### Nachträge zu Phase 1 (nach Rückmeldung des Auftraggebers)
- **B43. Langzeit-Ausleihe.** Manche Dinge sind einfach lange bei jemand anderem. Jede Ausleihe hat deshalb den Schalter `no_reminder` (Dienst/Befehl `check_out` mit `no_reminder`, Befehl `checkout_reminder` zum Aus- und Wiedereinschalten): Dann entfällt die Rubrik „Ausgeliehenes ohne Datum länger als 30 Tage“ für diesen Eintrag. Ein gesetztes Rückgabedatum in der Vergangenheit bleibt trotzdem überfällig. Beim Wiedereinschalten zählt weiter „seit“; wer die Frist neu beginnen will, entnimmt erneut mit neuem Datum. Die Schwelle selbst (`lent_days`) bleibt einstellbar.

## C. Entscheidungen zu Phase 2 (Home-Assistant-Schicht)

- **C1. Feldnamen im WebSocket.** `id` und `type` sind in Nachrichten von Home Assistant belegt (Nachrichtenkennung, Befehlsname) – ein Befehl mit dem Feld `id` wird abgelehnt. Die Felder heißen `node_id`, `kind_id`, `person_id`, `field_id`, `template_id`, `checkout_type`, `field_type`.
- **C2. Ungültige Datei beim Start:** Die Einrichtung wird mit `ConfigEntryNotReady` abgebrochen (Home Assistant versucht es mit wachsendem Abstand erneut) und es entsteht ein Reparaturhinweis mit den Fundstellen (die ersten fünf, mit Knotenname), dem Pfad und der letzten gültigen Sicherung. Nach der Korrektur startet die Integration von selbst, der Hinweis verschwindet. Nichts wird überschrieben.
- **C3. Reparaturhinweise sind nicht „behebbar“ (`is_fixable=False`)**, weil nur der Nutzer die Datei richtig korrigieren kann; sie lassen sich ausblenden. Es gibt fünf: ungültige Datei, neuere Version, von Hand ungültig geändert, Konfliktdatei, Speichern fehlgeschlagen.
- **C4. Takte.** Prüfung auf Änderungen von Hand alle 30 Sekunden (Prüfsumme der Datei, kein Dauerlesen), stündlich: Papierkorb aufräumen, Zahlen auffrischen (Datumswechsel!), Fälligkeiten melden. Zusätzlich nach jeder Änderung. Ausstehende Änderungen werden beim Entladen und beim Beenden von Home Assistant sofort geschrieben.
- **C5. Ereignis `ordnungstracker_due` beim allerersten Start nicht für Bestehendes.** Liegt beim ersten Start schon eine Datei mit Fälligem vor (z. B. Import), wird der Stand nur gemerkt; sonst gäbe es eine Meldungsflut. Danach feuert jeder Eintrag einmal, ändert sich sein Datum, gilt er als neu. Der Merker liegt in `zustand.json`.
- **C6. Abhängigkeiten.** Manifest: `dependencies: [http, websocket_api]`, `after_dependencies: [frontend, panel_custom, todo]`. Das Frontend ist keine harte Abhängigkeit, weil die Integration ohne Oberfläche (Phase 2) schon voll nutzbar ist und die Tests kein Frontend-Paket brauchen. Der Seitenleisten-Eintrag nutzt `panel_custom.async_register_panel` (öffentlicher Aufruf, vorhanden in 2026.3.1 und 2026.10.0).
- **C7. Oberfläche wird nur angemeldet, wenn das Bündel existiert** (`frontend/ordnungstracker.js`, kommt in Phase 3). Der statische Pfad `/ordnungstracker_static` wird einmal je Start registriert (er lässt sich in Home Assistant nicht abmelden), `add_extra_js_url` und das Panel beim Entladen wieder entfernt. Der Seitenleisten-Eintrag („Ordnung“, `mdi:package-variant`) ist in den Optionen abschaltbar.
- **C8. Druck- und Exportansichten:** angemeldete `HomeAssistantView` unter `/api/ordnungstracker/print/<ansicht>`; die Oberfläche holt eine 5 Minuten gültige signierte Adresse über `ordnungstracker/print_url`. Die Signatur gilt nur für genau diese Adresse (getestet: andere Ansicht → 401, nach 6 Minuten → 401). Verhalten in der Companion-App: siehe Prüfliste.
- **C9. Dienste:** Einträge lassen sich mit Kennung **oder Nummer** nennen (`14`, `#14`) – so sind sie in Automationen und den Entwicklerwerkzeugen bequem. Alle Fehler des Kerns werden zu `ServiceValidationError` mit deutschem Text. Der aufrufende Benutzer (`call.context.user_id`) steht im Protokoll, ohne Benutzer `system`.
- **C10. Sensoren.** Zustand = Anzahl; Attribute `total` und `items` (höchstens 10, je `name`, `path`, `detail`, `due`). „Dinge/Behälter gesamt“ haben keine Listen. Ein Test stellt sicher, dass auch 60 Einträge mit langen Namen weit unter 16 KB bleiben. Ein einziges Gerät „Ordnungs-Tracker“ (Typ Dienst) trägt alle Entitäten.
- **C11. Kalender:** ganztägige Termine, Beschreibung = Ort des Eintrags; „nächster Termin“ = erster Termin der nächsten 400 Tage.
- **C12. To-do-Übertragung:** Der Eintrag heißt wie der Knoten, die Beschreibung nennt Bestand, Mindestbestand und Ort. Doppelte werden über `todo.get_items` (offene Einträge, gleicher Titel ohne Beachtung der Groß-/Kleinschreibung) vermieden. Die automatische Übertragung bei Unterschreiten (Pflichtenheft 8.7, „wahlweise“) folgt in Phase 4 mit der Oberfläche; der Dienst und die Ziel-Liste in den Optionen gibt es schon.
- **C13. Nicht in Phase 2 (laut Phasenplan später):** Berechtigungen „Löschen/Einstellungen nur für Administratoren“ (Phase 5), Sprachabfrage (Phase 5), Druckansichten in der Oberfläche (Phase 5). Bis dahin darf jeder angemeldete Benutzer alles; die Schnittstelle prüft den Benutzer bereits und vermerkt ihn im Protokoll.
- **C14. Schemata:** `import voluptuous as vol` (siehe A6) läuft auf 2026.3.1 und 2026.10.0; alle Tests der HA-Schicht laufen gegen beide Versionen (`.venv` mit 2026.10.0, `.venv-min` mit 2026.3.1).
- **C15. mypy:** streng nur im Kern (Pflichtenheft 11); die HA-Schicht wird mitgelesen, ihre Fehler aber nicht gemeldet.
- **C16. `reload` ist keine Zwangsübernahme.** Der Dienst „Neu laden“ vergleicht wie die regelmäßige Prüfung die Prüfsumme: Ist die Datei seit unserem letzten Schreiben unverändert, geschieht nichts – insbesondere gehen ungespeicherte Änderungen nicht verloren.

## D. Entscheidungen zu Phase 3 (Oberfläche)

- **D1. Technik:** Lit 3 ohne Dekoratoren (`static properties`), esbuild erzeugt eine einzige Datei; keine Laufzeit-Abhängigkeit außer Lit. Eingecheckt, die CI baut neu und vergleicht.
- **D2. Keine internen `ha-*`-Elemente** außer `ha-icon` (Pflichtenheft 10); Dialoge, Menüs, Auswahlfelder und Schalter sind eigene einfache Elemente, gestaltet nur mit Home-Assistant-Designvariablen. Dadurch brechen sie bei neuen Home-Assistant-Versionen nicht.
- **D3. Adressen:** `/ordnungstracker`, `/node/<Kennung>`, `/nr/<Nummer>`, `/search?q=…&…`, `/trash`, `/due`, `/settings/<Bereich>` über die History-API; die Zurück-Taste des Handys funktioniert, jede Seite ist als Lesezeichen/QR-Ziel geeignet. Unbekannte Adressen führen zur Übersicht.
- **D4. Live-Aktualisierung:** Die Oberfläche abonniert `ordnungstracker/subscribe`; Änderungen anderer Geräte laden die sichtbare Seite neu (entprellt). Antworten, die von einer neueren Anfrage überholt wurden, werden verworfen (kein Flackern).
- **D5. Schnellerfassung:** Die Vorschau kommt vom Server (derselbe Parser wie beim Anlegen), nach 250 ms Pause; so weichen Vorschau und Ergebnis nie voneinander ab. Kommas als Trenner sind ein Schalter.
- **D6. Langes Drücken (450 ms)** startet die Mehrfachauswahl, ohne Rückfrage. Rückfragen gibt es nur, wo etwas verloren gehen kann (endgültig löschen, Papierkorb leeren, Import, Art mit Ersatz löschen). Alternativ Rechtsklick/Leertaste für Tastaturnutzer.
- **D7. Meldungen** erscheinen oben (nicht über den Knöpfen), 3 Sekunden, höchstens zwei. Fehlermeldungen des Servers (deutsch, mit Handlungshinweis) werden unverändert angezeigt, auch in der englischen Oberfläche – sie zu übersetzen hieße, jeden Fehlertext doppelt zu pflegen.
- **D8. Seite „Fällig“** ist in Phase 3 nur eine einfache Liste; die ausgebauten Ansichten Fällig/Entnommen/Nachkaufen gehören laut Phasenplan zu Phase 4.
- **D9. Export/Import:** Herunterladen als Datei; als Rückfall (Companion-App blockiert Downloads) „In die Zwischenablage kopieren“. Der Import zeigt zuerst die Anzahl und fragt vor dem Ersetzen.
- **D10. Karte:** drei Modi (Suche, Kacheln, Eintrag); sie öffnet die Seitenleiste mit der passenden Adresse, statt eine zweite Oberfläche zu enthalten.
- **D11. Prüfung:** Komponententests (Router, Auswahl, Entprellung/Überholen, Parser-Vorschau, Sprachdateien) plus ein Python-Vertragstest gegen die WebSocket-Befehle. Zusätzlich wurde die Oberfläche einmalig gegen eine echte Home-Assistant-Instanz mit Chromium (Playwright) durchgespielt; dieser Aufbau liegt nicht im Repository, weil er eine laufende Instanz braucht.

## E. Entscheidungen zu Phase 4 (Erweiterungen A)

- **E1. Automatische To-do-Übertragung (Pflichtenheft 8.7, „wahlweise“)** ist eine Option der Integration (`todo_auto`, Standard aus), nicht Teil der Daten: Die To-do-Liste ist eine Sache von Home Assistant, nicht des Inventars. Sie wird **einmal** ausgelöst, wenn ein Eintrag neu unter den Mindestbestand fällt (dieselbe Erkennung wie beim Ereignis `ordnungstracker_due`), und nutzt die Dublettenprüfung des Dienstes. Wer den Eintrag von der Liste streicht, obwohl der Bestand niedrig bleibt, bekommt ihn nicht erneut – sonst wäre die Liste nicht mehr zu leeren. Fehler (Liste weg) werden protokolliert, nie an den Aufrufer der Änderung gegeben. Ersetzt C12 (dort „folgt in Phase 4“).
- **E2. Liste und Option werden nicht in der Oberfläche gewählt**, sondern wie bisher in den Optionen der Integration; die Oberfläche zeigt den Stand und sagt, wo man es einstellt. Eine Entitätenwahl wäre ein eigener HA-Baustein (`ha-entity-picker`), den das Pflichtenheft verbietet.
- **E3. Eigene Felder werden beim Bearbeiten gepflegt, nicht beim Anlegen.** Welche Felder für einen neuen Eintrag gelten, hängt von Ort und Art ab und steht erst nach dem Anlegen fest; Anlegen soll mit wenigen Angaben gehen (10.1). Die Schnittstelle (`create` mit `fields`) kann es, die Oberfläche nutzt es nicht.
- **E4. Felder-Editor:** Typ und Geltungsbereich lassen sich nach dem Anlegen nicht mehr ändern (der Kern erlaubt es nicht; sonst wären gespeicherte Werte ungültig). Mitgelieferte Felder lassen sich nur aus-/einblenden. Beim Löschen eines eigenen Feldes warnt die Oberfläche vor dem Verlust der Werte und empfiehlt Ausblenden.
- **E5. Plus/Minus ändert um 1.** Für Dezimalmengen (0,5 kg) gibt es das Bearbeiten-Formular. Minus ist bei 0 gesperrt. Zeilen mit Menge bekommen die Knöpfe nur bei Dingen (Klasse „Ding“); Behälter zeigen ihre Mengenangabe nie als Knopf.
- **E6. „Erledigt“ ohne Rückfrage und ohne Notiz** (ein Tipp, Protokoll mit heutigem Datum); wer eine Notiz oder ein anderes Datum braucht, nutzt den Dienst `maintenance_done`. Ein versehentliches „Erledigt“ lässt sich nur durch Anpassen der nächsten Fälligkeit zurücknehmen – bei Bedarf Phase 5 (Protokoll).
- **E7. Neue Adressen:** `/ordnungstracker/out` (Entnommen) und `/ordnungstracker/restock` (Nachkaufen); die Kacheln der Übersicht führen dorthin statt in eine gefilterte Suche. „Nachkaufen“ ist dieselbe Seite wie „Fällig“, beschränkt auf die Rubrik „unter Mindestbestand“.
- **E8. `due` liefert Menge/Mindestbestand/Einheit nur in der Rubrik „unter Mindestbestand“** und nur im WebSocket-Befehl (Kopie der Einträge); Sensoren und Ereignisse bleiben unverändert klein.
- **E9. Fehler gefunden und behoben:** Eine Komponenteneigenschaft hieß `nodeName` und überdeckt `Element.nodeName`; sie heißt jetzt `itemName`. Tests fangen so etwas nicht, die Namen der Eigenschaften wurden einmal gegen DOM-Namen geprüft.
- **E10. Nicht in Phase 4 (laut Phasenplan später):** Listen, Inventur, Vorlagen, Druck, Protokoll- und Sicherungsansicht, Berechtigungen, Sprachabfrage (Phase 5).

## F. Entscheidungen zu Phase 5 (Erweiterungen B)

- **F1. Sprachabfrage.** Zwei Absichten (`OrdnungWoIst`, `OrdnungInhalt`), Antworttexte im Kern (`core/voice.py`, ohne Home Assistant, einzeln testbar). Pfad „vom Nächsten zum Entferntesten“ und ohne Pfeile und Datumsziffern, weil es vorgelesen wird; bei Ausleihe „Aber es ist ausgeliehen an …“ (ohne „seit“). Mehrere Treffer: die ersten drei. Inhalte: höchstens zehn Namen, dann „und N weitere“. Die Antwort auf „Was ist in Kiste 14?“ nennt nur die oberste Ebene des Inhalts (eine Gruppe als ein Eintrag), nicht rekursiv – sonst würden Antworten schnell zu lang.
- **F2. Satzdatei.** Sie liegt in der Integration (`sentences/de.yaml`; HACS installiert nur `custom_components/`) und wird beim Einrichten nach `<config>/custom_sentences/de/ordnungstracker.yaml` kopiert (Ausführung im Thread, Fehler stören nichts, danach `conversation.reload`). Die erste Zeile ist eine Kennzeile: Nur Dateien, die mit ihr beginnen, werden erneuert; wer sie entfernt, pflegt die Datei selbst. Löst A5. Die Felder heißen `ding`, `ort`, `nummer` – **nicht `name`**: Home Assistant belegt `name` für Entitätsnamen, und unser Platzhalter wurde dadurch stillschweigend überdeckt (im Test gefunden).
- **F3. Nur Deutsch.** Das Pflichtenheft verlangt die Sprachabfrage auf Deutsch; englische Sätze sind in `ROADMAP.md` als mögliche Erweiterung vermerkt.
- **F4. Berechtigungen** sind eine Option der Integration (`admin_only`, Standard aus), keine Daten des Inventars: Sie gehören zur Anmeldung in Home Assistant. Betroffen sind Löschen (auch Endgültig/Papierkorb leeren), Import, Wiederherstellen, Beispieldaten und alle Einstellungen (Arten, Personen, Felder, Vorlagen, Synonyme, Schwellen, Listen löschen). Anlegen, Ändern, Verschieben, Entnehmen, Wartung, Listen und Inventur bleiben für alle offen. Die Prüfung sitzt in der Schnittstelle (nicht nur in der Oberfläche); die Oberfläche blendet die Knöpfe zusätzlich aus (`status.can_admin`). Aufrufe ohne Benutzer (Automationen) sind nicht betroffen.
- **F5. Inventur.** Der Zwischenstand liegt pro Benutzer und Knoten auf dem Server (`benutzer.json`), nicht im Inventar: Er ist keine Änderung am Bestand. Geprüft wird der direkte Inhalt; wer tiefer prüfen will, startet die Inventur in der Untergruppe. „Gehört woanders hin“ öffnet das Verschieben, danach fällt der Eintrag aus dem Zwischenstand. Beim Abschließen bleiben ungeprüfte Einträge unverändert (mit Hinweis). Abschließen ist die einzige Stelle, die etwas ändert.
- **F6. Listen.** Haken setzen ist sofort sichtbar und wird bei einem Fehler zurückgenommen. Die Gruppierung nach Raum kommt vom Kern. Ein Eintrag aus dem Inventar nennt Pfad und Notiz; Antippen öffnet ihn.
- **F7. Vorlagen.** Anlegen und Löschen, kein Bearbeiten (die Schnittstelle kennt kein `template_update`; ein Editor für verschachtelte Unterpunkte wäre viel Oberfläche für eine seltene Handlung). Unterpunkte werden als eingerückter Text eingegeben; die oberste Ebene bekommt die gewählte Art (Standard: erste Gruppenart), tiefere Ebenen die erste Art der Klasse „Ding“.
- **F8. Drucken.** Die Oberfläche holt die signierte Adresse (5 Minuten, nur für genau diese Ansicht, siehe C8) und öffnet sie mit `window.open`; blockiert die Umgebung neue Fenster (Companion-App), öffnet sie im selben Fenster. Ob das in der App brauchbar ist, steht in der Prüfliste (offen seit A3/A4).
- **F9. Protokoll** zeigt 50 Zeilen je Seite, nachladbar; bekannte Aktionen auf Deutsch, unbekannte unverändert. Verschieben mit altem und neuem Pfad, Bearbeiten mit alt → neu. Das globale Protokoll liegt unter den Einstellungen (also nur für Administratoren, wenn die Option an ist), das je Eintrag in dessen Menü.
- **F10. Sicherungen.** Auflisten, „Jetzt sichern“ und Wiederherstellen mit deutlicher Rückfrage; der Kern sichert vor dem Wiederherstellen den jetzigen Stand (`vor-wiederherstellung`), es gibt also einen Rückweg.
- **F11. Tests mit Assist** brauchen `hassil` und `home-assistant-intents` (Home Assistant lädt sie sonst erst zur Laufzeit); sie stehen in `requirements_test.txt`. Die Tests führen echte Sätze durch den Standard-Agenten.
