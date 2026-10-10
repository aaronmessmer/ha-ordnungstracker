import type {
  Brief,
  Catalog,
  ChangeEvent,
  CheckoutRow,
  Detail,
  DueItem,
  FieldDef,
  FieldInfo,
  HomeAssistant,
  Kind,
  MaintenanceTask,
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

  checkouts = () => this.call<CheckoutRow[]>("checkouts");
  checkout = (nodeId: string, f: { checkout_type: "lent" | "out"; to: string; since?: string; until?: string; note?: string; no_reminder?: boolean }) =>
    this.call<Brief>("checkout", { node_id: nodeId, ...f });
  returnNode = (nodeId: string) => this.call<Brief>("return", { node_id: nodeId });
  checkoutReminder = (nodeId: string, enabled: boolean) => this.call<Brief>("checkout_reminder", { node_id: nodeId, enabled });

  quantityStep = (nodeId: string, delta: number) => this.call<Brief>("quantity", { node_id: nodeId, delta });
  quantitySet = (nodeId: string, quantity: number | null) => this.call<Brief>("quantity", { node_id: nodeId, quantity });
  fieldValue = (nodeId: string, field: string, value: unknown) =>
    this.call<FieldInfo[]>("field_value", { node_id: nodeId, field, value });

  maintenanceAdd = (nodeId: string, f: { title: string; interval?: { value: number; unit: string } | null; next_due?: string; note?: string }) =>
    this.call<MaintenanceTask>("maintenance_add", { node_id: nodeId, ...f });
  maintenanceUpdate = (nodeId: string, task: string, changes: Record<string, unknown>) =>
    this.call<MaintenanceTask>("maintenance_update", { node_id: nodeId, task, changes });
  maintenanceRemove = (nodeId: string, task: string) => this.call("maintenance_remove", { node_id: nodeId, task });
  maintenanceDone = (nodeId: string, task: string, note?: string) =>
    this.call<MaintenanceTask>("maintenance_done", { node_id: nodeId, task, ...(note ? { note } : {}) });

  fieldDefAdd = (f: Record<string, unknown>) => this.call<FieldDef>("field_def_add", f);
  fieldDefUpdate = (fieldId: string, changes: Record<string, unknown>) =>
    this.call<FieldDef>("field_def_update", { field_id: fieldId, changes });
  fieldDefDelete = (fieldId: string) => this.call("field_def_delete", { field_id: fieldId });
  synonyms = (groups: string[][]) => this.call<string[][]>("synonyms", { groups });
  settings = (settings: Record<string, number>) => this.call("settings", { settings });
  todoTransfer = () => this.call<{ entity_id: string; added: number; skipped: number }>("todo_transfer");

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
