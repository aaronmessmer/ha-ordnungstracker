# Schnittstellen

> **Stand: Phase 0.** Die WebSocket-Befehle und Dienste entstehen in **Phase 2** (Pflichtenheft 9.3, 9.4) und werden hier beschrieben, sobald sie existieren.
> Bis dahin gilt nur, was unten steht.

## Konventionen (verbindlich ab Phase 2)

* WebSocket-Befehle heißen `ordnungstracker/<aktion>`; jeder schreibende Befehl vermerkt den aufrufenden Benutzer im Änderungsprotokoll.
* Fehler: Der Kern wirft `InventoryError` (Unterklassen siehe `core/errors.py`). Die HA-Schicht gibt `code` (stabil, englisch) und die deutsche Meldung weiter.
* Änderungen laufen immer über `InventoryStore.async_mutate`, Lesezugriffe über `store.inventory` und `SearchIndex`.
