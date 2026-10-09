# Pflichtenheft: Ordnungs-Tracker für Home Assistant

Dieses Dokument ist der vollständige Auftrag für die Entwicklung. Es beschreibt, was gebaut wird, wie es aufgebaut sein soll und in welcher Reihenfolge. Es liegt im Repository unter `docs/PFLICHTENHEFT.md` und bleibt die verbindliche Referenz. Änderungen am Umfang werden hier nachgetragen, nicht nur im Code.

---

## 1. Auftrag und Arbeitsweise

Du (Claude Code) entwickelst eine eigene Home-Assistant-Integration samt Oberfläche, mit der ein Haushalt nachvollziehen kann, was wo liegt. Der Auftraggeber ist technisch versierter Home-Assistant-Nutzer, aber kein Softwareentwickler. Er kann Dateien installieren, testen und Rückmeldung geben, liest aber keinen Code gegen.

Daraus folgt für deine Arbeitsweise:

- **Sorgfalt vor Geschwindigkeit.** Der Auftraggeber will ausdrücklich eine saubere, durchdachte Lösung und ist bereit, dafür viel Rechenzeit einzusetzen. Plane jede Phase, bevor du Code schreibst, und prüfe deine Arbeit am Ende jeder Phase selbst gegen dieses Dokument.
- **Nichts aus dem Gedächtnis annehmen, was sich prüfen lässt.** Die Entwickler-Schnittstellen von Home Assistant ändern sich laufend. Lies zu Beginn und vor jeder HA-nahen Phase die aktuelle Entwicklerdokumentation (developers.home-assistant.io) und richte dich nach dem Stand der aktuellen stabilen Version. Abschnitt 15 listet die Stellen, an denen das besonders wichtig ist.
- **Du kannst nicht in einem echten Home Assistant testen.** Deine Sitzung hat keinen Zugriff auf die Installation des Auftraggebers. Alles, was sich automatisch prüfen lässt, muss deshalb durch Tests abgedeckt sein. Für den Rest schreibst du pro Phase eine kurze Prüfliste auf Deutsch, die der Auftraggeber in seinem Home Assistant abarbeitet.
- **Entscheide selbst, dokumentiere es.** Wo dieses Dokument etwas offen lässt, triff eine vernünftige Entscheidung und halte sie mit einem Satz Begründung in `docs/ENTSCHEIDUNGEN.md` fest. Frage nur nach, wenn eine Entscheidung den Umfang verändert oder später schwer umkehrbar ist (vor allem: Änderungen am Datenformat).
- **Phasenweise liefern.** Abschnitt 13 teilt die Arbeit in Phasen. Jede Phase endet in einem lauffähigen, getesteten Stand in einem eigenen Pull Request mit deutscher Zusammenfassung und Prüfliste. Beginne keine neue Phase, bevor die Tests der vorigen grün sind.
- **Sprache.** Code, Bezeichner und Commit-Nachrichten auf Englisch. Oberfläche, README, Dokumentation und alles, was der Auftraggeber liest, auf Deutsch. Die Oberfläche ist übersetzbar aufgebaut (Deutsch als Hauptsprache, Englisch als zweite).

---

## 2. Ausgangslage

- Home Assistant OS auf einem Raspberry Pi 5 (8 GB RAM, SSD). HACS ist installiert.
- Mehrere Haushaltsmitglieder nutzen Home Assistant, überwiegend am Handy über die Companion-App, gelegentlich am PC.
- Der Auftraggeber hat Homebox (als Add-on) ausprobiert und verworfen. Grund: Es fühlt sich nicht wie ein Teil von Home Assistant an, öffnet eine eigene Website und verlangt eine eigene Anmeldung. Der Funktionsumfang von Homebox gefiel ihm dagegen gut.
- Strichcodes sind ausdrücklich nicht gewünscht. Das Ordnungsprinzip sind **nummerierte Behälter**: Jede Kiste bekommt eine Nummer, die außen draufsteht, und hat einen Ort.

---

## 3. Ziele und Nichtziele

### Ziele

1. **Finden:** "Wo ist X?" wird in Sekunden beantwortet, mit vollständigem Pfad (Ding → Gruppe → Kiste 14 → Regal B → Keller).
2. **Nachschauen:** "Was ist in diesem Raum, Regal, dieser Kiste?" ist dieselbe Datenbasis von oben gelesen.
3. **Grob anfangen, später verfeinern:** Man schreibt zuerst nur "Bastelsachen" in eine Kiste und trägt irgendwann nach, was genau darin ist. Die Verschachtelung ist beliebig tief.
4. **Erfassen darf keine Arbeit sein.** Wenn das Eintragen mühsam ist, wird das System nicht gepflegt. Schnelles Erfassen hat Vorrang vor Vollständigkeit der Angaben.
5. **Echter Teil von Home Assistant:** gleiche Anmeldung, gleiches Erscheinungsbild, eigener Eintrag in der Seitenleiste, Karte fürs Dashboard, Sensoren, Dienste.
6. **Die Daten gehören dem Nutzer:** eine lesbare, dokumentierte JSON-Datei, die sich sichern, von Hand bearbeiten und in ein anderes System mitnehmen lässt.

### Nichtziele

- Kein Strichcode-Abruf, keine Produktdatenbank.
- Keine getrennten Inventare pro Benutzer. Es gibt ein gemeinsames Inventar, die Zuordnung zu Personen läuft über ein Besitzer-Feld (Abschnitt 5.5).
- Kein CSV-Import.
- Keine Warenwirtschaft im kaufmännischen Sinn (keine Buchungen, keine Lagerbewertung).
- Keine Abhängigkeit von anderen HACS-Erweiterungen (auch nicht von Browser Mod oder card-mod).

---

## 4. Architektur

Drei Schichten, klar getrennt:

```
┌──────────────────────────────────────────────────────────┐
│ Oberfläche (TypeScript, Lit)                             │
│ Seitenleisten-Panel + Dashboard-Karte, ein gemeinsamer   │
│ Code. Enthält keine Fachlogik, nur Darstellung/Bedienung.│
└───────────────▲──────────────────────────────────────────┘
                │ WebSocket-Befehle + Abo für Änderungen
┌───────────────┴──────────────────────────────────────────┐
│ Home-Assistant-Schicht (Python)                          │
│ Config Flow, WebSocket-API, Dienste, Sensoren, Kalender, │
│ Ereignisse, Sprachabfrage, Diagnose, Reparaturhinweise.  │
│ Dünn: übersetzt nur zwischen HA und Kern.                │
└───────────────▲──────────────────────────────────────────┘
                │ gewöhnliche Python-Aufrufe
┌───────────────┴──────────────────────────────────────────┐
│ Kern (reines Python, kein Import von homeassistant)      │
│ Datenmodell, Regeln, Baumoperationen, Suche, Felder,     │
│ Fälligkeiten, Laden/Speichern/Migration der JSON-Datei.  │
└──────────────────────────────────────────────────────────┘
```

Begründung der wichtigsten Entscheidungen:

- **Der Kern kennt Home Assistant nicht.** Er liegt als Unterpaket in der Integration (`core/`), importiert aber nichts aus `homeassistant`. So lässt er sich schnell und vollständig mit gewöhnlichen Tests prüfen, und die gesamte Fachlogik ist von Änderungen an HA-Schnittstellen unberührt.
- **Die Fachlogik sitzt im Python-Teil, nicht in der Karte.** Suche, Vererbung, Fälligkeiten und Regeln werden auf dem Server berechnet. Die Oberfläche fragt ab und zeigt an. Dadurch nutzen Oberfläche, Dienste und Sprachabfrage dieselbe Logik und liefern dieselben Ergebnisse.
- **Die Oberfläche ist zwangsläufig JavaScript.** Home Assistant kennt für Dashboards nichts anderes. Sie wird in TypeScript mit Lit geschrieben und zu einer einzigen Datei gebaut, die fertig im Repository liegt, damit die Installation über HACS keinen Bauschritt braucht.
- **Keine YAML-Konfiguration.** Einrichtung über die HA-Oberfläche (Config Flow), genau eine Instanz.
- **Keine zusätzlichen Python-Abhängigkeiten**, sofern vermeidbar. Die Datenmenge ist klein (einige tausend Einträge), eigene schlanke Implementierungen reichen, etwa für die unscharfe Suche.

---

## 5. Datenmodell

### 5.1 Grundidee: alles ist ein Knoten

Raum, Regal, Schrank, Kiste, Tasche, Gruppe und einzelnes Ding sind derselbe Datentyp: ein **Knoten** in einem Baum. Jeder Knoten hat genau einen Elternknoten oder liegt auf oberster Ebene. Daraus ergeben sich die beliebige Verschachtelung, die Pfadanzeige, die umgekehrte Sicht und das Verschieben samt Inhalt von selbst.

### 5.2 Arten und Klassen

Jeder Knoten hat eine **Art** (`kind`). Arten sind vom Nutzer erweiterbar. Jede Art gehört zu einer von fünf fest im Code verankerten **Klassen**, damit die Logik weiß, womit sie es zu tun hat:

| Klasse | Bedeutung | Mitgelieferte Arten |
|---|---|---|
| `place` | Ort, an dem etwas steht | Raum |
| `furniture` | Möbel oder Ablage | Regal, Schrank |
| `container` | beweglicher Behälter | Kiste, Tasche |
| `group` | Sammelbezeichnung für Inhalt | Gruppe |
| `item` | einzelnes Ding | Ding |

Der Nutzer kann eigene Arten anlegen (etwa "Schublade" in der Klasse `furniture` oder "Koffer" in `container`), umbenennen und mit einem Symbol versehen. Eine Art legt außerdem fest, ob ihre Knoten üblicherweise eine Nummer bekommen (bei Kiste und Tasche: ja).

Die Suche lässt sich nach Art und nach Klasse filtern ("nur Behälter", "nur Dinge", "nur Kisten").

Es gibt **keine harten Regeln**, was worin liegen darf, außer dem Verbot von Kreisen. Eine Tasche darf in einer Kiste liegen, ein Regal in einem Regal. Offensichtlich Ungewöhnliches (ein Raum innerhalb eines Dings) erzeugt höchstens einen Hinweis.

Bekommt ein Knoten der Klasse `item` einen Unterpunkt, wird er automatisch zur Gruppe. Das ist der Weg, "Bastelsachen" später zu verfeinern.

### 5.3 Nummern

- Ein Knoten kann eine Nummer tragen (positive ganze Zahl). Nummern sind im ganzen Inventar eindeutig.
- Beim Anlegen eines Knotens, dessen Art Nummern vorsieht, wird die kleinste freie Nummer vorgeschlagen. Der Nutzer kann sie überschreiben.
- Die Nummer bleibt beim Verschieben und Umbenennen erhalten. Sie ist das, was außen auf der Kiste steht.
- Eine Eingabe wie `14` oder `#14` in der Suche springt direkt zu diesem Knoten.

### 5.4 Angaben pro Knoten

Pflicht sind nur Name und Art. Alles andere ist freiwillig.

| Angabe | Schlüssel | Hinweis |
|---|---|---|
| Kennung | (Schlüssel im `nodes`-Objekt) | kurz, zufällig, dauerhaft, z. B. `n4k2q9` |
| Name | `name` | |
| Art | `kind` | Verweis auf eine Art |
| Elternknoten | `parent` | fehlt = oberste Ebene |
| Nummer | `number` | siehe 5.3 |
| Weitere Namen | `aliases` | "auch bekannt als", wird mitdurchsucht |
| Schlagwörter | `tags` | frei vergebbar |
| Notiz | `note` | mehrzeilig |
| Besitzer | `owner` | Verweis auf eine Person, vererbt sich (5.5) |
| Menge, Einheit | `quantity`, `unit` | für Verbrauchsmaterial |
| Mindestbestand | `min_quantity` | löst Nachkauf-Hinweis aus |
| Zustand | `condition` | siehe 5.6 |
| Entnahme | `checkout` | siehe 5.7 |
| Eigene Felder | `fields` | Werte zu Felddefinitionen (5.8) |
| Wartung | `maintenance` | siehe 5.9 |
| Anhänge | `attachments` | reserviert, siehe Abschnitt 14 |
| Zeitstempel | `created`, `modified`, `verified` | `verified` = zuletzt bei Inventur bestätigt |

### 5.5 Personen und Besitz

Im Inventar gibt es eine Liste von Personen (Name, wahlweise verknüpft mit einer `person`-Entität von Home Assistant). Ein Knoten kann einen Besitzer haben. **Der Besitz vererbt sich nach unten:** Wird die Werkstatt einer Person zugeordnet, gilt alles darin als ihres, solange weiter unten nichts anderes eingetragen ist. Die Oberfläche zeigt den wirksamen Besitzer und kennzeichnet, ob er geerbt oder direkt gesetzt ist. Die Suche filtert nach dem wirksamen Besitzer.

### 5.6 Zustand

Genau ein Wert pro Knoten:

- `ok` (Standard)
- `missing` – vermisst, etwa bei einer Inventur nicht gefunden
- `defective` – defekt
- `to_sell` – zu verkaufen
- `to_give_away` – zu verschenken
- `disposed` – entsorgt oder weggegeben. Solche Knoten gelten als archiviert: Sie erscheinen nicht in der normalen Suche und Zählung, lassen sich aber über einen Filter anzeigen.

### 5.7 Entnahme: ausgeliehen und ausgelagert

Ein Ding hat einen **Stammplatz** (seinen Platz im Baum). Ist es vorübergehend woanders, wird das als Entnahme vermerkt, ohne den Stammplatz zu verlieren. Zurücklegen ist dann ein einziger Schritt.

Zwei Arten:

- `lent` – ausgeliehen an jemanden (freier Text, z. B. "Nachbar Huber")
- `out` – entnommen, in Gebrauch oder ausgelagert (freier Text, wo es gerade ist, z. B. "hängt am Christbaum", "beim Reifenhändler")

Dazu: seit wann, wahlweise bis wann, wahlweise eine Notiz. Die Suche zeigt weiterhin den Stammplatz und zusätzlich deutlich den Hinweis "ausgeliehen an … seit …". Eine Entnahme kann auch für einen ganzen Behälter gelten und betrifft dann sichtbar dessen Inhalt.

### 5.8 Eigene Felder

Der Nutzer kann Felder definieren. Eine Felddefinition hat:

- Name, Typ (Text, mehrzeiliger Text, Zahl, Datum, Ja/Nein, Auswahl aus Liste, Link), bei Zahl wahlweise eine Einheit, bei Auswahl die Optionen
- **Geltungsbereich:** entweder **global** (für alle Knoten) oder **lokal** (für einen bestimmten Knoten und alles darunter). Beispiel lokal: Feld "Körnung" nur im Teilbaum "Schleifmittel".
- wahlweise eine Einschränkung auf bestimmte Arten oder Klassen (z. B. nur für Dinge)
- bei Datumsfeldern wahlweise eine Erinnerung "x Tage vorher"
- eine Gruppenüberschrift für die Anzeige

Werte von Feldern, die nach einem Verschieben nicht mehr gelten, werden **nicht gelöscht**, sondern ausgegraut als "nicht mehr zugeordnet" angezeigt.

Die von Homebox bekannten Angaben werden nicht fest eingebaut, sondern als **mitgelieferte Felddefinitionen** über denselben Mechanismus umgesetzt. Sie lassen sich ausblenden:

- Gruppe "Haltbarkeit": Ablaufdatum (Datum, Erinnerung 30 Tage vorher)
- Gruppe "Kauf und Garantie": Kaufdatum, Preis, Händler, Garantie bis (Datum, Erinnerung 30 Tage vorher)
- Gruppe "Gerät": Hersteller, Modell, Seriennummer, Link zur Anleitung

### 5.9 Wartung

Pro Knoten beliebig viele Wartungsaufgaben: Titel, wahlweise Intervall (Wert und Einheit: Tage, Wochen, Monate, Jahre), nächste Fälligkeit, Notiz und ein Protokoll der Erledigungen (Datum, Notiz). "Erledigt" trägt einen Protokolleintrag ein und berechnet bei gesetztem Intervall die nächste Fälligkeit.

### 5.10 Listen (Packlisten und Sets)

Eine Liste ist eine benannte Sammlung quer zum Baum, etwa "Campingausrüstung" oder "Skitag". Einträge sind entweder Verweise auf Knoten (mit wahlweise Menge und Notiz) oder freier Text für Dinge außerhalb des Inventars ("Wasserkanister füllen"). Jede Liste hat einen Abhak-Zustand, der sich zurücksetzen lässt. Die Ansicht einer Liste kann nach Lagerort gruppiert werden, damit man beim Zusammensuchen Raum für Raum vorgeht.

### 5.11 Vorlagen

Eine Vorlage ist eine Voreinstellung für neue Knoten: Art, Schlagwörter, Besitzer, Feldwerte und wahlweise vorgegebene Unterpunkte. Beispiel: "Werkzeugkoffer" legt einen Behälter mit drei Gruppen an.

### 5.12 Synonyme

Zusätzlich zu den weiteren Namen pro Knoten gibt es eine globale Liste von Synonymgruppen (z. B. Tacker, Hefter, Klammermaschine). Die Suche erweitert Suchbegriffe um die Mitglieder ihrer Gruppe.

### 5.13 Systemknoten

Zwei Knoten existieren immer und lassen sich weder löschen noch verschieben:

- **Unsortiert:** Ablage für Dinge, die noch keinen Platz haben.
- **Papierkorb:** Gelöschte Knoten landen samt Inhalt hier und werden nach 30 Tagen endgültig entfernt. Wiederherstellen legt sie an den alten Platz zurück, sofern es ihn noch gibt, sonst nach "Unsortiert". Inhalte des Papierkorbs erscheinen weder in Suche noch in Zählungen.

### 5.14 Regeln, die immer gelten

Diese Invarianten prüft der Kern bei jeder Änderung und beim Laden:

1. Kein Knoten ist sein eigener Vorfahre.
2. Jeder `parent`-Verweis zeigt auf einen vorhandenen Knoten.
3. Nummern sind eindeutig.
4. Jede Art, Person und Felddefinition, auf die verwiesen wird, existiert. Löschen einer Art ist nur möglich, wenn sie unbenutzt ist oder ein Ersatz angegeben wird. Löschen einer Person entfernt die Zuordnung.
5. Beim endgültigen Löschen eines Knotens verschwinden Verweise darauf aus Listen und lokalen Felddefinitionen. Die Oberfläche warnt vorher.
6. Systemknoten bleiben erhalten.

---

## 6. Datenablage

### 6.1 Dateien

Alles liegt in einem eigenen, leicht auffindbaren Ordner im Konfigurationsverzeichnis, bewusst **nicht** im versteckten `.storage`:

```
/config/ordnungstracker/
  inventar.json        Das Inventar. Die einzige Quelle der Wahrheit.
  benutzer.json        Pro HA-Benutzer: Favoriten, zuletzt angesehen, Ansichtsvorlieben.
  verlauf.jsonl        Änderungsprotokoll, eine Zeile pro Änderung.
  zustand.json         Interner Merker (z. B. welche Erinnerungen schon gemeldet wurden).
  sicherungen/         Automatische Sicherungskopien von inventar.json.
  anhaenge/            Reserviert für später (Abschnitt 14).
```

Der Ordner liegt im Konfigurationsverzeichnis und ist damit automatisch Teil der Home-Assistant-Backups.

### 6.2 Format von inventar.json

Knoten werden **flach** in einem Objekt abgelegt und verweisen über `parent` aufeinander. Begründung: Verschieben ändert dann genau eine Zeile, Verweise aus Listen bleiben stabil, und die Datei lässt sich mit jedem Werkzeug verarbeiten. Eine verschachtelte, gut lesbare Darstellung liefert der Export (Abschnitt 8.10).

Schlüssel sind englisch (wie der Code), Inhalte in der Sprache des Nutzers. Geschrieben wird mit zwei Leerzeichen Einrückung, Umlaute unverändert, stabile Reihenfolge der Schlüssel, und nur Angaben, die vom Standard abweichen, damit die Datei lesbar bleibt.

Beispiel (gekürzt):

```json
{
  "schema_version": 1,
  "meta": { "created": "2026-10-10T08:00:00+02:00", "modified": "2026-10-10T09:12:44+02:00" },
  "kinds": [
    { "id": "raum",   "name": "Raum",   "class": "place",     "icon": "mdi:door" },
    { "id": "regal",  "name": "Regal",  "class": "furniture", "icon": "mdi:bookshelf" },
    { "id": "kiste",  "name": "Kiste",  "class": "container", "icon": "mdi:package-variant", "numbered": true },
    { "id": "gruppe", "name": "Gruppe", "class": "group",     "icon": "mdi:shape" },
    { "id": "ding",   "name": "Ding",   "class": "item",      "icon": "mdi:circle-small" }
  ],
  "persons": [ { "id": "p1", "name": "Papa", "ha_person": "person.papa" } ],
  "fields": [
    { "id": "expiry", "name": "Ablaufdatum", "type": "date", "group": "Haltbarkeit",
      "scope": { "type": "global" }, "remind_days_before": 30, "builtin": true }
  ],
  "synonyms": [ ["tacker", "hefter", "klammermaschine"] ],
  "templates": [],
  "lists": [],
  "nodes": {
    "r7m1x3": { "name": "Keller", "kind": "raum" },
    "g2b8t5": { "name": "Regal B", "kind": "regal", "parent": "r7m1x3" },
    "n4k2q9": { "name": "Basteln", "kind": "kiste", "parent": "g2b8t5", "number": 14 },
    "d9w3e1": { "name": "Bastelsachen", "kind": "gruppe", "parent": "n4k2q9" },
    "x5c7v2": { "name": "Heißklebepistole", "kind": "ding", "parent": "d9w3e1",
                "aliases": ["Klebepistole"],
                "checkout": { "type": "lent", "to": "Nachbar Huber", "since": "2026-10-01" } }
  }
}
```

Das Format wird in `docs/DATENFORMAT.md` auf Deutsch vollständig beschrieben. Zusätzlich liegt ein JSON-Schema im Repository, gegen das die Tests alle Beispieldateien prüfen.

### 6.3 Laden, Speichern, Sicherheit der Daten

Die Daten sind das Wertvollste an diesem Projekt. Deshalb gilt:

- **Atomar schreiben:** in eine temporäre Datei im selben Ordner, dann ersetzen. Nie die bestehende Datei direkt überschreiben.
- **Kein blockierender Dateizugriff im Event-Loop** von Home Assistant.
- **Gebündelt speichern:** Änderungen werden kurz gesammelt (etwa eine Sekunde) und dann geschrieben. Beim Beenden von Home Assistant wird sofort geschrieben.
- **Eine Änderung nach der anderen:** Alle schreibenden Operationen laufen durch eine gemeinsame Sperre.
- **Sicherungskopien:** Vor dem ersten Schreiben nach dem Start und danach höchstens einmal pro Stunde wird die bisherige Datei nach `sicherungen/` kopiert. Aufbewahrt werden die letzten 20 Kopien sowie je eine pro Tag für die letzten 30 Tage.
- **Prüfen beim Laden:** Ist die Datei ungültig (kaputtes JSON oder verletzte Regeln aus 5.14), startet die Integration **nicht** mit leerem Inventar und überschreibt nichts. Sie meldet stattdessen über einen Reparaturhinweis in Home Assistant auf Deutsch, was falsch ist und in welchem Knoten, und nennt die letzte gültige Sicherung.
- **Bearbeiten von Hand ist erlaubt.** Die Integration erkennt, wenn die Datei außerhalb verändert wurde. Gibt es keine ungespeicherten eigenen Änderungen, lädt sie neu. Gibt es welche, überschreibt sie die fremde Änderung nicht, sondern legt den eigenen Stand als Konfliktdatei daneben und meldet das. Zusätzlich gibt es einen Dienst zum Neuladen.
- **Versionierung:** `schema_version` und eine Kette von Migrationen. Vor jeder Migration wird eine Sicherung angelegt. Eine Datei mit neuerer Version als die Integration wird nicht angefasst.

### 6.4 Änderungsprotokoll

Jede Änderung wird als eine Zeile in `verlauf.jsonl` festgehalten: Zeitpunkt, HA-Benutzer, Art der Aktion, betroffener Knoten mit Name, bei Verschieben alter und neuer Pfad, bei Bearbeiten die geänderten Angaben. Das Protokoll ist in der Oberfläche einsehbar (pro Knoten und gesamt) und wird ab einer sinnvollen Größe rotiert.

Ein allgemeines Rückgängig ist nicht Teil des Auftrags (Abschnitt 14). Baue die Änderungen im Kern aber als klar abgegrenzte Operationen, sodass es später ergänzt werden kann.

---

## 7. Suche

Die Suche ist die wichtigste Funktion und läuft im Kern.

### 7.1 Was durchsucht wird

Name, weitere Namen, Schlagwörter, Notiz, Nummer, Werte eigener Felder, bei Entnahmen der Text "an wen / wo".

### 7.2 Wie verglichen wird

- Groß- und Kleinschreibung egal.
- Umlaute und ß tolerant: "heissklebe", "heißklebe" und "heisklebe" finden dasselbe; "tur" findet "Tür".
- Mehrere Wörter müssen alle vorkommen, in beliebiger Reihenfolge und auch verteilt über Name und Pfad ("schrauben keller" findet Schrauben, die im Keller liegen).
- Wortanfänge zählen ("heißkl" findet die Heißklebepistole), ebenso Wortbestandteile in zusammengesetzten Wörtern ("pistole").
- Tippfehlertoleranz bei Wörtern ab vier Buchstaben.
- Erweiterung um Synonyme (5.12).

### 7.3 Reihenfolge der Treffer

Exakter Name vor Namensanfang vor Wortbestandteil vor weiteren Namen und Schlagwörtern vor Notiz und Feldern vor unscharfen Treffern. Bei Gleichstand: Dinge und Gruppen vor Behältern, dann kürzerer Pfad.

### 7.4 Filter

Kombinierbar: Art, Klasse, "innerhalb von" (ein Knoten, also Raum, Regal oder Kiste), wirksamer Besitzer, Schlagwort, Zustand, "ist entnommen", "hat Nummer", "ohne Inhalt", "lange nicht bestätigt". Archivierte Knoten nur auf Wunsch.

### 7.5 Ergebnis

Jeder Treffer enthält den Knoten, seinen vollständigen Pfad, den wirksamen Besitzer, Hinweise (entnommen, vermisst, unter Mindestbestand, läuft ab) und die Stelle, an der er getroffen hat.

### 7.6 Leistung

Ziel: Antwort in unter 50 ms bei 5.000 Knoten auf einem Raspberry Pi 5. Ein Test mit künstlich erzeugten 5.000 Knoten sichert das ab (mit großzügiger Schranke, damit er auf langsamen Testrechnern nicht zufällig fehlschlägt). Ein Suchindex im Speicher, der bei Änderungen gezielt aktualisiert wird, ist erwünscht.

---

## 8. Funktionen

### 8.1 Stöbern

Jeder Knoten hat eine Seite: Pfad zum Antippen oben, darunter die Angaben, dann der Inhalt, gruppiert (Orte und Behälter zuerst, nach Nummer und Name sortiert, dann Gruppen und Dinge nach Name). Bei Behältern steht die Anzahl direkter und gesamter Inhalte dabei.

### 8.2 Anlegen und Bearbeiten

- Neuer Knoten direkt aus der Seite des Elternknotens. Pflicht ist nur der Name. Die Art wird sinnvoll vorgeschlagen (in einem Raum eher Regal oder Kiste, in einer Kiste eher Ding).
- Bearbeiten aller Angaben in einem Dialog, der selten gebrauchte Angaben eingeklappt hält.
- Anlegen aus einer Vorlage.

### 8.3 Schnellerfassung

Ein großes Textfeld auf der Seite eines Knotens, eine Zeile pro Ding:

- Vorangestellte Menge wird erkannt: `3x Batterien AA`, `2 Rollen Klebeband`.
- Eingerückte Zeilen werden Unterpunkte der vorigen, weniger eingerückten Zeile.
- Schalter "Kommas trennen", damit auch Diktiertes wie "Schere, Kleber, Buntpapier" funktioniert.
- Vor dem Speichern eine Vorschau dessen, was angelegt wird.

### 8.4 Verschieben

- Ziel über Suche oder Stöbern wählen, auch per Eingabe einer Kistennummer.
- Mehrfachauswahl: mehrere Dinge auf einmal verschieben.
- Der Inhalt wandert immer mit.
- Die zuletzt verwendeten Ziele werden angeboten.

### 8.5 Löschen

Mit Rückfrage, die nennt, wie viele Unterpunkte betroffen sind, und zwei Möglichkeiten anbietet: samt Inhalt in den Papierkorb, oder nur den Knoten entfernen und den Inhalt eine Ebene nach oben schieben.

### 8.6 Entnehmen und Zurücklegen

Zwei schnelle Aktionen auf jeder Knotenseite: "Ausleihen an …" und "Entnehmen / auslagern". Zurücklegen ist ein Tipp. Eine Übersicht zeigt alles, was gerade nicht an seinem Platz ist, sortiert nach Dauer.

### 8.7 Menge und Mindestbestand

Plus- und Minus-Knopf für die Menge direkt in der Liste. Fällt die Menge unter den Mindestbestand, erscheint der Knoten unter "Nachkaufen". Wahlweise wird er automatisch in eine vom Nutzer gewählte To-do-Liste von Home Assistant eingetragen (ohne Doppelte).

### 8.8 Fälliges

Eine gemeinsame Ansicht "Fällig" mit fünf Rubriken:

- läuft bald ab oder ist abgelaufen (alle Datumsfelder mit Erinnerung, also auch Garantie)
- Rückgabe überfällig, sowie Ausgeliehenes ohne Datum, das länger als eine einstellbare Zeit weg ist (Standard 30 Tage)
- unter Mindestbestand
- Wartung fällig
- vermisst

### 8.9 Inventur

Für einen gewählten Knoten (typisch eine Kiste): Der Inhalt wird als Abhakliste gezeigt. Pro Eintrag: vorhanden, fehlt, gehört woanders hin (öffnet Verschieben). Gefundenes, das noch nicht erfasst ist, lässt sich sofort ergänzen. Am Ende: Bestätigte erhalten das Datum der Prüfung, Fehlende den Zustand "vermisst". Eine begonnene Inventur bleibt erhalten, wenn man die Ansicht verlässt.

Dazu passend der Filter "lange nicht bestätigt" als Hilfe beim Ausmisten.

### 8.10 Export, Import und Drucken

- **Export der Daten:** Herunterladen von `inventar.json`.
- **Import:** Hochladen einer zuvor exportierten Datei ersetzt das Inventar nach Prüfung und deutlicher Rückfrage. Davor wird eine Sicherung angelegt.
- **Lesbarer Export:** das ganze Inventar oder ein Teilbaum als verschachtelte Liste in Markdown.
- **Druckansichten** als eigenständige, für den Druck gestaltete HTML-Seite, die der Browser druckt:
  - Gesamtliste als Baum
  - Liste aller Behälter mit Nummer und Ort
  - Inhaltsblatt für einen Behälter: Nummer und Name groß, darunter der Inhalt
  - Packliste zum Abhaken

Die Druckseiten dürfen nicht ohne Anmeldung erreichbar sein. Lege sie also nicht im öffentlichen `www`-Ordner ab, sondern liefere sie über eine geschützte Ansicht mit zeitlich begrenzter, signierter Adresse aus (siehe Abschnitt 15).

Etiketten in festen Formaten und QR-Codes gehören nicht zu diesem Auftrag (Abschnitt 14).

### 8.11 Übersicht

Eine Startseite mit: großem Suchfeld, Zahl der Behälter und Dinge, Kacheln für Unsortiert, Entnommen, Fällig und Nachkaufen (jeweils mit Anzahl), Favoriten, zuletzt angesehen, leere Behälter, nächste freie Nummer. Wenn Preise gepflegt sind: Gesamtwert und Wert pro Raum.

### 8.12 Favoriten und Verlauf pro Benutzer

Jeder HA-Benutzer hat eigene Favoriten und eine eigene Liste zuletzt angesehener Knoten.

### 8.13 Einstellungen

Verwaltung von Arten, Personen, Felddefinitionen, Synonymen, Vorlagen; Ziel-To-do-Liste für Nachkäufe; Schwellen für Erinnerungen; Papierkorb; Änderungsprotokoll; Export und Import; Sicherungen ansehen und wiederherstellen. Wahlweise: Löschen und Einstellungen nur für Administratoren.

### 8.14 Beispieldaten

Solange das Inventar leer ist, bietet die Oberfläche an, einen kleinen Beispielhaushalt zu laden (etwa 60 Knoten, der alle Funktionen zeigt), und ihn später mit einem Tipp wieder zu entfernen. Das dient dem Ausprobieren und zugleich den Tests.

---

## 9. Schnittstellen zu Home Assistant

### 9.1 Einrichtung

Config Flow, genau eine Instanz, keine Pflichtangaben. Optionen (Options Flow oder in der eigenen Einstellungsseite): Ziel-To-do-Liste, Schwellen, Seitenleisten-Eintrag ein/aus, Berechtigungen.

### 9.2 Seitenleiste und Karte

- Eintrag "Ordnung" in der Seitenleiste, der die vollständige Oberfläche öffnet.
- Eine Dashboard-Karte `custom:ordnungstracker-card` mit einstellbarer Betriebsart: nur Suche, Suche mit Kacheln, oder Inhalt eines bestimmten Knotens. Mit grafischem Karteneditor.
- Die Integration liefert die JavaScript-Datei selbst aus und meldet sie bei Home Assistant an, damit der Nutzer keine Ressource von Hand eintragen muss.

### 9.3 WebSocket-API

Die Oberfläche spricht ausschließlich über eigene WebSocket-Befehle mit dem Server. Dazu gehört ein Abo, über das alle geöffneten Geräte Änderungen sofort mitbekommen. Jeder schreibende Befehl vermerkt den aufrufenden HA-Benutzer im Protokoll. Die Befehle werden in `docs/API.md` beschrieben.

### 9.4 Dienste

Für Automationen und Skripte, mit Antwortdaten wo sinnvoll: suchen, Knoten lesen, anlegen, ändern, verschieben, löschen, entnehmen, zurücklegen, Menge ändern, Nachkäufe in To-do-Liste übertragen, neu laden, Sicherung anlegen, exportieren. Vollständig mit deutschen und englischen Beschreibungen.

### 9.5 Entitäten

Sensoren mit Anzahl als Zustand und einer begrenzten Liste der betroffenen Einträge als Attribut:

- Dinge gesamt, Behälter gesamt, leere Behälter
- Unsortiert
- Entnommen, davon überfällig
- Unter Mindestbestand
- Läuft bald ab
- Wartung fällig
- Vermisst

Dazu ein Kalender mit allen Terminen (Ablauf, Garantieende, Rückgabe, Wartung).

Achte auf die Größenbeschränkung für Attribute und halte die Listen kurz.

### 9.6 Ereignisse

Wenn ein Eintrag neu fällig wird, feuert die Integration einmalig ein Ereignis mit Rubrik und Knoten. So kann der Nutzer eigene Benachrichtigungen bauen. Was schon gemeldet wurde, überlebt einen Neustart. Das README enthält zwei fertige Beispiel-Automationen.

### 9.7 Sprachabfrage (nur lesend)

Zwei Fragen über Assist auf Deutsch:

- "Wo ist / wo sind / wo finde ich {Ding}?" → bester Treffer mit Pfad, bei mehreren die ersten drei, bei Entnahme der Hinweis dazu.
- "Was ist in Kiste {Nummer}?" und "Was ist in {Name}?" → Inhalt, bei langen Listen gekürzt mit Anzahl.

Die Antworten nutzen dieselbe Suche wie die Oberfläche. Schreibende Sprachbefehle gehören nicht zum Auftrag.

### 9.8 Diagnose

Diagnosedaten zum Herunterladen, die Zahlen und Struktur enthalten, aber keine Namen und Inhalte.

---

## 10. Oberfläche

### 10.1 Grundsätze

Diese Punkte stammen aus Erfahrungen des Auftraggebers mit früheren Projekten und sind verbindlich:

- **Zuerst das Handy.** Alles muss mit dem Daumen bedienbar sein. Am PC nutzt die Oberfläche die Breite sinnvoll (Baum links, Inhalt rechts).
- **Anlegen und Ändern muss leicht gehen.** Wenige Pflichtangaben, sinnvolle Vorschläge, kein Formular mit zwanzig Feldern.
- **Nichts verschwindet überraschend.** Wer etwas anlegt oder bearbeitet, soll den Zusammenhang weiter sehen. Nach dem Speichern landet man dort, wo man war.
- **Antippen öffnet, lange drücken ist die Abkürzung.** Lange drücken auf einen Eintrag startet die Mehrfachauswahl. Wo eine Aktion durch Halten ausgelöst wird, braucht es keine zusätzliche Rückfrage.
- **Rückfragen nur, wo etwas verloren gehen kann.**
- **Sieht aus wie Home Assistant.** Farben, Schrift und Abstände kommen aus den Design-Variablen von Home Assistant, damit helle und dunkle Themen funktionieren.
- **Der Pfad ist immer sichtbar** und antippbar.
- **Leere Zustände erklären sich.** Eine leere Kiste zeigt, wie man etwas hineinlegt.

### 10.2 Ansichten

Übersicht, Stöbern (Knotenseite), Suche mit Filter-Chips, Bearbeiten-Dialog, Verschieben-Dialog, Schnellerfassung, Entnommen, Fällig, Nachkaufen, Listen, Inventur, Einstellungen.

### 10.3 Technik

- TypeScript, Lit, ein Bündel als einzelne Datei. Der Bau läuft in der CI und lokal, das Ergebnis liegt im Repository unter `custom_components/ordnungstracker/frontend/`.
- **Keine internen Bausteine der HA-Oberfläche verwenden**, die nicht als stabil dokumentiert sind (viele `ha-…`-Elemente sind es nicht und brechen bei Updates). Eigene schlichte Elemente bauen. Ausnahme: Symbole über `ha-icon`.
- Lange Listen flüssig halten (bei Bedarf virtuelles Scrollen).
- Suche beim Tippen mit kurzer Verzögerung, ohne Flackern.
- Navigation innerhalb der Oberfläche mit funktionierender Zurück-Taste des Handys.
- Texte über Sprachdateien (Deutsch, Englisch).
- Bedienbar mit Tastatur, sinnvolle Beschriftungen für Screenreader.

---

## 11. Qualität

- **Python:** Version passend zur aktuellen stabilen Home-Assistant-Version. Durchgehend Typangaben. `ruff` für Stil und Format, `mypy` (im Kern streng).
- **Tests Kern:** `pytest`, Abdeckung mindestens 90 %. Besonders gründlich: Regeln aus 5.14, Verschieben und Löschen mit Verweisen, Vererbung von Besitz und Feldern, Suche (jede Regel aus Abschnitt 7 mit eigenem Test, inklusive deutscher Sonderfälle), Fälligkeiten an Datumsgrenzen, Laden kaputter Dateien, Migrationen, Konflikt bei fremder Änderung, atomares Schreiben.
- **Tests HA-Schicht:** mit dem üblichen Testgerüst für eigene Integrationen (`pytest-homeassistant-custom-component`): Einrichtung, WebSocket-Befehle, Dienste, Sensoren, Ereignisse, Verhalten bei ungültiger Datei.
- **Tests Oberfläche:** Komponententests für die Logik-nahen Teile (Schnellerfassungs-Parser, Zustandsverwaltung, Navigation).
- **CI mit GitHub Actions:** Lint, Typprüfung, Tests, Bau der Oberfläche samt Prüfung, dass das eingecheckte Bündel aktuell ist, `hassfest` und die HACS-Validierung.
- **Fehlermeldungen** an den Nutzer auf Deutsch, konkret und mit Handlungshinweis.
- **Kein Datenverlust durch Abstürze:** siehe 6.3. Das wird getestet, nicht nur behauptet.

---

## 12. Repository

```
custom_components/ordnungstracker/
  __init__.py  manifest.json  config_flow.py  const.py
  websocket_api.py  services.py  services.yaml
  sensor.py  calendar.py  intent.py  diagnostics.py  repairs.py
  strings.json  translations/de.json  translations/en.json
  core/            reines Python: model, validation, store, migrations,
                   tree, search, fields, reminders, quickadd, export
  frontend/        gebautes Bündel
frontend/          Quelltext der Oberfläche (TypeScript)
tests/             core/ und ha/
docs/              PFLICHTENHEFT.md  ARCHITEKTUR.md  DATENFORMAT.md
                   API.md  ENTSCHEIDUNGEN.md  ROADMAP.md  PRUEFLISTEN.md
custom_sentences/  Beispiel-Sätze für Assist, falls nötig (siehe 15)
beispiele/         Beispielinventar
.github/workflows/
CLAUDE.md  README.md  CHANGELOG.md  LICENSE  hacs.json
```

- **Domain:** `ordnungstracker`. Anzeigename: "Ordnungs-Tracker".
- **`CLAUDE.md`:** kurze Arbeitsanweisung für künftige Sitzungen: Verweis auf dieses Dokument, Aufbau, Befehle für Tests und Bau, Konventionen, aktueller Stand der Phasen. Halte sie aktuell.
- **`README.md`** auf Deutsch: was es ist, Installation über HACS als eigenes Repository, Einrichtung, erste Schritte, Sicherung und Wiederherstellung, Bearbeiten der Datei von Hand, Beispiel-Automationen.
- **Lizenz:** MIT, sofern der Auftraggeber nichts anderes wünscht.
- **Versionen:** semantisch, `manifest.json` und `CHANGELOG.md` pro Phase aktualisieren. Bereite einen Release-Ablauf vor, den der Auftraggeber in GitHub von Hand auslösen kann.

---

## 13. Phasen

Jede Phase: planen, umsetzen, testen, selbst gegen dieses Dokument prüfen, Dokumentation nachziehen, Pull Request mit deutscher Zusammenfassung und Prüfliste für den Auftraggeber (auch in `docs/PRUEFLISTEN.md`).

### Phase 0 – Grundlage

- Aktuelle HA-Entwicklerdokumentation zu den Punkten aus Abschnitt 15 lesen, Ergebnisse in `docs/ENTSCHEIDUNGEN.md`.
- Gerüst des Repositories, CI, `CLAUDE.md`, leere Integration, die sich installieren und einrichten lässt.
- `docs/ARCHITEKTUR.md` und `docs/DATENFORMAT.md` (Entwurf) samt JSON-Schema.

*Fertig, wenn:* CI grün, Integration lässt sich in einer Testinstanz einrichten.

### Phase 1 – Kern

Datenmodell, Regeln, Baumoperationen, Systemknoten, Papierkorb, Nummern, Vererbung von Besitz, Felder mit Geltungsbereich, Entnahme, Zustand, Menge, Wartung, Listen, Vorlagen, Synonyme, Fälligkeiten, Suche, Schnellerfassungs-Parser, Laden/Speichern/Sicherungen/Migration/Konflikterkennung, Protokoll, Exporte (Markdown, HTML für Druck), Beispielinventar.

Der gesamte Kern entsteht hier, auch für Funktionen, deren Oberfläche erst später kommt. So wird das Datenformat einmal durchdacht und muss später nicht umgebaut werden.

*Fertig, wenn:* Abdeckung ≥ 90 %, Leistungstest der Suche besteht, Datenformat-Dokument ist vollständig.

### Phase 2 – Home-Assistant-Schicht

Anbindung des Kerns, WebSocket-API mit Abo, Dienste, Sensoren, Kalender, Ereignisse, Reparaturhinweise, Diagnose, geschützte Auslieferung von Export- und Druckseiten, Auslieferung der Oberflächen-Datei.

*Fertig, wenn:* Alles ist über Dienste bedienbar und getestet. Der Auftraggeber kann über die Entwicklerwerkzeuge von Home Assistant suchen und Knoten anlegen.

### Phase 3 – Oberfläche, Grundfunktionen

Seitenleisten-Panel und Karte: Übersicht, Stöbern, Suche mit Filtern, Anlegen, Bearbeiten, Verschieben (auch mehrfach), Löschen und Papierkorb, Schnellerfassung, Nummern, Unsortiert, Favoriten und zuletzt angesehen, Verwaltung von Arten und Personen, Export und Import, Beispieldaten.

*Fertig, wenn:* Der Auftraggeber kann seinen Haushalt vollständig am Handy erfassen und alles wiederfinden. Ab hier ist das System alltagstauglich.

### Phase 4 – Erweiterungen A

Eigene Felder samt Editor und mitgelieferten Feldern, Entnehmen und Zurücklegen, Menge und Mindestbestand mit To-do-Anbindung, Zustand, Ansichten Fällig, Entnommen und Nachkaufen, Wartung, Synonyme, Wert in der Übersicht.

### Phase 5 – Erweiterungen B

Listen und Sets, Inventur, Vorlagen, Druckansichten, Änderungsprotokoll in der Oberfläche, Sicherungen ansehen und wiederherstellen, Sprachabfrage, Berechtigungen.

### Phase 6 – Abschluss

Durchgehende Prüfung gegen dieses Dokument (jede Funktion aus Abschnitt 8 und 9 abhaken), README und Dokumentation vollständig, `docs/ROADMAP.md` mit den zurückgestellten Punkten, Version 1.0.0.

---

## 14. Zurückgestellt und gestrichen

**Zurückgestellt** (nicht bauen, aber nicht verbauen):

| Punkt | Was jetzt schon vorzusehen ist |
|---|---|
| Dokumente und Fotos anhängen | `attachments` pro Knoten im Format reserviert, Ordner `anhaenge/` angelegt. Kein Hochladen, keine Anzeige. |
| Schreibende Sprachbefehle | Sprachabfrage so aufbauen, dass weitere Absichten ergänzbar sind. |
| Etiketten und QR-Codes | Jeder Knoten ist über eine stabile Adresse in der Oberfläche direkt aufrufbar (wird später Ziel des QR-Codes). |
| Allgemeines Rückgängig | Änderungen als abgegrenzte Operationen mit Protokoll. |
| NFC-Tags an Kisten | wie QR: stabile Adresse pro Knoten. |
| Fotoerkennung von Kisteninhalt | nichts. |

**Gestrichen:** getrennte Inventare pro Benutzer, Strichcode-Abruf, CSV-Import.

---

## 15. Vor dem Bauen zu prüfen

Bei diesen Punkten hat sich Home Assistant in der Vergangenheit geändert oder es gibt mehrere Wege. Prüfe den aktuellen Stand in der Entwicklerdokumentation, bevor du dich festlegst, und notiere das Ergebnis:

1. Registrierung eines eigenen Panels in der Seitenleiste aus einer Integration heraus.
2. Auslieferung statischer Dateien und Anmeldung der Karten-Datei als Ressource, ohne dass der Nutzer etwas von Hand eintragen muss.
3. Zeitlich begrenzte, signierte Adressen für geschützte Ansichten (für Export und Druck) und deren Verhalten in der Companion-App.
4. Datei-Herunterladen und -Hochladen aus der Oberfläche heraus, auch in der Companion-App.
5. Eigene Absichten für Assist: Kann eine eigene Integration deutsche Sätze selbst mitbringen, oder muss der Nutzer eine Datei nach `custom_sentences` kopieren? Wähle den Weg mit dem geringsten Aufwand für den Nutzer und beschreibe ihn im README.
6. Aktueller Stand von Config Flow mit einer einzigen Instanz, Laufzeitdaten am Config-Eintrag, Reparaturhinweisen, Diagnose.
7. Anbindung an To-do-Listen (Eintrag hinzufügen, vorhandene lesen).
8. Anforderungen von HACS an ein eigenes Repository und die niedrigste unterstützte HA-Version, die du in `hacs.json` und im README angibst.
9. Größenbeschränkungen für Attribute und empfohlene Muster für Sensoren, die Listen tragen.

Wenn etwas davon nicht so geht wie hier angenommen, wähle die nächstbeste Lösung, die das jeweilige Ziel erhält, und halte die Abweichung fest.
