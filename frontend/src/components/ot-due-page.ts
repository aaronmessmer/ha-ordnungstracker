import { LitElement, css, html } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { formatDate } from "../lib/format";
import { Latest } from "../lib/latest";
import { baseStyles } from "../lib/styles";
import type { DueItem } from "../types";

const CATEGORIES = ["expiring", "checkout_overdue", "below_min", "maintenance_due", "missing"] as const;

/** Einfache Fälligkeitsliste (Pflichtenheft 8.8). Die ausgebauten Ansichten „Fällig“, „Entnommen“ und „Nachkaufen“ folgen in Phase 4. */
export class OtDuePage extends LitElement {
  static properties = {
    ctx: { attribute: false },
    _data: { state: true },
    _error: { state: true },
  };
  declare ctx: AppContext;
  declare _data: Record<string, DueItem[]> | null;
  declare _error: string;

  private _latest = new Latest();
  private _revision = -1;

  constructor() {
    super();
    this._data = null;
    this._error = "";
  }

  static styles = [baseStyles, css`.sub { display: block; }`];

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
      if (res) this._data = res.categories;
    } catch (err) {
      this._error = errorMessage(err);
    }
  }

  render() {
    const t = this.ctx.t;
    if (this._error) return html`<div class="error-text" role="alert">${this._error}</div>`;
    if (!this._data) return html`<div class="empty muted">${t("common.loading")}</div>`;
    const data = this._data;
    const total = CATEGORIES.reduce((a, c) => a + (data[c]?.length ?? 0), 0);
    return html`
      <h1 style="font-size:1.5rem;font-weight:500;margin:4px 0 12px">${t("due.title")}</h1>
      ${total === 0 ? html`<div class="empty"><ha-icon icon="mdi:check-circle-outline"></ha-icon><p>${t("due.none")}</p></div>` : ""}
      ${CATEGORIES.map((c) => {
        const items = data[c] ?? [];
        if (!items.length) return "";
        return html`
          <div class="section-title">${t(`due.${c}` as never)} (${items.length})</div>
          <div class="list">
            ${items.map(
              (i) => html`<button class="item" @click=${() => this.ctx.go({ page: "node", id: i.node_id })}>
                <span class="grow">
                  <span class="title">${i.name}</span>
                  <span class="small muted sub">${[i.detail, i.due ? formatDate(i.due, this.ctx.lang) : "", i.path].filter(Boolean).join(" · ")}</span>
                </span>
                ${i.overdue ? html`<span class="chip error">${t("due.overdue")}</span>` : ""}
              </button>`,
            )}
          </div>
        `;
      })}
    `;
  }
}
customElements.define("ot-due-page", OtDuePage);
