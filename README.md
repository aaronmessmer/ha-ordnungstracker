# Ordnungs-Tracker für Home Assistant

Ein Inventar für den Haushalt, das sich wie ein Teil von Home Assistant anfühlt: gleiche Anmeldung, gleiches Erscheinungsbild, ein eigener Eintrag in der Seitenleiste.
Ordnungsprinzip sind **nummerierte Behälter** – jede Kiste bekommt eine Nummer, die außen draufsteht, und hat einen Ort. Keine Strichcodes.

> **Version 1.0.0.** Alle Funktionen des Pflichtenhefts sind umgesetzt; was daran noch von einem echten Home Assistant und der Companion-App abhängt, steht in [`docs/PRUEFLISTEN.md`](docs/PRUEFLISTEN.md), der Abgleich mit dem Pflichtenheft in [`docs/ABNAHME.md`](docs/ABNAHME.md).

## Was es kann

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

## Erste Schritte

1. In der Seitenleiste **Ordnung** öffnen. Ein leeres Inventar bietet **Beispieldaten** an – gut zum Ausprobieren, in den Einstellungen mit einem Tipp wieder zu entfernen.
2. Einen **Raum** anlegen („Plus“), darin ein **Regal**, darin eine **Kiste**: Die Kiste bekommt die nächste freie **Nummer** – schreib sie außen drauf.
3. In der Kiste **Schnell erfassen**: eine Zeile pro Ding (`3x Batterien AA`), mit Vorschau. Grob anfangen genügt („Bastelsachen“); das Genaue trägst du später nach.
4. Wiederfinden: oben ins Suchfeld tippen, oder die Nummer der Kiste (`14`). Jeder Treffer zeigt den vollständigen Pfad.
5. Optional: eine **Dashboard-Karte** hinzufügen (Karte „Ordnungs-Tracker“, Betriebsart im Karteneditor), eine **To-do-Liste** für Nachkäufe wählen (*Konfigurieren*), Fragen an **Assist** stellen („Wo ist die Schere?“).

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
* **Wiederherstellen von Hand:** Home Assistant beenden (oder den Ordner im Datei-Editor öffnen), die gewünschte Datei aus `sicherungen/` über `inventar.json` kopieren, Home Assistant neu starten. (Einfacher: *Einstellungen → Sicherungen* in der Oberfläche; vor dem Wiederherstellen wird der jetzige Stand gesichert.)
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
* **Entnehmen und Zurücklegen:** Auf jeder Seite „Ausleihen an …“ (freier Text oder Person) oder „Entnehmen / auslagern“ (wo es jetzt ist), mit „seit“, „zurück bis“ und Notiz; Zurücklegen ist ein Tipp, der Stammplatz bleibt. **Entnommen** zeigt alles, was nicht an seinem Platz ist, längste Dauer zuerst. Bei Dauerleihgaben schaltest du die Erinnerung ab.
* **Menge:** Plus und Minus direkt in der Liste und auf der Seite; fällt sie unter den Mindestbestand, erscheint der Eintrag unter **Nachkaufen** (mit Knopf „Auf die To-do-Liste“, wahlweise selbsttätig).
* **Fällig:** fünf Rubriken (läuft ab, Rückgabe überfällig, unter Mindestbestand, Wartung fällig, vermisst) mit Abkürzungen („Zurücklegen“, „Erledigt“, Plus/Minus).
* **Wartung:** pro Eintrag beliebig viele Aufgaben mit Intervall und nächster Fälligkeit; „Erledigt“ trägt das Protokoll ein und rechnet den nächsten Termin aus.
* **Eigene Angaben:** Beim Bearbeiten stehen die Felder, die für den Eintrag gelten (Ablaufdatum, Preis, Garantie, Seriennummer … oder eigene). Zustand (defekt, vermisst, zu verkaufen …) wählst du dort unter „Weitere Angaben“.
* **Listen:** Packlisten quer durch den Haushalt („Campingausrüstung“): Einträge aus dem Inventar (auf der Seite des Eintrags: ⋮ → „Auf eine Liste setzen“) oder freie Zeilen, abhaken, nach Raum gruppiert, Haken zurücksetzen, als Packliste drucken.
* **Inventur:** ⋮ → „Inventur starten“ bei einem Behälter oder Ort: Eintrag für Eintrag *da* / *fehlt* / *gehört woanders hin*, Gefundenes ergänzen. Der Zwischenstand bleibt erhalten. Beim Abschließen bekommen Bestätigte das Datum der Prüfung, Fehlende den Zustand „vermisst“.
* **Vorlagen:** Voreinstellung für neue Einträge (Art, Schlagwörter, Besitzer, vorgegebene Unterpunkte); beim Anlegen „Aus Vorlage“.
* **Drucken:** Inhaltsblatt eines Behälters (⋮ → „Inhaltsblatt drucken“), Gesamtliste und Behälterliste (*Einstellungen → Daten*), Packliste. Die Seite öffnet sich in einem neuen Fenster; gedruckt wird mit dem Browser.
* **Protokoll:** pro Eintrag (⋮ → „Verlauf anzeigen“) und insgesamt (*Einstellungen → Protokoll*): wer hat wann was geändert, bei Verschiebungen mit altem und neuem Pfad.
* **Einstellungen:** Arten, Personen, **Felder** (anlegen, überall oder nur in einem Eintrag und darunter, mitgelieferte ausblenden), **Vorlagen**, **Synonyme**, **Erinnerungen** (Schwellen, To-do-Stand), **Sicherungen**, **Protokoll**, Export (JSON, Markdown), Import, Beispieldaten.
* **Dashboard-Karte:** `type: custom:ordnungstracker-card` (Suche, Kacheln oder ein bestimmter Eintrag; Einstellung im Karteneditor).
* Die Oberfläche folgt der Sprache von Home Assistant (Deutsch, sonst Englisch) und dem gewählten Design (hell/dunkel).

Jeder Eintrag hat eine feste Adresse (`/ordnungstracker/node/<Kennung>`, Kisten auch `/ordnungstracker/nr/14`) – später das Ziel von QR-Codes.

## Sprachabfrage (Assist)

Zwei Fragen auf Deutsch, nur lesend – die Sätze richtet die Integration selbst ein (Datei `<config>/custom_sentences/de/ordnungstracker.yaml`, wird bei Aktualisierungen erneuert; entfernst du die erste Zeile, pflegst du sie selbst):

* „Wo ist / sind / liegt / finde ich **die Heißklebepistole**?“ → bester Treffer mit Pfad („… liegt in Bastelsachen, Kiste 14 Basteln, Regal B, Keller“), bei mehreren die ersten drei, bei Ausleihe der Hinweis.
* „Was ist in **Kiste 14**?“ und „Was ist in **Basteln**?“ → der Inhalt, bei langen Listen gekürzt mit Anzahl.

Voraussetzung: ein Sprachassistent mit deutscher Sprache. Die Antworten nutzen dieselbe Suche wie die Oberfläche. Schreibende Sprachbefehle gibt es bewusst nicht.

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

*Einstellungen → Geräte & Dienste → Ordnungs-Tracker → Konfigurieren*: **Löschen und Einstellungen nur für Administratoren** (gilt für die Oberfläche und die Aktionen; Automationen ohne Benutzer sind nicht betroffen), **To-do-Liste für Nachkäufe**, **Nachkäufe selbsttätig auf die To-do-Liste setzen** (sobald etwas unter den Mindestbestand fällt, ohne Doppelte; wer es von der Liste streicht und weiter unter dem Minimum bleibt, bekommt es nicht erneut) und **Eintrag „Ordnung“ in der Seitenleiste**.
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

Siehe [`CLAUDE.md`](CLAUDE.md), [`docs/ARCHITEKTUR.md`](docs/ARCHITEKTUR.md) und das [Pflichtenheft](docs/PFLICHTENHEFT.md). Entscheidungen und die Ergebnisse der Plattform-Recherche: [`docs/ENTSCHEIDUNGEN.md`](docs/ENTSCHEIDUNGEN.md). Datenformat: [`docs/DATENFORMAT.md`](docs/DATENFORMAT.md), Schnittstellen: [`docs/API.md`](docs/API.md), Abnahme: [`docs/ABNAHME.md`](docs/ABNAHME.md), Prüflisten: [`docs/PRUEFLISTEN.md`](docs/PRUEFLISTEN.md), Zurückgestelltes: [`docs/ROADMAP.md`](docs/ROADMAP.md).
Lizenz: MIT.
