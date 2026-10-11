# Sätze für Assist

Die Sätze der Sprachabfrage liegen **in der Integration**: `custom_components/ordnungstracker/sentences/de.yaml`.
Beim Start kopiert der Ordnungs-Tracker sie nach `<config>/custom_sentences/de/ordnungstracker.yaml`, weil Assist eigene Sätze nur dort lädt
(und weil HACS nur den Ordner `custom_components/` installiert). Diese Datei wird bei Aktualisierungen überschrieben –
eigene Sätze gehören in eine andere Datei im selben Ordner.

Dieser Ordner im Repository ist nur ein Hinweis.
