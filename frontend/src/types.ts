/** Typen der Daten, die der Server (custom_components/ordnungstracker, docs/API.md) liefert. */

export type KindClass = "place" | "furniture" | "container" | "group" | "item";

export interface Hint {
  code: string;
  text: string;
}

export interface PathPart {
  id: string;
  name: string;
}

export interface Brief {
  id: string;
  name: string;
  kind: string;
  kind_name: string;
  class: KindClass;
  icon: string;
  number: number | null;
  quantity: number | null;
  unit: string;
  min_quantity: number | null;
  condition: string;
  checked_out: boolean;
  archived: boolean;
  hints: Hint[];
  children: number;
  descendants: number;
}

export interface Checkout {
  type: "lent" | "out";
  to: string;
  since: string;
  until?: string;
  note?: string;
  no_reminder?: boolean;
}

export interface FieldInfo {
  id: string;
  name: string;
  type: "text" | "multiline" | "number" | "date" | "bool" | "choice" | "link";
  group: string;
  unit: string;
  options: string[];
  remind_days_before: number | null;
  value: unknown;
  assigned: boolean;
}

export interface Detail extends Brief {
  parent: string | null;
  path: PathPart[];
  aliases: string[];
  tags: string[];
  note: string;
  owner: string | null;
  effective_owner: { id: string; name: string; inherited: boolean } | null;
  checkout: Checkout | null;
  effective_checkout: (Checkout & { source: string; inherited: boolean }) | null;
  fields: FieldInfo[];
  maintenance: unknown[];
  attachments: unknown[];
  created: string;
  modified: string;
  verified: string;
  trashed: { at: string; from?: string; by?: string } | null;
  in_trash: boolean;
  contents: Brief[];
  suggested_kinds: string[];
  disposed: boolean;
}

export interface RootView {
  id: null;
  contents: Brief[];
}

export interface Hit {
  id: string;
  name: string;
  kind: string;
  class: KindClass;
  number: number | null;
  path: PathPart[];
  owner: string | null;
  owner_inherited: boolean;
  hints: Hint[];
  matched_in: string;
  archived: boolean;
}

export interface SearchResult {
  total: number;
  number_hit: string | null;
  hits: Hit[];
}

export interface SearchFilters {
  kinds?: string[];
  classes?: KindClass[];
  within?: string;
  owner?: string;
  tag?: string;
  condition?: string;
  checked_out?: boolean;
  has_number?: boolean;
  empty?: boolean;
  stale?: boolean;
  include_archived?: boolean;
}

export interface Kind {
  id: string;
  name: string;
  class: KindClass;
  icon: string;
  numbered: boolean;
}

export interface Person {
  id: string;
  name: string;
  ha_person?: string;
}

export interface Catalog {
  kinds: Kind[];
  persons: Person[];
  fields: unknown[];
  synonyms: string[][];
  templates: unknown[];
  lists: { id: string; name: string; entries: number }[];
  settings: { lent_days: number; stale_days: number; trash_days: number };
  sample_loaded: boolean;
}

export interface Status {
  revision: number;
  nodes: number;
  unsaved_changes: boolean;
  writes_blocked: string | null;
  save_error: string | null;
  sample_loaded: boolean;
  inventory_empty: boolean;
  user_id: string | null;
  todo_entity: string | null;
}

export interface OverviewData {
  overview: {
    containers: number;
    items: number;
    empty_containers: Brief[];
    unsorted: number;
    checked_out: number;
    checked_out_overdue: number;
    due: Record<string, number>;
    next_free_number: number;
    total_value: number | null;
    value_per_place: Record<string, number>;
  };
  favorites: Brief[];
  recent: Brief[];
}

export interface DueItem {
  category: string;
  node_id: string;
  name: string;
  path: string;
  detail: string;
  due: string | null;
  days: number | null;
  overdue: boolean;
  key: string;
}

export interface TrashEntry extends Brief {
  trashed: { at: string; from?: string; by?: string } | null;
}

export interface UserData {
  favorites: string[];
  recent: string[];
  targets: Brief[];
  view: Record<string, unknown>;
}

export interface QuickEntry {
  name: string;
  quantity: number | null;
  unit: string;
  children: QuickEntry[];
}

export interface QuickPreview {
  entries: QuickEntry[];
  preview: string[];
  count: number;
}

export interface ChangeEvent {
  revision: number;
  actions: string[];
  nodes: string[] | null;
  reload: boolean;
}

/** Der Teil des `hass`-Objekts, den die Oberfläche braucht. */
export interface HomeAssistant {
  language: string;
  user?: { id: string; name: string; is_admin: boolean };
  states: Record<string, { state: string; attributes: { friendly_name?: string } }>;
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  connection: {
    subscribeMessage<T>(cb: (msg: T) => void, msg: Record<string, unknown>): Promise<() => void>;
  };
}
