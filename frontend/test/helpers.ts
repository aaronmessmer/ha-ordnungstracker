import { makeT } from "../src/lib/i18n";

export const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

/** Minimaler Kontext für Komponententests; `api` ist ein Attrappen-Objekt. */
export function fakeCtx(api: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  const toasts: string[] = [];
  const ctx = {
    api,
    t: makeT("de"),
    lang: "de",
    revision: 1,
    catalog: { persons: [{ id: "p1", name: "Papa" }], kinds: [], fields: [], synonyms: [], settings: { lent_days: 30, stale_days: 365, trash_days: 30 } },
    status: { todo_entity: null, todo_auto: false },
    go: (route: unknown) => ((ctx as { went?: unknown }).went = route),
    toast: (m: string) => toasts.push(m),
    confirm: async () => true,
    reloadCatalog: async () => undefined,
    hass: { language: "de" },
    ...extra,
  };
  return { ctx: ctx as never, toasts, raw: ctx as Record<string, unknown> };
}
