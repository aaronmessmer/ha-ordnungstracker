import type { Brief, FieldInfo, Hint, KindClass, PathPart } from "../types";

const CLASS_ICONS: Record<KindClass, string> = {
  place: "mdi:door",
  furniture: "mdi:bookshelf",
  container: "mdi:package-variant",
  group: "mdi:shape",
  item: "mdi:circle-small",
};

/** Symbol eines Eintrags: das der Art, sonst ein Standardsymbol der Klasse. */
export function iconFor(b: { icon: string; class: KindClass }): string {
  return b.icon || CLASS_ICONS[b.class];
}

/** Orte, Möbel und Behälter können Inhalt haben und werden zuerst angezeigt. */
export function isPlaceLike(cls: KindClass): boolean {
  return cls === "place" || cls === "furniture" || cls === "container";
}

/** „3 Stück“, „2×“ oder leer. */
export function quantityText(b: Pick<Brief, "quantity" | "unit">): string {
  if (b.quantity === null || b.quantity === undefined) return "";
  const n = Number.isInteger(b.quantity) ? String(b.quantity) : String(Math.round(b.quantity * 100) / 100);
  return b.unit ? `${n} ${b.unit}` : `${n}×`;
}

/** Heutiges Datum als `JJJJ-MM-TT` in der Ortszeit des Geräts. */
export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Tage von `from` bis `to` (beide `JJJJ-MM-TT`); negativ, wenn `to` früher liegt. */
export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00`).getTime();
  const b = new Date(`${to}T12:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export type Tone = "error" | "warning" | "info";

/** Farbe eines Hinweises (vermisst und abgelaufen sind Fehler, entnommen nur Information). */
export function hintTone(h: Hint): Tone {
  switch (h.code) {
    case "missing":
    case "expired":
    case "defective":
      return "error";
    case "below_min":
    case "expiring":
      return "warning";
    default:
      return "info";
  }
}

export function pathText(parts: PathPart[], withLast = true): string {
  const names = (withLast ? parts : parts.slice(0, -1)).map((p) => p.name);
  return names.join(" › ");
}

/** Datum `JJJJ-MM-TT` in der Sprache des Nutzers. */
export function formatDate(value: string, language: string): string {
  if (!value) return "";
  const d = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(language, { dateStyle: "medium" }).format(d);
}

export function fieldValueText(f: FieldInfo, language: string, yes: string, no: string): string {
  const v = f.value;
  if (v === null || v === undefined || v === "") return "";
  if (f.type === "bool") return v ? yes : no;
  if (f.type === "date") return formatDate(String(v), language);
  if (f.type === "number") return f.unit ? `${v} ${f.unit}` : String(v);
  return String(v);
}

/** Zahl aus einer Eingabe mit Komma oder Punkt; leer → null; ungültig → undefined. */
export function parseNumber(text: string): number | null | undefined {
  const s = text.trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/** Liste aus Eingabe mit Kommas oder Zeilenumbrüchen. */
export function parseList(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Eingabe `14` oder `#14` → Nummer, sonst null. */
export function asNumberQuery(text: string): number | null {
  const m = /^\s*#?\s*(\d+)\s*$/.exec(text);
  return m ? Number.parseInt(m[1], 10) : null;
}

/** Datei im Browser speichern (funktioniert auch, wo Downloads eingeschränkt sind, über Teilen/Zwischenablage als Rückfall). */
export function download(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
