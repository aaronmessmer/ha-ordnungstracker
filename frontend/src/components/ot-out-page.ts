import { LitElement, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { formatDate } from "../lib/format";
import { Latest } from "../lib/latest";
import { baseStyles } from "../lib/styles";
import type { CheckoutRow } from "../types";

/** „Entnommen“: alles, was gerade nicht an seinem Platz ist, längste Dauer zuerst (Pflichtenheft 8.6). */
export class OtOutPage extends LitElement {
  static properties = {
    ctx: { attribute: false },
    _rows: { state: true },
    _error: { state: true },
  };
  declare ctx: AppContext;
  declare _rows: CheckoutRow[] | null;
  declare _error: string;

  private _latest = new Latest();
  private _revision = -1;

  constructor() {
    super();
    this._rows = null;
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
      const res = await this._latest.run(() => this.ctx.api.checkouts());
      if (res) {
        this._rows = res;
        this._error = "";
      }
    } catch (err) {
      this._error = errorMessage(err);
    }
  }

  private async _return(r: CheckoutRow): Promise<void> {
    try {
      await this.ctx.api.returnNode(r.id);
      this.ctx.toast(this.ctx.t("checkout.returned", { name: r.name }));
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  render() {
    const t = this.ctx.t;
    if (this._error && !this._rows) return html`<div class="error-text" role="alert">${this._error}</div>`;
    if (!this._rows) return html`<div class="empty muted">${t("common.loading")}</div>`;
    return html`
      <h1 style="font-size:1.5rem;font-weight:500;margin:4px 0 12px">${t("out.title")}</h1>
      ${this._rows.length === 0
        ? html`<div class="empty"><ha-icon icon="mdi:check-circle-outline"></ha-icon><p>${t("out.none")}</p></div>`
        : html`<div class="list">${this._rows.map((r) => this._row(r))}</div>`}
    `;
  }

  private _row(r: CheckoutRow) {
    const t = this.ctx.t;
    const lang = this.ctx.lang;
    const what = r.type === "lent" ? t("node.lentTo") : t("node.outAt");
    const home = r.path.length ? ` · ${t("out.home", { path: r.path.join(" › ") })}` : "";
    return html`<div class="rowbox" style="display:flex;align-items:center;border-bottom:1px solid var(--divider-color)">
      <button class="item" style="border:none;flex:1;min-width:0;width:auto" @click=${() => this.ctx.go({ page: "node", id: r.id })}>
        <ha-icon class="icon" icon=${r.type === "lent" ? "mdi:account-arrow-right-outline" : "mdi:package-up"}></ha-icon>
        <span class="grow">
          <span class="title">${r.name}</span>
          <span class="small muted" style="display:block">${what} ${r.to} · ${t("node.since")} ${formatDate(r.since, lang)}${r.until ? ` · ${t("node.until")} ${formatDate(r.until, lang)}` : ""}${home}</span>
          <span class="small" style="display:block">${t("out.days", { n: r.days_out })}</span>
          ${r.overdue ? html`<span class="chip error" style="margin-top:4px">${t("due.overdue")}</span>` : nothing}
        </span>
      </button>
      <button class="btn" style="margin-right:8px" @click=${() => this._return(r)}>${t("checkout.return")}</button>
    </div>`;
  }
}
customElements.define("ot-out-page", OtOutPage);
