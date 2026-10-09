# Prüflisten

Kurze Listen zum Abarbeiten in **deinem** Home Assistant (Pflichtenheft 1). Alles, was sich automatisch prüfen lässt, ist durch Tests abgedeckt – hier steht nur, was nur dort prüfbar ist.

## Phase 0 – Grundlage (Version 0.1.0)

**Vorbereitung am Repository (einmalig, in GitHub):**
- [ ] Am Repository eine **Beschreibung** (ein Satz) und **Themen/Topics** eintragen (z. B. `home-assistant`, `hacs`, `inventory`). Die HACS-Prüfung verlangt beides.
- [ ] Unter *Actions* prüfen, dass die Workflows **CI** und **Validierung (hassfest und HACS)** grün sind. (hassfest und die HACS-Prüfung konnten in der Entwicklungsumgebung nicht laufen.)

**Installation und Einrichtung:**
- [ ] In HACS das Repository als *Benutzerdefiniertes Repository* (Kategorie Integration) hinzufügen und „Ordnungs-Tracker“ herunterladen.
- [ ] Home Assistant neu starten. Im Protokoll (*Einstellungen → System → Protokolle*) steht **keine** Meldung zum Ordnungs-Tracker.
- [ ] *Einstellungen → Geräte & Dienste → Integration hinzufügen → Ordnungs-Tracker*: Es erscheint ein Dialog „Ordnungs-Tracker einrichten“ **ohne Eingabefelder**; nach „Absenden“ ist die Integration eingerichtet.
- [ ] Die Integration ein zweites Mal hinzufügen: Es wird mit „bereits eingerichtet“ abgelehnt (bzw. sie wird gar nicht mehr angeboten).
- [ ] Das Symbol (blaue Kachel mit Kiste) erscheint bei der Integration.
- [ ] Integration löschen und wieder hinzufügen funktioniert; Home Assistant läuft danach ohne Fehler weiter.
- [ ] Die Oberfläche ist auf Deutsch (Dialogtexte), bei englischer Sprache auf Englisch.

## Phase 1 – Kern (Version 0.2.0)

Der Kern hat noch keine Oberfläche; geprüft wird, was du sehen kannst:

- [ ] Nach dem Update auf 0.2.0 (HACS, Neustart) läuft die Integration weiter ohne Fehler im Protokoll. (Es werden noch keine Daten angelegt – das kommt mit Phase 2.)
- [ ] `beispiele/beispiel-haushalt.json` in einem Editor öffnen: Die Datei ist lesbar (Räume, Regal B, Kiste 14 „Basteln“, Heißklebepistole an „Nachbar Huber“ ausgeliehen …) und der Aufbau passt zu `docs/DATENFORMAT.md`.
- [ ] `docs/DATENFORMAT.md` lesen: Fehlt dir eine Angabe, die du pro Ding festhalten möchtest? **Jetzt** ist der richtige Zeitpunkt, denn das Datenformat soll danach nicht mehr umgebaut werden.
- [ ] In `docs/ENTSCHEIDUNGEN.md` (Abschnitt B) die getroffenen Festlegungen überfliegen, besonders: Preis gilt für den Eintrag als Ganzes (B11), Nummern bleiben im Papierkorb reserviert (B14), „Inhalt hochschieben“ legt den Knoten selbst in den Papierkorb (B15), Ausgeliehenes ohne Datum gilt nach mehr als 30 Tagen als überfällig (B32).

## Text für den Pull Request (Phase 0 und 1)

**Phase 0 – Grundlage.** Repository-Gerüst, CI (Lint, Typprüfung, Tests, Oberfläche, hassfest, HACS), Release-Ablauf zum manuellen Auslösen, leere Integration (Config Flow, genau eine Instanz, Deutsch/Englisch, Symbol),
`CLAUDE.md`, `docs/ENTSCHEIDUNGEN.md` mit den Ergebnissen der Plattform-Recherche (Abschnitt 15 des Pflichtenhefts), `docs/ARCHITEKTUR.md`, `docs/DATENFORMAT.md` (Entwurf) und JSON-Schema. Fertig, wenn: CI grün, Integration lässt sich in einer Testinstanz einrichten (getestet mit Home Assistant 2026.3.1 und 2026.10.0).

**Phase 1 – Kern.** Der gesamte Kern in reinem Python: Datenmodell, Regeln, Baumoperationen, Systemknoten, Papierkorb, Nummern, Vererbung von Besitz, Felder mit Geltungsbereich, Entnahme, Zustand, Menge, Wartung, Listen, Vorlagen, Synonyme, Fälligkeiten, Suche,
Schnellerfassungs-Parser, Laden/Speichern/Sicherungen/Migration/Konflikterkennung, Protokoll, Exporte (Markdown, HTML für den Druck), Beispielinventar. Fertig, wenn: Abdeckung ≥ 90 % (≈ 97 %), Leistungstest der Suche besteht (≈ 4–17 ms bei 5.000 Knoten), Datenformat-Dokument vollständig.
