# Entscheidungen

Dieses Dokument hält fest, **was bei der Entwicklung nachgeschlagen** und **was entschieden** wurde (Pflichtenheft
Abschnitte 1, 15). Jede Entscheidung hat einen Satz Begründung. Neue Einträge werden unten ergänzt.

Stand: Phase 0.

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
  unverändert von uns stammt – erkennbar an einer Kennzeile). Der Nutzer muss nichts kopieren. Die Quelle liegt im Repository unter `custom_sentences/de/`. Das kommt ins README.
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
