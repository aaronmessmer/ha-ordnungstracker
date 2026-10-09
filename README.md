# Ordnungs-Tracker für Home Assistant

Ein Inventar für den Haushalt, das sich wie ein Teil von Home Assistant anfühlt: gleiche Anmeldung, gleiches Erscheinungsbild, ein eigener Eintrag in der Seitenleiste.
Ordnungsprinzip sind **nummerierte Behälter** – jede Kiste bekommt eine Nummer, die außen draufsteht, und hat einen Ort. Keine Strichcodes.

> **Entwicklungsstand: Phase 0 von 6 (Version 0.1.0).** Das Gerüst steht; der **Kern** (Datenmodell, Suche, Speicherung), die Anbindung an Home Assistant, die **Oberfläche** und die Sprachabfrage folgen in den nächsten Phasen (`docs/ROADMAP.md`).
> Heute lässt sich die Integration installieren und einrichten, sie tut aber noch nichts Sichtbares.

## Was es kann (Ziel)

* **Finden:** „Wo ist X?“ in Sekunden, mit vollständigem Pfad (Ding → Gruppe → Kiste 14 → Regal B → Keller).
* **Nachschauen:** „Was ist in diesem Raum, Regal, dieser Kiste?“
* **Grob anfangen, später verfeinern:** erst „Bastelsachen“ in die Kiste, später das Genaue – beliebig tief verschachtelt.
* **Schnell erfassen:** eine Zeile pro Ding, Mengen werden erkannt (`3x Batterien AA`).
* Ausleihen und Auslagern, Mengen mit Mindestbestand, Ablaufdaten und Garantie, Wartung, Packlisten, Inventur, Druckansichten.
* Sensoren, Kalender, Dienste, Ereignisse und Sprachabfrage für Automationen.
* **Deine Daten gehören dir:** eine lesbare, dokumentierte JSON-Datei, die sich sichern, von Hand bearbeiten und mitnehmen lässt.

## Installation über HACS

1. HACS öffnen → Menü (⋮) → **Benutzerdefinierte Repositories**.
2. Adresse `https://github.com/aaronmessmer/ha-ordnungstracker` eintragen, Kategorie **Integration**.
3. „Ordnungs-Tracker“ herunterladen und Home Assistant neu starten.
4. **Einstellungen → Geräte & Dienste → Integration hinzufügen → „Ordnungs-Tracker“.** Es sind keine Angaben nötig; es gibt genau eine Instanz.

Voraussetzung: Home Assistant **2026.3.0** oder neuer.

## Deine Daten

Alles liegt im Ordner `ordnungstracker` im Konfigurationsverzeichnis (neben `configuration.yaml`) und ist damit automatisch Teil der Home-Assistant-Backups:

| Datei / Ordner | Inhalt |
|---|---|
| `inventar.json` | Das Inventar – die einzige Quelle der Wahrheit |
| `benutzer.json` | Favoriten und zuletzt Angesehenes je Benutzer |
| `verlauf.jsonl` | Änderungsprotokoll |
| `sicherungen/` | Automatische Kopien von `inventar.json` |

### Sicherung und Wiederherstellung

* Vor dem ersten Schreiben nach einem Start und danach höchstens stündlich kopiert der Ordnungs-Tracker `inventar.json` nach `sicherungen/`. Aufbewahrt werden die letzten 20 Kopien und je eine pro Tag der letzten 30 Tage.
* **Wiederherstellen von Hand:** Home Assistant beenden (oder den Ordner im Datei-Editor öffnen), die gewünschte Datei aus `sicherungen/` über `inventar.json` kopieren, Home Assistant neu starten. (Ab Phase 5 geht das auch in der Oberfläche.)
* Ist `inventar.json` beschädigt, startet die Integration **nicht mit leerem Inventar** und überschreibt nichts. Stattdessen zeigt Home Assistant einen Reparaturhinweis (ab Phase 2) mit der Ursache und der letzten gültigen Sicherung.

### Bearbeiten von Hand

Die Datei darf mit jedem Editor bearbeitet werden; das Format ist in [`docs/DATENFORMAT.md`](docs/DATENFORMAT.md) (Entwurf) beschrieben, das JSON-Schema in [`docs/inventar.schema.json`](docs/inventar.schema.json) (viele Editoren prüfen damit beim Tippen).
Wird die Datei außerhalb verändert, erkennt die Integration das: Gibt es keine ungespeicherten eigenen Änderungen, lädt sie neu; sonst legt sie ihren Stand als `inventar.konflikt-….json` daneben und meldet es. Ein Tippfehler macht die Datei nicht unbrauchbar –
die Integration nennt dann genau, **was** und **in welchem Knoten** nicht stimmt.

## Beispiel-Automationen

Folgen mit Phase 2, sobald die Ereignisse und Sensoren existieren.

## Entwicklung

Siehe [`CLAUDE.md`](CLAUDE.md), [`docs/ARCHITEKTUR.md`](docs/ARCHITEKTUR.md) und das [Pflichtenheft](docs/PFLICHTENHEFT.md). Entscheidungen und die Ergebnisse der Plattform-Recherche: [`docs/ENTSCHEIDUNGEN.md`](docs/ENTSCHEIDUNGEN.md).
Lizenz: MIT.
