import type { Brief, Hint, Hit, KindClass } from "../types";
import { iconFor, pathText, quantityText } from "./format";

/** Eine Zeile in Listen: Inhalt eines Knotens, Treffer, Favorit … */
export interface Row {
  id: string;
  name: string;
  icon: string;
  number: number | null;
  subtitle: string;
  hints: Hint[];
  /** Anzahl direkter und gesamter Inhalte (nur bei Orten, Möbeln, Behältern, Gruppen). */
  counts: [number, number] | null;
  archived: boolean;
  class: KindClass;
  /** Menge für Plus/Minus (nur bei Dingen mit Menge). */
  stepper?: { quantity: number; unit: string };
}

export function rowFromBrief(b: Brief, extra = ""): Row {
  const hasStepper = b.quantity !== null && b.quantity !== undefined && b.class === "item";
  const parts = [b.kind_name, hasStepper ? "" : quantityText(b), extra].filter(Boolean);
  const hasContent = b.class !== "item";
  return {
    id: b.id,
    name: b.name,
    icon: iconFor(b),
    number: b.number,
    subtitle: parts.join(" · "),
    hints: b.hints,
    counts: hasContent ? [b.children, b.descendants] : null,
    archived: b.archived,
    class: b.class,
    ...(hasStepper ? { stepper: { quantity: b.quantity as number, unit: b.unit } } : {}),
  };
}

export function rowFromHit(h: Hit, kindName: string, icon: string): Row {
  return {
    id: h.id,
    name: h.name,
    icon: iconFor({ icon, class: h.class }),
    number: h.number,
    subtitle: [kindName, pathText(h.path, false)].filter(Boolean).join(" · "),
    hints: h.hints,
    counts: null,
    archived: h.archived,
    class: h.class,
  };
}
