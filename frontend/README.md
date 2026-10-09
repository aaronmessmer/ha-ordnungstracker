# Oberfläche (Quelltext)

TypeScript mit [Lit](https://lit.dev), gebaut mit esbuild zu **einer** Datei:
`custom_components/ordnungstracker/frontend/ordnungstracker.js` (eingecheckt, damit HACS keinen Bauschritt braucht).

```bash
npm ci
npm run typecheck   # tsc
npm test            # vitest + happy-dom
npm run build       # schreibt das Bündel; danach mit einchecken (die CI prüft die Aktualität)
```

Aufbau: `src/lib` (Schnittstelle `api.ts`, Adressen `router.ts`, Auswahl, Hilfen), `src/components` (`ot-panel` = Seitenleiste, `ot-card` = Karte, Seiten und Bausteine), `src/locales` (`de.ts` ist maßgeblich, `en.ts` muss dieselben Schlüssel haben – ein Test prüft das und dass jeder benutzte Schlüssel existiert).
Regeln: nur Home-Assistant-Designvariablen (`--primary-color` …), keine internen `ha-*`-Elemente außer `ha-icon`, Bezeichner Englisch, sichtbare Texte nur über die Sprachdateien.
