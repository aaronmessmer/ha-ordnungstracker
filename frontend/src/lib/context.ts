import type { Catalog, HomeAssistant, Status } from "../types";
import type { Api } from "./api";
import type { Route, Navigator } from "./router";
import type { T } from "./i18n";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
}

/**
 * Alles, was die Seiten und Dialoge von der Hülle (`ordnungstracker-panel`) brauchen.
 * Bei jeder Änderung des Servers entsteht ein neues Objekt mit höherer `revision`;
 * Seiten laden dann ihre Daten neu.
 */
export interface AppContext {
  hass: HomeAssistant;
  api: Api;
  t: T;
  lang: string;
  nav: Navigator;
  catalog: Catalog | null;
  status: Status | null;
  narrow: boolean;
  revision: number;
  go(route: Route, opts?: { replace?: boolean }): void;
  toast(message: string, kind?: "info" | "error"): void;
  confirm(options: ConfirmOptions): Promise<boolean>;
  reloadCatalog(): Promise<void>;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
