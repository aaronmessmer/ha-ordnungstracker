import { LitElement, css, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { Latest } from "../lib/latest";
import { rowFromHit } from "../lib/rows";
import { baseStyles } from "../lib/styles";
import type { Hit, KindClass, SearchFilters } from "../types";

const CLASS_ORDER: KindClass[] = ["place", "furniture", "container", "group", "item"];
const TOGGLES = ["checked_out", "has_number", "empty", "stale", "include_archived"] as const;
const TOGGLE_KEYS = {
  checked_out: "search.fOut",
  has_number: "search.fNumber",
  empty: "search.fEmpty",
  stale: "search.fStale",
  include_archived: "search.fArchived",
} as const;

/** Suche mit Filter-Chips (Pflichtenheft 7.4, 10.2). Ergebnisse bleiben beim Tippen stehen, bis die neuen da sind. */
export class OtSearchPage extends LitElement {
  static properties = {
    ctx: { attribute: false },
    query: { type: String },
    filters: { attribute: false },
    _hits: { state: true },
    _total: { state: true },
    _numberHit: { state: true },
    _loading: { state: true },
    _error: { state: true },
    _open: { state: true },
  };
  declare ctx: AppContext;
  declare query: string;
  declare filters: SearchFilters;
  declare _hits: Hit[] | null;
  declare _total: number;
  declare _numberHit: string | null;
  declare _loading: boolean;
  declare _error: string;
  declare _open: boolean;

  private _latest = new Latest();
  private _key = "";

  constructor() {
    super();
    this.query = "";
    this.filters = {};
    this._hits = null;
    this._total = 0;
    this._numberHit = null;
    this._loading = false;
    this._error = "";
    this._open = false;
  }

  static styles = [
    baseStyles,
    css`
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      details.panel {
        margin: 4px 0 12px;
      }
      details.panel > summary {
        min-height: 44px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        color: var(--primary-color);
      }
      .selects {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
        margin: 8px 0;
      }
      .jump {
        margin-bottom: 8px;
      }
    `,
  ];

  willUpdate(): void {
    const key = JSON.stringify([this.query, this.filters, this.ctx?.revision]);
    if (key !== this._key) {
      this._key = key;
      void this._run();
    }
  }

  private async _run(): Promise<void> {
    this._loading = true;
    try {
      const res = await this._latest.run(() => this.ctx.api.search(this.query, this.filters, 200));
      if (!res) return;
      this._hits = res.hits;
      this._total = res.total;
      this._numberHit = res.number_hit;
      this._error = "";
      this._loading = false;
    } catch (err) {
      this._error = errorMessage(err);
      this._loading = false;
    }
  }

  private _set(patch: Partial<SearchFilters>): void {
    const next: SearchFilters = { ...this.filters, ...patch };
    for (const k of Object.keys(next) as (keyof SearchFilters)[]) {
      const v = next[k];
      if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0) || v === false) delete next[k];
    }
    this.ctx.go({ page: "search", query: this.query, filters: next }, { replace: true });
  }

  private _toggleClass(c: KindClass): void {
    const cur = new Set(this.filters.classes ?? []);
    if (cur.has(c)) cur.delete(c);
    else cur.add(c);
    this._set({ classes: CLASS_ORDER.filter((x) => cur.has(x)) });
  }

  private get _activeCount(): number {
    const f = this.filters;
    return Object.keys(f).filter((k) => !(k === "checked_out" && f.checked_out === undefined)).length;
  }

  render() {
    const t = this.ctx.t;
    const f = this.filters;
    const kinds = this.ctx.catalog?.kinds ?? [];
    const persons = this.ctx.catalog?.persons ?? [];
    const rows = (this._hits ?? []).map((h) => {
      const kind = kinds.find((k) => k.id === h.kind);
      return rowFromHit(h, kind?.name ?? "", kind?.icon ?? "");
    });
    const jump = this._numberHit ? this._hits?.find((h) => h.id === this._numberHit) : undefined;
    return html`
      <div class="filters" role="group" aria-label=${t("search.filter")}>
        ${CLASS_ORDER.map((c) => html`<button class="chip" aria-pressed=${f.classes?.includes(c) ? "true" : "false"} @click=${() => this._toggleClass(c)}>${t(`class.${c}` as never)}</button>`)}
      </div>
      <details class="panel" ?open=${this._open} @toggle=${(e: Event) => (this._open = (e.target as HTMLDetailsElement).open)}>
        <summary><ha-icon icon="mdi:filter-variant"></ha-icon>${t("search.moreFilters")}${this._activeCount ? ` (${this._activeCount})` : ""}</summary>
        <div class="selects">
          <label class="field">${t("search.kind")}
            <select .value=${f.kinds?.[0] ?? ""} @change=${(e: Event) => this._set({ kinds: (e.target as HTMLSelectElement).value ? [(e.target as HTMLSelectElement).value] : undefined })}>
              <option value="">${t("search.any")}</option>
              ${kinds.map((k) => html`<option value=${k.id} ?selected=${f.kinds?.[0] === k.id}>${k.name}</option>`)}
            </select></label>
          <label class="field">${t("search.owner")}
            <select .value=${f.owner ?? ""} @change=${(e: Event) => this._set({ owner: (e.target as HTMLSelectElement).value || undefined })}>
              <option value="">${t("search.any")}</option>
              ${persons.map((p) => html`<option value=${p.id} ?selected=${f.owner === p.id}>${p.name}</option>`)}
            </select></label>
          <label class="field">${t("search.condition")}
            <select .value=${f.condition ?? ""} @change=${(e: Event) => this._set({ condition: (e.target as HTMLSelectElement).value || undefined })}>
              <option value="">${t("search.any")}</option>
              ${["missing", "defective", "to_sell", "to_give_away", "disposed"].map((c) => html`<option value=${c} ?selected=${f.condition === c}>${t(`condition.${c}` as never)}</option>`)}
            </select></label>
          <label class="field">${t("search.tag")}
            <input .value=${f.tag ?? ""} @change=${(e: Event) => this._set({ tag: (e.target as HTMLInputElement).value.trim() || undefined })} /></label>
        </div>
        <div class="filters">
          ${TOGGLES.map((k) => html`<button class="chip" aria-pressed=${f[k] ? "true" : "false"} @click=${() => this._set({ [k]: f[k] ? undefined : true } as Partial<SearchFilters>)}>${t(TOGGLE_KEYS[k])}</button>`)}
          ${f.within ? html`<button class="chip" aria-pressed="true" @click=${() => this._set({ within: undefined })}>${t("search.within")} ✕</button>` : nothing}
          ${this._activeCount ? html`<button class="btn text" @click=${() => this.ctx.go({ page: "search", query: this.query, filters: {} }, { replace: true })}>${t("search.reset")}</button>` : nothing}
        </div>
      </details>
      ${jump ? html`<button class="btn primary jump" @click=${() => this.ctx.go({ page: "node", id: jump.id })}><ha-icon icon="mdi:arrow-right-bold"></ha-icon>${t("search.jump", { name: jump.name })}</button>` : nothing}
      ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
      <div class="small muted" style="margin:0 4px 8px" aria-live="polite">
        ${this._hits === null ? t("common.loading") : this._total === 0 ? "" : t(this._total > rows.length ? "search.countMore" : "search.count", { n: this._total, shown: rows.length })}
      </div>
      ${rows.length
        ? html`<ot-node-list .rows=${rows} .showCounts=${false} .label=${t("search.results")} @open-node=${(e: CustomEvent<string>) => this.ctx.go({ page: "node", id: e.detail })}></ot-node-list>`
        : this._hits !== null && !this._loading
          ? html`<div class="empty"><ha-icon icon="mdi:magnify-close"></ha-icon><p>${t("search.none")}</p></div>`
          : nothing}
    `;
  }
}
customElements.define("ot-search-page", OtSearchPage);
