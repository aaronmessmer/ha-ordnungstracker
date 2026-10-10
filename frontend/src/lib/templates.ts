import type { TemplateNode } from "../types";

/**
 * Unterpunkte einer Vorlage aus Text: eine Zeile je Punkt, Einrücken (zwei Leerzeichen oder Tabulator)
 * macht einen Punkt zum Unterpunkt des vorigen. `3x Schrauben` setzt die Menge. Die oberste Ebene
 * bekommt `topKind`, tiefere Ebenen `deepKind`.
 */
export function parseTemplateLines(text: string, topKind: string, deepKind: string): TemplateNode[] {
  const roots: TemplateNode[] = [];
  const stack: { depth: number; node: TemplateNode }[] = [];
  for (const raw of text.split("\n")) {
    if (!raw.trim()) continue;
    const indent = /^[ \t]*/.exec(raw)?.[0] ?? "";
    let depth = Math.floor([...indent].reduce((n, c) => n + (c === "\t" ? 2 : 1), 0) / 2);
    const body = raw.trim();
    const match = /^(\d+(?:[.,]\d+)?)\s*[x×]\s+(.+)$/i.exec(body);
    const node: TemplateNode = { name: match ? match[2].trim() : body, kind: "" };
    if (match) node.quantity = Number(match[1].replace(",", "."));
    // Höchstens eine Ebene tiefer als der vorige Punkt
    while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
    depth = stack.length ? stack[stack.length - 1].depth + 1 : 0;
    node.kind = depth === 0 ? topKind : deepKind;
    if (stack.length) {
      const parent = stack[stack.length - 1].node;
      (parent.children ??= []).push(node);
    } else roots.push(node);
    stack.push({ depth, node });
  }
  return roots;
}

/** Umkehrung für die Anzeige: Unterpunkte als eingerückter Text. */
export function templateLines(nodes: TemplateNode[] | undefined, depth = 0): string[] {
  return (nodes ?? []).flatMap((n) => [
    `${"  ".repeat(depth)}${n.quantity !== undefined && n.quantity !== 1 ? `${n.quantity}x ` : ""}${n.name}`,
    ...templateLines(n.children, depth + 1),
  ]);
}

/** Anzahl aller Unterpunkte (auch verschachtelter). */
export function countTemplateNodes(nodes: TemplateNode[] | undefined): number {
  return (nodes ?? []).reduce((n, c) => n + 1 + countTemplateNodes(c.children), 0);
}
