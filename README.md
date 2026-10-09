# Ordnungs-Tracker für Home Assistant

Ein Inventar für den Haushalt, das sich wie ein Teil von Home Assistant anfühlt: gleiche Anmeldung, gleiches Erscheinungsbild, ein eigener Eintrag in der Seitenleiste.
Ordnungsprinzip sind **nummerierte Behälter** – jede Kiste bekommt eine Nummer, die außen draufsteht, und hat einen Ort. Keine Strichcodes.

> **Entwicklungsstand: Phase 3 von 6 (Version 0.4.0).** Kern, Anbindung an Home Assistant **und** die Grundfunktionen der Oberfläche (Seitenleiste „Ordnung“, Dashboard-Karte) sind fertig: Haushalt am Handy erfassen, stöbern, suchen, verschieben, löschen und wiederfinden.
> Ausleihen, Mengen, Wartung und Co. in der Oberfläche folgen in Phase 4, Listen/Inventur/Druck/Sprachabfrage in Phase 5 (`docs/ROADMAP.md`); bis dahin gibt es sie als Aktionen.

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
| `verlauf.jsonl` | Änderungsprotokoll (wer hat wann was geändert) |
| `sicherungen/` | Automatische Kopien von `inventar.json` |

### Sicherung und Wiederherstellung

* Vor dem ersten Schreiben nach einem Start und danach höchstens stündlich kopiert der Ordnungs-Tracker `inventar.json` nach `sicherungen/`. Aufbewahrt werden die letzten 20 Kopien und je eine pro Tag der letzten 30 Tage.
* **Wiederherstellen von Hand:** Home Assistant beenden (oder den Ordner im Datei-Editor öffnen), die gewünschte Datei aus `sicherungen/` über `inventar.json` kopieren, Home Assistant neu starten. (Ab Phase 5 geht das auch in der Oberfläche.)
* Ist `inventar.json` beschädigt, startet die Integration **nicht mit leerem Inventar** und überschreibt nichts. Stattdessen zeigt Home Assistant einen Reparaturhinweis (ab Phase 2) mit der Ursache und der letzten gültigen Sicherung.

### Bearbeiten von Hand

Die Datei darf mit jedem Editor bearbeitet werden; das Format ist in [`docs/DATENFORMAT.md`](docs/DATENFORMAT.md) beschrieben, ein vollständiges Beispiel liegt in [`beispiele/beispiel-haushalt.json`](beispiele/beispiel-haushalt.json),
das JSON-Schema in [`docs/inventar.schema.json`](docs/inventar.schema.json) (viele Editoren prüfen damit beim Tippen).
Wird die Datei außerhalb verändert, erkennt die Integration das: Gibt es keine ungespeicherten eigenen Änderungen, lädt sie neu; sonst legt sie ihren Stand als `inventar.konflikt-….json` daneben und meldet es. Ein Tippfehler macht die Datei nicht unbrauchbar –
die Integration nennt dann genau, **was** und **in welchem Knoten** nicht stimmt.

## Oberfläche

Nach der Einrichtung erscheint in der Seitenleiste der Eintrag **Ordnung** (abschaltbar unter *Konfigurieren*).

* **Übersicht:** Suchfeld, Kacheln (Räume, Behälter, Unsortiert, Papierkorb …), Favoriten, zuletzt Angesehenes, leere Behälter, nächste freie Nummer. Ein leeres Inventar bietet **Beispieldaten** an.
* **Stöbern:** Jeder Eintrag hat eine Seite mit Pfad (antippbar), Inhalt und Angaben. **Plus** legt Neues an, **Schnell erfassen** nimmt eine Zeile pro Ding (`3x Batterien AA`) mit Vorschau.
* **Suchen:** Eingabe `14` oder `#14` springt zur Kiste 14; Filter nach Klasse, Art, Ort, Besitzer, Schlagwort, Zustand u. a.
* **Verschieben:** über das Menü ⋮ oder nach **langem Drücken** (Mehrfachauswahl); Ziel per Suche, Nummer oder Stöbern, zuletzt genutzte Ziele zuerst.
* **Löschen:** landet im **Papierkorb** (30 Tage, wiederherstellbar); bei Behältern mit Inhalt wählst du „mit Inhalt“ oder „Inhalt hochschieben“.
* **Einstellungen:** Arten, Personen, Export (JSON, Markdown), Import, Beispieldaten.
* **Dashboard-Karte:** `type: custom:ordnungstracker-card` (Suche, Kacheln oder ein bestimmter Eintrag; Einstellung im Karteneditor).
* Die Oberfläche folgt der Sprache von Home Assistant (Deutsch, sonst Englisch) und dem gewählten Design (hell/dunkel).

Jeder Eintrag hat eine feste Adresse (`/ordnungstracker/node/<Kennung>`, Kisten auch `/ordnungstracker/nr/14`) – später das Ziel von QR-Codes.

## Aktionen (für Automationen und Entwickler)

*Entwicklerwerkzeuge → Aktionen*, dort `ordnungstracker.…` wählen (die Aktionen sind auf Deutsch beschrieben):

1. **Eintrag anlegen:** `ordnungstracker.create_node` mit `name: Keller` (ohne Ablageort = oberste Ebene, die Art wird vorgeschlagen), dann `name: Regal B`, `parent: Keller-Kennung`, und `name: Basteln`, `kind: kiste`, `number: auto` (kleinste freie Nummer).
   Die Kennung steht in der Antwort. Später genügt für Einträge mit Nummer ihre Nummer: `parent: "#1"`.
2. **Suchen:** `ordnungstracker.search` mit `query: heißkleb` – du bekommst Treffer mit vollständigem Pfad. Eingaben wie `14` oder `#14` springen zur Kiste mit dieser Nummer.
3. **Beispieldaten ausprobieren:** `ordnungstracker.load_sample` lädt einen kleinen Beispielhaushalt (nur in ein leeres Inventar), `ordnungstracker.remove_sample` entfernt ihn wieder. (In der Oberfläche geht das mit einem Tipp auf der Übersicht.)

Alle Aktionen sind in [`docs/API.md`](docs/API.md) beschrieben.

## Entitäten

| Entität | Zustand | Attribute |
|---|---|---|
| Sensoren *Dinge gesamt*, *Behälter gesamt* | Anzahl | – |
| *Leere Behälter*, *Unsortiert*, *Unter Mindestbestand*, *Läuft bald ab*, *Wartung fällig*, *Vermisst* | Anzahl | `total`, `items` (höchstens 10: `name`, `path`, …) |
| *Entnommen* | Anzahl | zusätzlich `overdue` (davon überfällig) |
| Kalender *Termine* | nächster Termin | Ablauf, Garantieende, Rückgabe, Wartung |

Vollständige Listen liefern die Aktionen (`ordnungstracker.search`, `get_node`) – die Attribute bleiben absichtlich kurz.

## Optionen

*Einstellungen → Geräte & Dienste → Ordnungs-Tracker → Konfigurieren*: **To-do-Liste für Nachkäufe** und **Eintrag „Ordnung“ in der Seitenleiste** (wirkt, sobald die Oberfläche installiert ist).
Die Schwellen für Erinnerungen (z. B. „Ausgeliehenes ohne Datum gilt nach 30 Tagen als überfällig“) gehören zu deinen Daten (`settings` in `inventar.json`).

**Langzeit-Ausleihe:** Ist etwas für lange Zeit bei jemandem, schaltest du die Erinnerung für genau diese Ausleihe ab (`no_reminder: true` bei `check_out`) und bei Bedarf wieder ein.

## Reparaturhinweise

Probleme erscheinen unter *Einstellungen → System → Reparaturen*, auf Deutsch und mit Handlungshinweis: Datei ungültig (mit Fundstellen und letzter gültiger Sicherung), neuere Dateiversion, von Hand ungültig geändert,
Konfliktdatei angelegt, Speichern fehlgeschlagen. Ein Tippfehler in der Datei richtet nie Schaden an: Es wird nichts überschrieben, und nach der Korrektur läuft alles von selbst weiter.

## Beispiel-Automationen

**1. Benachrichtigung, wenn etwas neu fällig wird** (Ablauf, Rückgabe, Nachkauf, Wartung, vermisst):

```yaml
alias: Ordnungs-Tracker meldet Fälliges
triggers:
  - trigger: event
    event_type: ordnungstracker_due
actions:
  - action: notify.notify          # eigenen Benachrichtigungsdienst eintragen
    data:
      title: "Ordnung: {{ trigger.event.data.name }}"
      message: >-
        {{ {'expiring': 'läuft bald ab', 'checkout_overdue': 'Rückgabe überfällig',
            'below_min': 'nachkaufen', 'maintenance_due': 'Wartung fällig',
            'missing': 'vermisst'}[trigger.event.data.category] }}
        – {{ trigger.event.data.path }} {{ trigger.event.data.detail }}
```

**2. Jeden Samstag den Einkaufszettel ergänzen** (alles unter dem Mindestbestand auf die gewählte To-do-Liste, ohne Doppelte):

```yaml
alias: Nachkäufe auf die Einkaufsliste
triggers:
  - trigger: time
    at: "09:00:00"
conditions:
  - condition: time
    weekday: [sat]
actions:
  - action: ordnungstracker.transfer_to_todo
    data:
      todo_entity: todo.einkaufsliste   # oder weglassen, wenn in den Optionen gewählt
```

## Entwicklung

Siehe [`CLAUDE.md`](CLAUDE.md), [`docs/ARCHITEKTUR.md`](docs/ARCHITEKTUR.md) und das [Pflichtenheft](docs/PFLICHTENHEFT.md). Entscheidungen und die Ergebnisse der Plattform-Recherche: [`docs/ENTSCHEIDUNGEN.md`](docs/ENTSCHEIDUNGEN.md).
Lizenz: MIT.
