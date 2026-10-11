import { LitElement, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { formatDate } from "../lib/format";
import { Latest } from "../lib/latest";
import { baseStyles } from "../lib/styles";
import type { DueItem } from "../types";
import "./ot-stepper";

export const CATEGORIES = ["expiring", "checkout_overdue", "below_min", "maintenance_due", "missing"] as const;
export type Category = (typeof CATEGORIES)[number];

/** Gemeinsame Ansicht „Fällig“ mit fünf Rubriken (Pflichtenheft 8.8). Mit `only` zeigt sie eine einzelne Rubrik („Nachkaufen“). */
export class OtDuePage extends LitElement {
  static properties = {
    ctx: { attribute: false },
    only: { type: String },
    _data: { state: true },
    _error: { state: true },
  };
  declare ctx: AppContext;
  declare only: Category | "";
  declare _data: Record<string, DueItem[]> | null;
  declare _error: string;

  private _latest = new Latest();
  private _revision = -1;

  constructor() {
    super();
    this.only = "";
    this._data = null;
    this._error = "";
  }

  static styles = [baseStyles];

  willUpdate(): void {
    const rev = this.ctx?.revision ?? 0;
    if (rev !== this._revision) {
      this._revision = rev;
      void this._load();
    }
  }

  private async _load(): Promise<void> {
    try {
      const res = await this._latest.run(() => this.ctx.api.due());
      if (res) {
        this._data = res.categories;
        this._error = "";
      }
    } catch (err) {
      this._error = errorMessage(err);
    }
  }

  private async _run(action: () => Promise<unknown>, message: string): Promise<void> {
    try {
      await action();
      this.ctx.toast(message);
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  private async _transfer(): Promise<void> {
    const t = this.ctx.t;
    try {
      const r = await this.ctx.api.todoTransfer();
      this.ctx.toast(t("restock.transferred", { added: r.added, skipped: r.skipped }));
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  render() {
    const t = this.ctx.t;
    if (this._error && !this._data) return html`<div class="error-text" role="alert">${this._error}</div>`;
    if (!this._data) return html`<div class="empty muted">${t("common.loading")}</div>`;
    const data = this._data;
    const shown: readonly Category[] = this.only ? [this.only] : CATEGORIES;
    const total = shown.reduce((a, c) => a + (data[c]?.length ?? 0), 0);
    const restock = this.only === "below_min";
    return html`
      <div class="row" style="margin:4px 0 12px">
        <h1 class="grow" style="font-size:1.5rem;font-weight:500">${restock ? t("restock.title") : t("due.title")}</h1>
        ${restock && total > 0 && this.ctx.status?.todo_entity
          ? html`<button class="btn" @click=${this._transfer}><ha-icon icon="mdi:cart-arrow-right"></ha-icon>${t("restock.toTodo")}</button>`
          : nothing}
      </div>
      ${restock && total > 0 && !this.ctx.status?.todo_entity ? html`<p class="small muted">${t("restock.noTodo")}</p>` : nothing}
      ${total === 0
        ? html`<div class="empty"><ha-icon icon="mdi:check-circle-outline"></ha-icon><p>${restock ? t("restock.none") : t("due.none")}</p></div>`
        : nothing}
      ${shown.map((c) => {
        const items = data[c] ?? [];
        if (!items.length) return nothing;
        return html`
          ${this.only ? nothing : html`<div class="section-title">${t(`due.${c}` as never)} (${items.length})</div>`}
          <div class="list">${items.map((i) => this._item(c, i))}</div>
        `;
      })}
    `;
  }

  private _item(category: Category, i: DueItem) {
    const t = this.ctx.t;
    const lang = this.ctx.lang;
    const extra =
      category === "below_min" && i.min_quantity != null ? `${t("node.minimum")} ${i.min_quantity}` : i.due ? formatDate(i.due, lang) : "";
    const sub = [i.detail && category !== "below_min" ? i.detail : "", extra, i.path].filter(Boolean).join(" · ");
    return html`<div class="rowbox" style="display:flex;align-items:center;border-bottom:1px solid var(--divider-color)">
      <button class="item" style="border:none;flex:1;min-width:0;width:auto" @click=${() => this.ctx.go({ page: "node", id: i.node_id })}>
        <span class="grow">
          <span class="title">${i.name}</span>
          <span class="small muted" style="display:block">${sub}</span>
          ${i.overdue ? html`<span class="chip error" style="margin-top:4px">${t("due.overdue")}</span>` : nothing}
        </span>
      </button>
      ${category === "below_min" && i.quantity != null
        ? html`<ot-stepper .ctx=${this.ctx} .nodeId=${i.node_id} .itemName=${i.name} .quantity=${i.quantity} .unit=${i.unit ?? ""}></ot-stepper>`
        : category === "checkout_overdue"
          ? html`<button class="btn" style="margin-right:8px" @click=${() => this._run(() => this.ctx.api.returnNode(i.node_id), t("checkout.returned", { name: i.name }))}>${t("checkout.return")}</button>`
          : category === "maintenance_due"
            ? html`<button class="btn" style="margin-right:8px" @click=${() => this._run(() => this.ctx.api.maintenanceDone(i.node_id, i.key.split("|")[2]), t("maintenance.doneToast", { title: i.detail }))}><ha-icon icon="mdi:check"></ha-icon>${t("maintenance.done")}</button>`
            : nothing}
    </div>`;
  }
}
customElements.define("ot-due-page", OtDuePage);
