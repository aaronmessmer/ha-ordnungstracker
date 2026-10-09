import type { KindClass, SearchFilters } from "../types";

/** Adressen der Oberfläche. Jeder Knoten hat eine stabile Adresse (später Ziel von QR-Codes/NFC). */
export type Route =
  | { page: "overview" }
  | { page: "node"; id: string | null }
  | { page: "number"; number: number }
  | { page: "search"; query: string; filters: SearchFilters }
  | { page: "trash" }
  | { page: "due" }
  | { page: "settings"; section: string };

export const BASE = "/ordnungstracker";
const CLASSES: KindClass[] = ["place", "furniture", "container", "group", "item"];

export function filtersToParams(filters: SearchFilters, params: URLSearchParams): void {
  if (filters.kinds?.length) params.set("kind", filters.kinds.join(","));
  if (filters.classes?.length) params.set("class", filters.classes.join(","));
  if (filters.within) params.set("within", filters.within);
  if (filters.owner) params.set("owner", filters.owner);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.condition) params.set("cond", filters.condition);
  if (filters.checked_out !== undefined) params.set("out", filters.checked_out ? "1" : "0");
  if (filters.has_number) params.set("num", "1");
  if (filters.empty) params.set("empty", "1");
  if (filters.stale) params.set("stale", "1");
  if (filters.include_archived) params.set("arch", "1");
}

export function paramsToFilters(params: URLSearchParams): SearchFilters {
  const f: SearchFilters = {};
  const kind = params.get("kind");
  if (kind) f.kinds = kind.split(",").filter(Boolean);
  const cls = params.get("class");
  if (cls) f.classes = cls.split(",").filter((c): c is KindClass => CLASSES.includes(c as KindClass));
  for (const [param, key] of [
    ["within", "within"],
    ["owner", "owner"],
    ["tag", "tag"],
    ["cond", "condition"],
  ] as const) {
    const v = params.get(param);
    if (v) f[key] = v;
  }
  if (params.get("out") === "1") f.checked_out = true;
  if (params.get("out") === "0") f.checked_out = false;
  if (params.get("num") === "1") f.has_number = true;
  if (params.get("empty") === "1") f.empty = true;
  if (params.get("stale") === "1") f.stale = true;
  if (params.get("arch") === "1") f.include_archived = true;
  return f;
}

export function routeToPath(route: Route): string {
  switch (route.page) {
    case "overview":
      return BASE;
    case "node":
      return route.id ? `${BASE}/node/${encodeURIComponent(route.id)}` : `${BASE}/node`;
    case "number":
      return `${BASE}/nr/${route.number}`;
    case "search": {
      const params = new URLSearchParams();
      if (route.query) params.set("q", route.query);
      filtersToParams(route.filters, params);
      const qs = params.toString();
      return `${BASE}/search${qs ? `?${qs}` : ""}`;
    }
    case "trash":
      return `${BASE}/trash`;
    case "due":
      return `${BASE}/due`;
    case "settings":
      return route.section ? `${BASE}/settings/${route.section}` : `${BASE}/settings`;
  }
}

/** Adresse (Pfad plus ggf. `?…`) → Seite; Unbekanntes führt zur Übersicht. */
export function parseRoute(url: string): Route {
  const [path, query = ""] = url.split("?", 2);
  const params = new URLSearchParams(query);
  const rest = path.startsWith(BASE) ? path.slice(BASE.length) : path;
  const parts = rest.split("/").filter(Boolean).map(decodeURIComponent);
  switch (parts[0]) {
    case "node":
      return { page: "node", id: parts[1] ?? null };
    case "nr": {
      const n = Number.parseInt(parts[1] ?? "", 10);
      return Number.isInteger(n) && n > 0 ? { page: "number", number: n } : { page: "overview" };
    }
    case "search":
      return { page: "search", query: params.get("q") ?? "", filters: paramsToFilters(params) };
    case "trash":
      return { page: "trash" };
    case "due":
      return { page: "due" };
    case "settings":
      return { page: "settings", section: parts[1] ?? "" };
    default:
      return { page: "overview" };
  }
}

/** Gleiche Seite? (für „nichts tun“ beim erneuten Antippen) */
export function sameRoute(a: Route, b: Route): boolean {
  return routeToPath(a) === routeToPath(b);
}

/** Verwaltet den Verlauf des Browsers; die Zurück-Taste des Handys geht über `popstate`. */
export class Navigator {
  private listeners = new Set<(r: Route) => void>();
  private handler = () => this.emit();

  constructor(
    private win: Pick<Window, "history" | "location" | "addEventListener" | "removeEventListener" | "dispatchEvent">,
  ) {}

  start(): void {
    this.win.addEventListener("popstate", this.handler);
    this.win.addEventListener("location-changed", this.handler);
  }

  stop(): void {
    this.win.removeEventListener("popstate", this.handler);
    this.win.removeEventListener("location-changed", this.handler);
  }

  current(): Route {
    return parseRoute(this.win.location.pathname + this.win.location.search);
  }

  navigate(route: Route, opts: { replace?: boolean } = {}): void {
    const path = routeToPath(route);
    if (path === this.win.location.pathname + this.win.location.search) return;
    if (opts.replace) this.win.history.replaceState(null, "", path);
    else this.win.history.pushState(null, "", path);
    this.win.dispatchEvent(new CustomEvent("location-changed"));
  }

  back(): void {
    this.win.history.back();
  }

  subscribe(cb: (r: Route) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(): void {
    const r = this.current();
    for (const cb of this.listeners) cb(r);
  }
}
