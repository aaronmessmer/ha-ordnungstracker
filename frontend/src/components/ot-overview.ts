import { LitElement, css, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { Latest } from "../lib/latest";
import { rowFromBrief } from "../lib/rows";
import { baseStyles } from "../lib/styles";
import type { OverviewData } from "../types";

/** Startseite (Pflichtenheft 8.11): Zahlen, Kacheln, Favoriten, zuletzt angesehen, leere Behälter, nächste freie Nummer. */
export class OtOverview extends LitElement {
  static properties = {
    ctx: { attribute: false },
    _data: { state: true },
    _error: { state: true },
    _busy: { state: true },
  };
  declare ctx: AppContext;
  declare _data: OverviewData | null;
  declare _error: string;
  declare _busy: boolean;

  private _latest = new Latest();
  private _revision = -1;

  constructor() {
    super();
    this._data = null;
    this._error = "";
    this._busy = false;
  }

  static styles = [
    baseStyles,
    css`
      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 12px;
      }
      .tile {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-height: 92px;
        padding: 14px 16px;
        border-radius: var(--ot-radius);
        border: 1px solid var(--divider-color);
        background: var(--card-background-color, #fff);
        text-align: left;
      }
      .tile:hover {
        border-color: var(--primary-color);
      }
      .tile .n {
        font-size: 1.9rem;
        font-weight: 500;
        line-height: 1.1;
      }
      .tile .l {
        font-size: 0.9rem;
        color: var(--secondary-text-color);
      }
      .tile.alert .n {
        color: var(--warning-color, #ff9800);
      }
      .tile.bad .n {
        color: var(--error-color, #db4437);
      }
      .intro {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 12px;
        padding: 28px 16px;
      }
      .intro ha-icon {
        --mdc-icon-size: 56px;
        color: var(--primary-color);
      }
    `,
  ];

  willUpdate(): void {
    const rev = this.ctx?.revision ?? 0;
    if (this._revision !== rev) {
      this._revision = rev;
      void this._load();
    }
  }

  private async _load(): Promise<void> {
    try {
      const data = await this._latest.run(() => this.ctx.api.overview());
      if (data) {
        this._data = data;
        this._error = "";
      }
    } catch (err) {
      this._error = errorMessage(err);
    }
  }

  private _open(id: string): void {
    this.ctx.go({ page: "node", id });
  }

  private async _sample(load: boolean): Promise<void> {
    this._busy = true;
    try {
      if (load) await this.ctx.api.sampleLoad();
      else {
        const ok = await this.ctx.confirm({
          title: this.ctx.t("sample.removeTitle"),
          message: this.ctx.t("sample.removeMessage"),
          confirmLabel: this.ctx.t("sample.remove"),
          danger: true,
        });
        if (!ok) return;
        await this.ctx.api.sampleRemove();
      }
      this.ctx.toast(this.ctx.t(load ? "sample.loaded" : "sample.removed"));
      await this.ctx.reloadCatalog();
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    } finally {
      this._busy = false;
    }
  }

  render() {
    const t = this.ctx.t;
    if (this._error && !this._data) return html`<div class="empty error-text" role="alert">${this._error}</div>`;
    const data = this._data;
    if (!data) return html`<div class="empty muted">${t("common.loading")}</div>`;
    const o = data.overview;
    const dueTotal = Object.entries(o.due).filter(([k]) => k !== "below_min").reduce((a, [, n]) => a + n, 0);
    const empty = this.ctx.status?.inventory_empty ?? false;
    const value = o.total_value;
    return html`
      ${empty && !this.ctx.catalog?.sample_loaded
        ? html`<div class="card intro">
            <ha-icon icon="mdi:package-variant"></ha-icon>
            <h2>${t("overview.welcome")}</h2>
            <p class="muted" style="margin:0;max-width:34em">${t("overview.welcomeText")}</p>
            <div class="row wrap" style="justify-content:center">
              <button class="btn primary" @click=${() => this.ctx.go({ page: "node", id: null })}>${t("overview.start")}</button>
              <button class="btn" ?disabled=${this._busy} @click=${() => this._sample(true)}>${t("sample.load")}</button>
            </div>
          </div>`
        : nothing}
      <div class="tiles" style="margin-top:12px">
        ${this._tile(String(o.containers), t("overview.containers"), () => this.ctx.go({ page: "search", query: "", filters: { classes: ["container"] } }))}
        ${this._tile(String(o.items), t("overview.items"), () => this.ctx.go({ page: "search", query: "", filters: { classes: ["item"] } }))}
        ${this._tile(String(o.unsorted), t("overview.unsorted"), () => this._open("unsortiert"), o.unsorted > 0 ? "alert" : "")}
        ${this._tile(String(o.checked_out), t("overview.checkedOut"), () => this.ctx.go({ page: "out" }), o.checked_out_overdue > 0 ? "alert" : "")}
        ${this._tile(String(dueTotal), t("overview.due"), () => this.ctx.go({ page: "due" }), dueTotal > 0 ? "alert" : "")}
        ${this._tile(String(o.due.below_min ?? 0), t("overview.restock"), () => this.ctx.go({ page: "restock" }), (o.due.below_min ?? 0) > 0 ? "alert" : "")}
      </div>
      <div class="row wrap muted small" style="margin:12px 4px 0;gap:16px">
        <span><ha-icon icon="mdi:numeric" style="--mdc-icon-size:18px"></ha-icon> ${t("overview.nextNumber", { n: o.next_free_number })}</span>
        ${value !== null ? html`<span><ha-icon icon="mdi:cash" style="--mdc-icon-size:18px"></ha-icon> ${t("overview.value", { value: this._money(value) })}</span>` : nothing}
        <a href="#" @click=${(e: Event) => { e.preventDefault(); this.ctx.go({ page: "trash" }); }}>${t("nav.trash")}</a>
      </div>
      ${Object.keys(o.value_per_place).length
        ? html`<div class="small muted" style="margin:6px 4px 0">${Object.entries(o.value_per_place).map(([place, v]) => `${place}: ${this._money(v)}`).join(" · ")}</div>`
        : nothing}
      ${this._section(t("overview.favorites"), data.favorites, t("overview.favoritesEmpty"))}
      ${this._section(t("overview.recent"), data.recent, t("overview.recentEmpty"))}
      ${o.empty_containers.length ? this._section(t("overview.emptyContainers"), o.empty_containers, "") : nothing}
      ${this.ctx.catalog?.sample_loaded
        ? html`<div class="row" style="margin-top:20px"><span class="muted small grow">${t("sample.active")}</span><button class="btn text" ?disabled=${this._busy} @click=${() => this._sample(false)}>${t("sample.remove")}</button></div>`
        : nothing}
    `;
  }

  private _money(v: number): string {
    return new Intl.NumberFormat(this.ctx.lang, { style: "currency", currency: "EUR" }).format(v);
  }

  private _tile(n: string, label: string, onClick: () => void, tone = "") {
    return html`<button class="tile ${tone}" @click=${onClick}><span class="n">${n}</span><span class="l">${label}</span></button>`;
  }

  private _section(title: string, items: OverviewData["favorites"], emptyText: string) {
    return html`
      <div class="section-title">${title}</div>
      ${items.length
        ? html`<ot-node-list .rows=${items.map((b) => rowFromBrief(b))} .label=${title} @open-node=${(e: CustomEvent<string>) => this._open(e.detail)}></ot-node-list>`
        : emptyText
          ? html`<div class="small muted" style="margin:0 4px">${emptyText}</div>`
          : nothing}
    `;
  }
}
customElements.define("ot-overview", OtOverview);
