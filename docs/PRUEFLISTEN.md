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

## Phase 2 – Home-Assistant-Schicht (Version 0.3.0)

**Einrichtung und Daten**
- [ ] Nach dem Update (HACS, Neustart) ist die Integration geladen; im Protokoll steht **keine** Meldung zum Ordnungs-Tracker. Im Ordner `ordnungstracker` neben `configuration.yaml` liegen `inventar.json`, `sicherungen/`, `anhaenge/`.
- [ ] *Konfigurieren* der Integration zeigt **To-do-Liste** und **Seitenleiste**; Speichern lädt die Integration ohne Fehler neu.
- [ ] Unter *Geräte & Dienste → Ordnungs-Tracker* gibt es ein Gerät „Ordnungs-Tracker“ mit 9 Sensoren und dem Kalender „Termine“ (alle zunächst 0 / leer).

**Dienste (Entwicklerwerkzeuge → Aktionen)**
- [ ] `ordnungstracker.create_node` mit `name: Keller` → Antwort mit `id`. Dann `name: Regal B`, `parent: <id>` und `name: Basteln`, `kind: kiste`, `number: auto`, `parent: <id des Regals>` → Antwort `number: 1`.
- [ ] `ordnungstracker.search` mit `query: bastel` → Treffer mit Pfad „Keller › Regal B › Basteln“. `query: "#1"` springt zur Kiste.
- [ ] `ordnungstracker.create_node` mit `name: Schere`, `parent: "#1"`; `ordnungstracker.move_node` (`nodes: ["Schere-Kennung"]`, `target: Keller-Kennung`) – danach zeigt die Suche den neuen Pfad.
- [ ] `check_out` für die Schere (`type: lent`, `to: Nachbar Huber`) – die Suche nennt „ausgeliehen an Nachbar Huber“; `return_node` – der Hinweis verschwindet.
- [ ] `delete_node` für die Schere – sie ist aus der Suche verschwunden (Papierkorb).
- [ ] Fehlerfall: `create_node` mit `number: 1` → verständliche **deutsche** Fehlermeldung („Die Nummer 1 ist schon an … vergeben“).
- [ ] `create_backup` → Datei in `sicherungen/`. `export` mit `format: markdown` → lesbare Liste in der Antwort.

**Sensoren, Kalender, Ereignis**
- [ ] `create_node` mit `quantity: 1`, `min_quantity: 3` → der Sensor *Unter Mindestbestand* springt sofort auf 1, das Attribut `items` nennt den Eintrag.
- [ ] Ein Entwicklerwerkzeug-Abonnement auf das Ereignis `ordnungstracker_due` (*Ereignisse → Auf Ereignisse lauschen*) zeigt dasselbe Ereignis **genau einmal**; nach einem Neustart von Home Assistant kommt es nicht noch einmal.
- [ ] `ordnungstracker.load_sample` (in ein leeres Inventar): Der Kalender „Termine“ zeigt Ablauf, Garantie, Rückgabe und Wartung; die Sensoren zeigen z. B. 8 Behälter, 1 vermisst, 2 unter Mindestbestand. `ordnungstracker.remove_sample` räumt wieder auf.

**Datei von Hand**
- [ ] `inventar.json` im Datei-Editor öffnen, einen Eintrag ergänzen, speichern. Nach spätestens 30 Sekunden ist er per `search` auffindbar.
- [ ] Absichtlich einen Fehler einbauen (z. B. Komma löschen). Nach spätestens 30 Sekunden erscheint unter *Reparaturen* ein deutscher Hinweis; Änderungen werden jetzt **nicht** gespeichert. Fehler beheben → Hinweis verschwindet von selbst.
- [ ] Ohne Neustart den Fehler im Dateiinhalt lassen und Home Assistant neu starten: Die Integration startet nicht mit leerem Inventar, der Hinweis nennt die Fundstelle **und die letzte gültige Sicherung**, `inventar.json` ist unverändert.

**Diagnose und Druck**
- [ ] *Geräte & Dienste → Ordnungs-Tracker → ⋮ → Diagnose herunterladen*: Die Datei enthält Zahlen, aber **keine Namen**.
- [ ] Druckansichten und Export liefern erst in Phase 3/5 Knöpfe. Technisch kann man sie jetzt schon in einer angemeldeten Browsersitzung öffnen: `https://<dein-ha>/api/ordnungstracker/print/containers` (nur wenn du angemeldet bist; sonst „401“) – bitte **auch in der Companion-App** probieren (öffnet sich die Seite? lässt sie sich drucken/teilen?). Das Ergebnis bitte zurückmelden, davon hängt die Gestaltung der Druckknöpfe ab (ENTSCHEIDUNGEN A3/A4).

## Phase 3 – Oberfläche (Version 0.4.0)

Nach dem Update (HACS, Home Assistant neu starten, Browser-Cache leeren bzw. Companion-App neu laden) erscheint **Ordnung** in der Seitenleiste.

**Am Handy (Companion-App)**
- [ ] Seitenleiste öffnen → **Ordnung**; die Übersicht erscheint. Leeres Inventar: **Beispieldaten laden** antippen → Kacheln, Favoriten-Bereich und „zuletzt angesehen“ füllen sich; in den Einstellungen lassen sie sich wieder entfernen.
- [ ] Raum anlegen (Plus), Regal darin, Kiste darin (Nummer wird vorgeschlagen, nächste freie). Das Tastaturfeld verdeckt nie den Speichern-Knopf.
- [ ] **Schnell erfassen** in der Kiste: drei Zeilen wie `3x Batterien AA`, Vorschau erscheint, übernehmen → drei Einträge, Menge 3 erkannt.
- [ ] Suche: `bastel` findet mit Pfad; `14` bzw. `#14` springt zur Kiste.
- [ ] **Langes Drücken** auf einen Eintrag startet die Mehrfachauswahl; mehrere wählen → Verschieben → Ziel per Suche → Eintrag ist dort, Meldung erscheint oben.
- [ ] Löschen einer Kiste mit Inhalt: Auswahl „mit Inhalt“ / „Inhalt hochschieben“; danach im **Papierkorb** wiederherstellen.
- [ ] **Zurück-Taste** des Handys geht Schritt für Schritt zurück (Eintrag → Raum → Übersicht); nichts bleibt „halb offen“.
- [ ] Favorit (Stern) setzen → erscheint in der Übersicht; Seite einer Kiste öffnen → erscheint bei „zuletzt angesehen“.
- [ ] Einstellungen: Art anlegen/ändern, Person anlegen (mit Home-Assistant-Person verknüpfbar), Art löschen, die in Gebrauch ist → verständlicher Hinweis mit Ersatz-Auswahl.
- [ ] **Export** (JSON/Markdown): Datei wird geladen oder – falls die App Downloads blockiert – „In die Zwischenablage“ funktioniert. **Bitte das Ergebnis zurückmelden** (ENTSCHEIDUNGEN D9).
- [ ] Zweites Gerät/zweiter Browser offen: Eine Änderung am ersten erscheint ohne Neuladen.

**Am Rechner / Aussehen**
- [ ] Breites Fenster: Baum links, Inhalt rechts. Schmales Fenster: eine Spalte.
- [ ] Dunkles Design und ein anderes Farbthema in Home Assistant: Lesbarkeit und Kontrast passen.
- [ ] Mit Tab/Shift+Tab/Enter/Esc bedienbar (Dialoge fangen den Fokus, Esc schließt, Fokus kehrt zurück).
- [ ] Profil auf Englisch umstellen: Oberfläche ist englisch (Server-Fehlertexte bleiben deutsch, ENTSCHEIDUNGEN D7).
- [ ] Dashboard → Karte hinzufügen → **Ordnungs-Tracker**: drei Modi (Suche, Kacheln, Eintrag) im Karteneditor; Tippen öffnet die Seitenleiste an der richtigen Stelle.
- [ ] Adresse `/ordnungstracker/nr/14` direkt im Browser öffnen → Kiste 14 (Lesezeichen/QR-Tauglichkeit).
- [ ] **Abnahmeprüfung:** Einen Teil des echten Haushalts allein am Handy erfassen (ein Raum, zwei Regale, fünf Kisten) und alles per Suche wiederfinden. Was hakt, bitte notieren.

## Phase 4 – Erweiterungen A (Version 0.5.0)

Nach dem Update Browser-Cache leeren bzw. Companion-App neu laden (sonst läuft noch die alte Oberfläche).

**Entnehmen und Menge**
- [ ] Bei einem Ding: **Ausleihen an …** → „Nachbar Huber“, speichern. Die Seite zeigt „ausgeliehen an … seit heute“, **Zurücklegen** steht bereit. Zurücklegen → Hinweis verschwindet.
- [ ] **Entnehmen / auslagern** mit „zurück bis“ in der Vergangenheit → unter **Fällig → Rückgabe überfällig** und in **Entnommen** mit „überfällig“.
- [ ] Langzeit-Ausleihe: bei der Ausleihe „nicht an die Rückgabe erinnern“ ankreuzen (oder auf der Seite **Erinnerung aus**). Der Eintrag erscheint nicht unter „Rückgabe überfällig“; **Erinnerung an** schaltet es zurück.
- [ ] Ding mit Menge und Mindestbestand: **−** und **+** in der Liste (Daumen!) – Zahl springt sofort, unter dem Minimum erscheint er unter **Nachkaufen**.
- [ ] Nachkaufen → **Auf die To-do-Liste**: nur sichtbar, wenn in den Optionen eine Liste gewählt ist; ein zweiter Tipp legt nichts doppelt an.
- [ ] Optionen der Integration: **Nachkäufe selbsttätig …** einschalten. Menge eines Dings unter den Mindestbestand senken → der Eintrag steht kurz danach auf der To-do-Liste (einmal).

**Wartung, Felder, Zustand**
- [ ] Bei einem Eintrag **Aufgabe** → „Filter wechseln“, alle 6 Monate, Termin gestern. Die Seite zeigt „überfällig“; **Erledigt** → Meldung, nächster Termin in 6 Monaten, „zuletzt heute“.
- [ ] Bearbeiten → **Eigene Angaben** (klappt auf, wenn schon Werte da sind): Ablaufdatum setzen → Eintrag erscheint (bei „30 Tage vorher“) unter **Fällig**. Datum am Handy: Der Datumswähler des Handys erscheint.
- [ ] Bearbeiten → Weitere Angaben → Zustand **defekt** → Hinweis „defekt“; **vermisst** → erscheint unter Fällig → Vermisst.
- [ ] Ein Feld ohne Geltung (z. B. Hersteller bei einer Kiste) erscheint gar nicht; ein Wert, der nach dem Verschieben nicht mehr gilt, bleibt ausgegraut „nicht mehr zugeordnet“.

**Einstellungen**
- [ ] **Felder → Neues Feld** „Körnung“ (Auswahl: 80, 120, 240), „Nur in diesem Eintrag und darunter“: Schleifmittel. Das Feld erscheint nur dort beim Bearbeiten.
- [ ] Mitgeliefertes Feld **Ausblenden**/**Einblenden**; ein eigenes Feld löschen warnt vor dem Verlust der Werte.
- [ ] **Synonyme:** „Tacker, Hefter, Klammermaschine“ → Suche nach „Hefter“ findet den Tacker.
- [ ] **Erinnerungen:** Schwellen ändern, speichern, danach lädt die Seite die neuen Werte.
- [ ] Obere Leiste scrollt am Handy waagerecht; beim Öffnen von `/ordnungstracker/restock` ist „Nachkaufen“ sichtbar.

## Text für den Pull Request (Phase 0 bis 4)

**Phase 0 – Grundlage.** Repository-Gerüst, CI (Lint, Typprüfung, Tests, Oberfläche, hassfest, HACS), Release-Ablauf zum manuellen Auslösen, leere Integration (Config Flow, genau eine Instanz, Deutsch/Englisch, Symbol),
`CLAUDE.md`, `docs/ENTSCHEIDUNGEN.md` mit den Ergebnissen der Plattform-Recherche (Abschnitt 15 des Pflichtenhefts), `docs/ARCHITEKTUR.md`, `docs/DATENFORMAT.md` (Entwurf) und JSON-Schema. Fertig, wenn: CI grün, Integration lässt sich in einer Testinstanz einrichten (getestet mit Home Assistant 2026.3.1 und 2026.10.0).

**Phase 1 – Kern.** Der gesamte Kern in reinem Python: Datenmodell, Regeln, Baumoperationen, Systemknoten, Papierkorb, Nummern, Vererbung von Besitz, Felder mit Geltungsbereich, Entnahme, Zustand, Menge, Wartung, Listen, Vorlagen, Synonyme, Fälligkeiten, Suche,
Schnellerfassungs-Parser, Laden/Speichern/Sicherungen/Migration/Konflikterkennung, Protokoll, Exporte (Markdown, HTML für den Druck), Beispielinventar. Fertig, wenn: Abdeckung ≥ 90 % (≈ 97 %), Leistungstest der Suche besteht (≈ 4–17 ms bei 5.000 Knoten), Datenformat-Dokument vollständig.

**Phase 2 – Home-Assistant-Schicht.** Anbindung des Kerns: sicheres Laden (ungültige Datei → Reparaturhinweis statt leerem Inventar), WebSocket-API mit Abo für Änderungen, Dienste mit Antwortdaten (Einträge auch per Nummer ansprechbar), 9 Sensoren und ein Kalender,
Ereignis „neu fällig“ (einmalig, überlebt Neustarts), Reparaturhinweise, Diagnose ohne Inhalte, Optionen (To-do-Liste, Seitenleiste), geschützte Export-/Druckansichten mit signierter Adresse, Auslieferung des Oberflächen-Bündels (sobald vorhanden). Außerdem:
Langzeit-Ausleihe (Erinnerung pro Ausleihe abschaltbar). Fertig, wenn: alles über Dienste bedienbar und getestet (≈ 400 Tests gegen Home Assistant 2026.10.0 und 2026.3.1).

**Phase 3 – Oberfläche.** Seitenleiste „Ordnung“ und Dashboard-Karte (Lit/TypeScript, ein eingechecktes Bündel, keine internen `ha-*`-Elemente): Übersicht, Stöbern, Suche mit Filtern und Nummernsprung, Anlegen/Bearbeiten, Verschieben (auch mehrfach, langes Drücken), Papierkorb, Schnellerfassung mit Server-Vorschau, Unsortiert, Favoriten, Arten und Personen, Export/Import, Beispieldaten; Deutsch/Englisch, Zurück-Taste, Live-Aktualisierung. Fertig, wenn: Haushalt am Handy erfassbar und wiederfindbar (Abnahmeprüfung in der Prüfliste); Tests der Oberfläche und Vertragstest gegen die Schnittstelle grün, Bündel von der CI als aktuell bestätigt.

**Phase 4 – Erweiterungen A.** Entnehmen/Zurücklegen (auch Langzeit-Ausleihe) und Ansicht „Entnommen“, Menge mit Plus/Minus und Ansicht „Nachkaufen“ samt To-do-Übertragung (neu: wahlweise selbsttätig), „Fällig“ mit fünf Rubriken und Abkürzungen, Wartung, eigene Angaben und Zustand beim Bearbeiten, Felder-Editor, Synonyme, Schwellen in den Einstellungen. Fertig, wenn: alles in der Oberfläche bedienbar, Tests der Oberfläche (44) und der HA-Schicht (413) grün, Prüfliste Phase 4 abgearbeitet.
