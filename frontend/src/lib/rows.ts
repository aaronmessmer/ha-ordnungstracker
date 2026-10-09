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
}

export function rowFromBrief(b: Brief, extra = ""): Row {
  const parts = [b.kind_name, quantityText(b), extra].filter(Boolean);
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
