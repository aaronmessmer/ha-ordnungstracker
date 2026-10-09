# Änderungen

Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionen nach [Semantic Versioning](https://semver.org/lang/de/).

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
