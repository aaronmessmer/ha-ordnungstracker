import type { AppContext } from "./context";
import { errorMessage } from "./context";

export type PrintView = "tree" | "containers" | "sheet" | "packlist";

/**
 * Druckansicht öffnen (Pflichtenheft 8.10): Der Server gibt eine kurz gültige, signierte Adresse heraus,
 * die Seite öffnet sich in einem neuen Fenster und wird dort mit dem Browser gedruckt.
 */
export async function openPrint(ctx: AppContext, view: PrintView, params: { node?: string; list?: string } = {}): Promise<void> {
  try {
    const { url } = await ctx.api.printUrl(view, params);
    const win = window.open(url, "_blank", "noopener");
    if (!win) {
      // Pop-up-Sperre oder eingebettete App: im selben Fenster öffnen (Zurück-Taste führt wieder hierher).
      window.location.href = url;
    }
  } catch (err) {
    ctx.toast(errorMessage(err), "error");
  }
}

/** Darf der Benutzer löschen und Einstellungen ändern? (ohne Angabe: ja) */
export function canAdmin(ctx: AppContext): boolean {
  return ctx.status?.can_admin !== false;
}
