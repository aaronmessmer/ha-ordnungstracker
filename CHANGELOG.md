# Änderungen

Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionen nach [Semantic Versioning](https://semver.org/lang/de/).

## [0.3.0] – Phase 2: Home-Assistant-Schicht

### Hinzugefügt
- Anbindung des Kerns: Laden beim Start **ohne** Überschreiben einer ungültigen Datei (Reparaturhinweis mit Fundstellen und letzter gültiger Sicherung, späterer automatischer Neuversuch), Schreiben beim Beenden, regelmäßige Prüfung auf Änderungen von Hand (alle 30 s), stündliche Pflege (Papierkorb, Zahlen, Fälligkeiten).
- WebSocket-API `ordnungstracker/…` mit Abo für Änderungen (alle Geräte sehen Änderungen sofort), Benutzer im Änderungsprotokoll, Fehlercodes mit deutschem Text.
- Dienste: suchen, Eintrag lesen, anlegen, ändern, verschieben, löschen, entnehmen, zurücklegen, Menge ändern, Nachkäufe in To-do-Liste übertragen, neu laden, Sicherung anlegen, exportieren – mit Antwortdaten; Einträge lassen sich über Kennung **oder Nummer** (`#14`) ansprechen.
- Sensoren (Dinge, Behälter, leere Behälter, Unsortiert, Entnommen, Unter Mindestbestand, Läuft bald ab, Wartung fällig, Vermisst) mit höchstens 10 Einträgen als Attribut; Kalender mit Ablauf, Garantie, Rückgabe und Wartung.
- Ereignis `ordnungstracker_due` einmalig, wenn ein Eintrag neu fällig wird (Merker überlebt Neustarts).
- Reparaturhinweise (ungültige Datei, neuere Version, von Hand ungültig geändert, Konfliktdatei, Speichern fehlgeschlagen), Diagnose ohne Namen und Inhalte, Optionen (To-do-Liste, Seitenleiste).
- Geschützte Export- und Druckansichten mit zeitlich begrenzter signierter Adresse; Auslieferung und Anmeldung des Oberflächen-Bündels (sobald es existiert).
- **Langzeit-Ausleihe:** Die Erinnerung „Ausgeliehenes ohne Datum länger als 30 Tage“ lässt sich pro Ausleihe aus- und wieder einschalten (`no_reminder`).

## [0.2.0] – Phase 1: Kern

### Hinzugefügt
- Kern (`core/`, reines Python ohne Home Assistant): Datenmodell mit Knoten, Arten, Klassen, Personen, Feldern, Entnahme, Zustand, Menge, Wartung, Listen, Vorlagen, Synonymen.
- Alle Regeln aus Pflichtenheft 5.14, geprüft beim Laden und nach jeder Änderung (mit Zurückrollen).
- Baumoperationen: anlegen, ändern, verschieben (auch mehrfach), löschen (Papierkorb, „Inhalt hochschieben“), wiederherstellen, endgültig löschen mit Aufräumen aller Verweise; Systemknoten „Unsortiert“ und „Papierkorb“; Nummern; Vererbung von Besitz; Felder mit Geltungsbereich.
- Suche mit Suchindex im Speicher: Faltung von Groß-/Kleinschreibung, ß und Umlauten, mehrere Begriffe, Wortanfänge und -teile, Tippfehlertoleranz, Synonyme, Rangfolge, Filter, Hinweise.
- Fälligkeiten in fünf Rubriken, Entnommen-Übersicht, Kalendertermine, Ereignis-Merker, Kennzahlen der Übersicht.
- Schnellerfassungs-Parser, Markdown-Export, HTML-Druckansichten (Baum, Behälterliste, Inhaltsblatt, Packliste).
- Speicher: atomares gebündeltes Schreiben, Sperre, Sicherungen mit Aufbewahrung, Prüfung beim Laden ohne Überschreiben, Erkennung von Änderungen von Hand (Neuladen oder Konfliktdatei), Import/Export, Wiederherstellen, Migrationskette, Änderungsprotokoll mit Rotation, Dateien für Benutzerdaten und Merker.
- Beispielhaushalt (67 Knoten) zum Laden und Entfernen; `beispiele/beispiel-haushalt.json`.
- Dokumentation: `docs/DATENFORMAT.md` (vollständig), `docs/inventar.schema.json`, `docs/ARCHITEKTUR.md`, `docs/API.md` (Fehlercodes), `docs/ROADMAP.md`.
- Art-Vorschlag für neue Knoten, zuletzt verwendete Verschiebe-Ziele je Benutzer, anonyme Diagnose-Zusammenfassung.
- Über 330 Tests, Abdeckung des Kerns ≈ 97 %, Leistungstest der Suche (5.000 Knoten).

## [0.1.0] – Phase 0: Grundlage

### Hinzugefügt
- Gerüst des Repositories, CI (Lint, Typprüfung, Tests, Oberfläche, hassfest, HACS), Release-Ablauf zum manuellen Auslösen.
- Leere Integration, die sich einrichten (genau eine Instanz) und wieder entfernen lässt.
- `docs/PFLICHTENHEFT.md` (verschoben), `docs/ENTSCHEIDUNGEN.md` mit den Ergebnissen der Plattform-Recherche, `docs/ARCHITEKTUR.md`, `docs/DATENFORMAT.md` (Entwurf), JSON-Schema.
