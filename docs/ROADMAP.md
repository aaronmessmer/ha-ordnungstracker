# Fahrplan

## Phasen (Pflichtenheft 13)

| Phase | Inhalt | Stand |
|---|---|---|
| 0 | Grundlage: Gerüst, CI, leere Integration, Dokumentation | **fertig** |
| 1 | Kern: Datenmodell, Regeln, Suche, Speicher, Exporte, Beispielinventar | **fertig** |
| 2 | Home-Assistant-Schicht: WebSocket-API, Dienste, Sensoren, Kalender, Ereignisse, Reparaturen, Diagnose, Auslieferung | **fertig** |
| 3 | Oberfläche, Grundfunktionen (Panel und Karte) | **fertig** |
| 4 | Erweiterungen A: Felder, Entnahme, Menge/To-do, Zustand, Ansichten Fällig/Entnommen/Nachkaufen, Wartung, Synonyme, Wert | **fertig** |
| 5 | Erweiterungen B: Listen, Inventur, Vorlagen, Druck, Protokoll, Sicherungen, Sprachabfrage, Berechtigungen | **fertig** |
| 6 | Abschluss: Prüfung gegen das Pflichtenheft, Dokumentation, Version 1.0.0 | offen |

Der **Kern ist vollständig** (auch für Funktionen, deren Oberfläche erst später kommt), damit das Datenformat nicht mehr umgebaut werden muss.

## Zurückgestellt (Pflichtenheft 14) – nicht gebaut, aber vorbereitet

| Punkt | Schon vorgesehen |
|---|---|
| Dokumente und Fotos anhängen | `attachments` pro Knoten im Format reserviert (wird gelesen, geprüft und unverändert zurückgeschrieben); Ordner `anhaenge/` wird angelegt. Kein Hochladen, keine Anzeige. |
| Schreibende Sprachbefehle | Sprachabfrage (Phase 5) so aufbauen, dass weitere Absichten ergänzbar sind. |
| Englische Sprachabfrage | Satzdatei `sentences/en.yaml` nach demselben Muster (F3); die Antworttexte des Kerns müssten übersetzbar werden. |
| Vorlagen bearbeiten | Heute nur anlegen und löschen (F7); ein `template_update` im Kern plus Editor. |
| Etiketten und QR-Codes | Jeder Knoten bekommt in der Oberfläche eine stabile Adresse (Phase 3), später Ziel des QR-Codes. |
| Allgemeines Rückgängig | Änderungen sind abgegrenzte Operationen (`Change`) mit Protokoll inklusive alter Werte. |
| NFC-Tags an Kisten | wie QR: stabile Adresse pro Knoten. |
| Fotoerkennung von Kisteninhalt | nichts. |

**Gestrichen:** getrennte Inventare pro Benutzer, Strichcode-Abruf, CSV-Import.

## Mögliche spätere Ideen (nicht Teil des Auftrags)

* Suchindex auf mehrere Sprachen erweitern (Faltung ist derzeit auf Deutsch zugeschnitten).
* Papierkorb und Protokoll mit eigenen Aufbewahrungsfristen je Benutzer.
