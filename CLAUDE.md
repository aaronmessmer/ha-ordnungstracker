# Arbeitsanweisung für Claude Code

Verbindlicher Auftrag: **`docs/PFLICHTENHEFT.md`** (vollständig lesen, bevor etwas gebaut wird). Änderungen am Umfang werden dort nachgetragen, nicht nur im Code.

## Arbeitsweise (Kurzfassung)

* Sorgfalt vor Geschwindigkeit: jede Phase planen, umsetzen, testen, selbst gegen das Pflichtenheft prüfen, Dokumentation nachziehen.
* HA-Schnittstellen **nachschlagen**, nicht aus dem Gedächtnis annehmen. `developers.home-assistant.io` kann gesperrt sein; die Markdown-Quellen liegen unter
  `https://raw.githubusercontent.com/home-assistant/developers.home-assistant/master/docs/…`, und der Quellcode der installierten Version (`…/site-packages/homeassistant`) ist maßgeblich.
* In einem echten Home Assistant kann nicht getestet werden. Alles Automatisierbare gehört in Tests; für den Rest eine deutsche Prüfliste in `docs/PRUEFLISTEN.md`.
* Offene Punkte selbst entscheiden und mit einem Satz Begründung in `docs/ENTSCHEIDUNGEN.md` festhalten. Nachfragen nur bei Umfangsänderungen oder schwer umkehrbaren Entscheidungen (vor allem Datenformat).
* Code, Bezeichner, Commit-Nachrichten: **Englisch**. Oberfläche, README, Dokumentation, Fehlermeldungen an Nutzer: **Deutsch** (Oberfläche übersetzbar: Deutsch/Englisch).

## Aufbau

```
custom_components/ordnungstracker/   Integration (HA-Schicht, dünn)
  core/                              reines Python, importiert NIE homeassistant (Test erzwingt das)
  frontend/                          gebautes Bündel (ab Phase 3)
frontend/                            Quelltext der Oberfläche (TypeScript, Lit; ab Phase 3)
tests/core  tests/ha  tests/test_repository.py
docs/                                Pflichtenheft, Architektur, Datenformat (+ JSON-Schema), API, Entscheidungen, Fahrplan, Prüflisten
beispiele/                           Beispielinventar (wird aus dem Code erzeugt, Test prüft Aktualität)
custom_sentences/                    Beispielsätze für Assist (ab Phase 5)
```

Daten des Nutzers: `/config/ordnungstracker/` (`inventar.json` = einzige Quelle der Wahrheit, `benutzer.json`, `verlauf.jsonl`, `zustand.json`, `sicherungen/`, `anhaenge/`).

## Befehle

Python **3.14** nötig (Home Assistant 2026.x). Einrichtung z. B. mit uv:

```bash
uv venv --python 3.14 .venv && uv pip install --python .venv/bin/python -r requirements_test.txt
source .venv/bin/activate

pytest                              # alle Tests (≈ 15 s)
pytest --cov                        # mit Abdeckung des Kerns (Schwelle 90 %)
ruff check custom_components tests && ruff format --check custom_components tests
mypy                                # Kern streng

# Beispielinventar nach Änderungen an sample.py / Datenformat neu erzeugen:
python -m custom_components.ordnungstracker.core.sample beispiele/beispiel-haushalt.json
```

Oberfläche: im Ordner `frontend/` `npm ci && npm run typecheck && npm test && npm run build`; das Ergebnis (`custom_components/ordnungstracker/frontend/ordnungstracker.js`) wird eingecheckt, die CI prüft die Aktualität. Nach jeder Änderung an `frontend/src` neu bauen und einchecken.

## Konventionen

* Fachlogik gehört in den **Kern**; die HA-Schicht übersetzt nur. Jede Änderung am Inventar ist eine Methode von `core.inventory.Inventory`, aufgerufen über `InventoryStore.async_mutate`.
* Operationen **prüfen zuerst, ändern dann**; Fehler sind `InventoryError`-Unterklassen mit deutschem Text, Handlungshinweis und stabilem `code`.
* Datenformat nur mit Migration ändern (`core/migrations.py`, `schema_version` anheben, `docs/DATENFORMAT.md` und `docs/inventar.schema.json` nachziehen, Beispieldatei neu erzeugen).
* Nie blockierenden Dateizugriff im Event-Loop; Dateien nur atomar schreiben (`store.write_atomic`).
* Versionen semantisch; `manifest.json` und `CHANGELOG.md` pro Phase aktualisieren. Release: GitHub → Actions → „Release“ von Hand starten.
* WebSocket-Felder heißen nie `id`/`type` (von Home Assistant belegt): `node_id`, `kind_id`, `checkout_type` usw.
* `hacs.json: homeassistant` = älteste getestete Version (2026.3.0); Tests der HA-Schicht gegen die aktuelle **und** die älteste Version laufen lassen (zwei venvs: `uv pip install pytest-homeassistant-custom-component==0.13.317` ergibt HA 2026.3.1).

## Stand der Phasen

| Phase | Stand |
|---|---|
| 0 Grundlage | fertig (0.1.0) |
| 1 Kern | fertig (0.2.0) |
| 2 Home-Assistant-Schicht | fertig (0.3.0) |
| 3 Oberfläche, Grundfunktionen | fertig (0.4.0) |
| 4 Erweiterungen A | fertig (0.5.0) |
| 5 Erweiterungen B | **als Nächstes** |
| 6 | offen (siehe `docs/ROADMAP.md`) |
