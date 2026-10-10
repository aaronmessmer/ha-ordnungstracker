import { LitElement, css, html, nothing } from "lit";
import { Api } from "../lib/api";
import { errorMessage } from "../lib/context";
import { asNumberQuery, pathText } from "../lib/format";
import { makeT } from "../lib/i18n";
import { debounce } from "../lib/latest";
import { BASE, routeToPath } from "../lib/router";
import { rowFromBrief } from "../lib/rows";
import { baseStyles } from "../lib/styles";
import type { Detail, Hit, HomeAssistant, OverviewData, RootView } from "../types";

export interface CardConfig {
  type: string;
  mode?: "search" | "tiles" | "node";
  node?: string;
  title?: string;
}

/** Zur Oberfläche wechseln (gleiche Technik wie Home Assistant selbst). */
export function openPanel(path: string): void {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed"));
}

/** Dashboard-Karte `custom:ordnungstracker-card` (Pflichtenheft 9.2): nur Suche, Suche mit Kacheln oder Inhalt eines Knotens. */
export class OtCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _query: { state: true },
    _hits: { state: true },
    _overview: { state: true },
    _node: { state: true },
    _error: { state: true },
  };
  declare hass: HomeAssistant;
  declare _config: CardConfig;
  declare _query: string;
  declare _hits: Hit[];
  declare _overview: OverviewData | null;
  declare _node: Detail | RootView | null;
  declare _error: string;

  private _api: Api | null = null;
  private _unsub: (() => void) | undefined;
  private _started = false;

  constructor() {
    super();
    this._config = { type: "custom:ordnungstracker-card", mode: "search" };
    this._query = "";
    this._hits = [];
    this._overview = null;
    this._node = null;
    this._error = "";
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("ordnungstracker-card-editor");
  }

  static getStubConfig(): CardConfig {
    return { type: "custom:ordnungstracker-card", mode: "tiles" };
  }

  setConfig(config: CardConfig): void {
    if (!config || typeof config !== "object") throw new Error("Ungültige Konfiguration");
    if (config.mode && !["search", "tiles", "node"].includes(config.mode)) {
      throw new Error(`Unbekannte Betriebsart: ${config.mode} (erlaubt: search, tiles, node)`);
    }
    if (config.mode === "node" && !config.node) throw new Error('Bei mode: node fehlt "node" (Kennung oder Nummer, z. B. 14).');
    this._config = { ...config, mode: config.mode ?? "search" };
    if (this._started) void this._load();
  }

  getCardSize(): number {
    return this._config.mode === "tiles" ? 4 : this._config.mode === "node" ? 5 : 3;
  }

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }
      .ot-card {
        display: block;
        padding: 12px 16px 16px;
        background: var(--ha-card-background, var(--card-background-color, #fff));
        border-radius: var(--ha-card-border-radius, 12px);
        border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color));
        box-shadow: var(--ha-card-box-shadow, none);
        color: var(--primary-text-color);
      }
      h2 {
        margin: 0 0 8px;
        font-size: 1.2rem;
      }
      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 8px;
        margin-top: 12px;
      }
      .tile {
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        background: transparent;
        padding: 10px 12px;
        text-align: left;
        min-height: 64px;
      }
      .tile .n {
        font-size: 1.5rem;
        font-weight: 500;
        display: block;
      }
      .tile .l {
        font-size: 0.8rem;
        color: var(--secondary-text-color);
      }
      .list {
        border: none;
        margin-top: 8px;
        border-radius: 0;
      }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    if (this._api && !this._unsub) void this._start();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsub?.();
    this._unsub = undefined;
    this._started = false;
  }

  protected willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("hass") && this.hass) {
      if (!this._api) this._api = new Api(this.hass);
      else this._api.setHass(this.hass);
      if (!this._started) void this._start();
    }
  }

  protected shouldUpdate(changed: Map<string, unknown>): boolean {
    return !(this.hasUpdated && changed.size === 1 && changed.has("hass"));
  }

  private async _start(): Promise<void> {
    this._started = true;
    await this._load();
    try {
      this._unsub = await this._api!.subscribe(() => this._reload());
    } catch {
      /* ohne Abo bleibt die Karte beim letzten Stand */
    }
  }

  private _reload = debounce(() => void this._load(), 200);

  private async _load(): Promise<void> {
    const api = this._api;
    if (!api) return;
    try {
      this._error = "";
      const mode = this._config.mode;
      if (mode === "tiles") this._overview = await api.overview();
      if (mode === "node") {
        const ref = String(this._config.node ?? "").trim();
        const number = asNumberQuery(ref);
        const id = number !== null ? (await api.byNumber(number)).id : ref;
        this._node = await api.node(id);
      }
      if (mode === "search" || mode === "tiles") await this._search();
    } catch (err) {
      this._error = errorMessage(err);
    }
  }

  private async _search(): Promise<void> {
    if (!this._query.trim()) {
      this._hits = [];
      return;
    }
    this._hits = (await this._api!.search(this._query, {}, 8)).hits;
  }

  private _typed = debounce(() => void this._search().catch((e) => (this._error = errorMessage(e))), 250);

  private async _enter(): Promise<void> {
    const number = asNumberQuery(this._query);
    if (number !== null) {
      try {
        openPanel(routeToPath({ page: "node", id: (await this._api!.byNumber(number)).id }));
        return;
      } catch {
        /* normal weitersuchen */
      }
    }
    openPanel(routeToPath({ page: "search", query: this._query, filters: {} }));
  }

  render() {
    const t = makeT(this.hass?.language);
    const mode = this._config.mode;
    return html`
      <div class="ot-card">
        ${this._config.title ? html`<h2>${this._config.title}</h2>` : nothing}
        ${mode === "node" ? this._nodeView(t) : html`${this._searchBox(t)}${this._results(t)}${mode === "tiles" ? this._tiles(t) : nothing}`}
        ${this._error ? html`<div class="error-text small" role="alert">${this._error}</div>` : nothing}
      </div>
    `;
  }

  private _searchBox(t: ReturnType<typeof makeT>) {
    return html`<input
      type="search"
      .value=${this._query}
      placeholder=${t("search.placeholder")}
      aria-label=${t("search.placeholder")}
      @input=${(e: Event) => {
        this._query = (e.target as HTMLInputElement).value;
        this._typed();
      }}
      @keydown=${(e: KeyboardEvent) => e.key === "Enter" && this._enter()}
    />`;
  }

  private _results(t: ReturnType<typeof makeT>) {
    if (!this._query.trim()) return nothing;
    if (this._hits.length === 0) return html`<div class="small muted" style="margin-top:8px">${t("search.none")}</div>`;
    return html`<div class="list">
      ${this._hits.map(
        (h) => html`<button class="item" @click=${() => openPanel(routeToPath({ page: "node", id: h.id }))}>
          <span class="grow">
            <span class="row">${h.number !== null ? html`<span class="badge">${h.number}</span>` : nothing}<span class="ellipsis">${h.name}</span></span>
            <span class="small muted ellipsis" style="display:block">${pathText(h.path, false)}</span>
          </span>
        </button>`,
      )}
    </div>`;
  }

  private _tiles(t: ReturnType<typeof makeT>) {
    const o = this._overview?.overview;
    if (!o) return nothing;
    const due = Object.entries(o.due).filter(([k]) => k !== "below_min").reduce((a, [, n]) => a + n, 0);
    const tile = (n: number, label: string, path: string) =>
      html`<button class="tile" @click=${() => openPanel(path)}><span class="n">${n}</span><span class="l">${label}</span></button>`;
    return html`<div class="tiles">
      ${tile(o.containers, t("overview.containers"), BASE)}
      ${tile(o.items, t("overview.items"), BASE)}
      ${tile(o.unsorted, t("overview.unsorted"), routeToPath({ page: "node", id: "unsortiert" }))}
      ${tile(o.checked_out, t("overview.checkedOut"), routeToPath({ page: "search", query: "", filters: { checked_out: true } }))}
      ${tile(due, t("overview.due"), routeToPath({ page: "due" }))}
      ${tile(o.due.below_min ?? 0, t("overview.restock"), routeToPath({ page: "due" }))}
    </div>`;
  }

  private _nodeView(t: ReturnType<typeof makeT>) {
    const n = this._node;
    if (!n) return html`<div class="muted small">${t("common.loading")}</div>`;
    const detail = n.id !== null ? (n as Detail) : null;
    return html`
      ${detail
        ? html`<button class="btn text" style="padding:0" @click=${() => openPanel(routeToPath({ page: "node", id: detail.id }))}><strong>${detail.number !== null ? `${detail.number} · ` : ""}${detail.name}</strong></button>
            <div class="small muted">${pathText(detail.path, false)}</div>`
        : nothing}
      ${n.contents.length
        ? html`<ot-node-list class="list" .rows=${n.contents.map((b) => rowFromBrief(b))} .label=${detail?.name ?? ""} @open-node=${(e: CustomEvent<string>) => openPanel(routeToPath({ page: "node", id: e.detail }))}></ot-node-list>`
        : html`<div class="small muted" style="margin-top:8px">${t("node.emptyGeneric")}</div>`}
    `;
  }
}
customElements.define("ordnungstracker-card", OtCard);

/** Grafischer Karteneditor aus eigenen schlichten Elementen. */
export class OtCardEditor extends LitElement {
  static properties = { hass: { attribute: false }, _config: { state: true } };
  declare hass: HomeAssistant;
  declare _config: CardConfig;

  constructor() {
    super();
    this._config = { type: "custom:ordnungstracker-card", mode: "search" };
  }

  static styles = [baseStyles, css`:host { display: block; } .stack { display: flex; flex-direction: column; gap: 14px; }`];

  setConfig(config: CardConfig): void {
    this._config = config;
  }

  private _set(patch: Partial<CardConfig>): void {
    const config: CardConfig = { ...this._config, ...patch };
    for (const k of ["title", "node"] as const) if (!config[k]) delete config[k];
    if (config.mode !== "node") delete config.node;
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }

  render() {
    const t = makeT(this.hass?.language);
    const c = this._config;
    return html`<div class="stack">
      <label class="field">${t("card.title")}<input .value=${c.title ?? ""} @input=${(e: Event) => this._set({ title: (e.target as HTMLInputElement).value })} /></label>
      <label class="field">${t("card.mode")}
        <select .value=${c.mode ?? "search"} @change=${(e: Event) => this._set({ mode: (e.target as HTMLSelectElement).value as CardConfig["mode"] })}>
          <option value="search" ?selected=${(c.mode ?? "search") === "search"}>${t("card.modeSearch")}</option>
          <option value="tiles" ?selected=${c.mode === "tiles"}>${t("card.modeTiles")}</option>
          <option value="node" ?selected=${c.mode === "node"}>${t("card.modeNode")}</option>
        </select></label>
      ${c.mode === "node"
        ? html`<label class="field">${t("card.node")}<input .value=${c.node ?? ""} placeholder="14" @input=${(e: Event) => this._set({ node: (e.target as HTMLInputElement).value })} /></label>
            <span class="small muted">${t("card.nodeHelp")}</span>`
        : nothing}
    </div>`;
  }
}
customElements.define("ordnungstracker-card-editor", OtCardEditor);
