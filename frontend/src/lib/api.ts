import type {
  Brief,
  Catalog,
  ChangeEvent,
  Detail,
  DueItem,
  HomeAssistant,
  Kind,
  OverviewData,
  Person,
  QuickPreview,
  RootView,
  SearchFilters,
  SearchResult,
  Status,
  TrashEntry,
  UserData,
} from "../types";

/** Fehler des Servers: stabiler `code` und deutsche Meldung mit Handlungshinweis. */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const PREFIX = "ordnungstracker/";

/** Alle Befehle an den Server. Die Namen und Felder sind in docs/API.md beschrieben. */
export class Api {
  constructor(private hass: HomeAssistant) {}

  setHass(hass: HomeAssistant): void {
    this.hass = hass;
  }

  async call<T>(command: string, fields: Record<string, unknown> = {}): Promise<T> {
    try {
      return await this.hass.callWS<T>({ type: PREFIX + command, ...fields });
    } catch (err) {
      const e = err as { code?: string; message?: string };
      throw new ApiError(e?.code ?? "unknown", e?.message ?? String(err));
    }
  }

  status = () => this.call<Status>("status");
  overview = () => this.call<OverviewData>("overview");
  catalog = () => this.call<Catalog>("catalog");
  user = () => this.call<UserData>("user");
  due = () => this.call<{ categories: Record<string, DueItem[]>; counts: Record<string, number> }>("due");
  trash = () => this.call<TrashEntry[]>("trash");

  node(nodeId: string | null, opts: { track?: boolean; archived?: boolean } = {}) {
    return this.call<Detail | RootView>("node", {
      node_id: nodeId,
      track: opts.track ?? false,
      include_archived: opts.archived ?? false,
    });
  }

  byNumber = (number: number) => this.call<Detail>("by_number", { number });

  search(query: string, filters: SearchFilters = {}, limit = 100) {
    return this.call<SearchResult>("search", { query, filters, limit });
  }

  suggest = (parent: string | null) =>
    this.call<{ kinds: string[]; next_number: number }>("suggest", parent ? { parent } : {});

  create = (fields: Record<string, unknown>) => this.call<Brief>("create", fields);
  update = (nodeId: string, changes: Record<string, unknown>) =>
    this.call<Brief>("update", { node_id: nodeId, changes });
  move = (ids: string[], parent: string | null) => this.call<{ moved: string[] }>("move", { ids, parent });
  remove = (nodeId: string, mode: "trash" | "lift") =>
    this.call<{ id: string; descendants: number }>("delete", { node_id: nodeId, mode });
  restore = (nodeId: string) => this.call<{ id: string; parent: string | null }>("restore", { node_id: nodeId });
  purge = (nodeId: string) => this.call<{ removed: number }>("purge", { node_id: nodeId });
  emptyTrash = () => this.call<{ removed: number }>("trash_empty");

  favorite = (nodeId: string, value: boolean) => this.call<string[]>("favorite", { node_id: nodeId, value });
  addTarget = (nodeId: string) => this.call<string[]>("target_add", { node_id: nodeId });

  quickPreview = (text: string, splitCommas: boolean) =>
    this.call<QuickPreview>("quickadd_preview", { text, split_commas: splitCommas });
  quickApply = (parent: string, text: string, splitCommas: boolean) =>
    this.call<{ created: string[] }>("quickadd_apply", { parent, text, split_commas: splitCommas });

  kindAdd = (f: { name: string; class: string; icon?: string; numbered?: boolean }) =>
    this.call<Kind>("kind_add", f);
  kindUpdate = (kindId: string, changes: Record<string, unknown>) =>
    this.call<Kind>("kind_update", { kind_id: kindId, changes });
  kindDelete = (kindId: string, replacement?: string) =>
    this.call("kind_delete", replacement ? { kind_id: kindId, replacement } : { kind_id: kindId });
  personAdd = (name: string, haPerson?: string | null) =>
    this.call<Person>("person_add", haPerson ? { name, ha_person: haPerson } : { name });
  personUpdate = (personId: string, changes: Record<string, unknown>) =>
    this.call<Person>("person_update", { person_id: personId, changes });
  personDelete = (personId: string) => this.call<{ cleared: number }>("person_delete", { person_id: personId });

  exportData = (format: "json" | "markdown", nodeId?: string) =>
    this.call<{ filename: string; text: string }>("export", nodeId ? { format, node_id: nodeId } : { format });
  importText = (text: string) => this.call<{ nodes: number }>("import", { text });
  sampleLoad = () => this.call<{ created: number }>("sample_load");
  sampleRemove = () => this.call<{ removed: number }>("sample_remove");

  /** Abo: bei jeder Änderung (auch von anderen Geräten oder von Hand) wird `cb` aufgerufen. */
  subscribe(cb: (e: ChangeEvent) => void): Promise<() => void> {
    return this.hass.connection.subscribeMessage<ChangeEvent>(cb, { type: PREFIX + "subscribe" });
  }
}
