// Baut die Oberfläche zu EINER Datei, die fertig im Repository liegt (kein Bauschritt bei der Installation über HACS).
import { build } from "esbuild";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  legalComments: "none",
  sourcemap: false,
  outfile: "../custom_components/ordnungstracker/frontend/ordnungstracker.js",
  banner: { js: `/* Ordnungs-Tracker ${pkg.version} – gebautes Bündel, Quelltext: frontend/ */` },
  define: { __OT_VERSION__: JSON.stringify(pkg.version) },
  logLevel: "info",
});
