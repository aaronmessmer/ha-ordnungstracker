import { LitElement, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { today } from "../lib/format";
import { baseStyles } from "../lib/styles";

/** Ausleihen an jemanden oder Entnehmen/Auslagern (Pflichtenheft 5.7, 8.6): wohin, seit wann, bis wann, Notiz. */
export class OtCheckout extends LitElement {
  static properties = {
    ctx: { attribute: false },
    nodeId: { type: String },
    itemName: { type: String },
    kind: { type: String },
    _to: { state: true },
    _since: { state: true },
    _until: { state: true },
    _note: { state: true },
    _noReminder: { state: true },
    _error: { state: true },
    _busy: { state: true },
  };
  declare ctx: AppContext;
  declare nodeId: string;
  declare itemName: string;
  declare kind: "lent" | "out";
  declare _to: string;
  declare _since: string;
  declare _until: string;
  declare _note: string;
  declare _noReminder: boolean;
  declare _error: string;
  declare _busy: boolean;

  constructor() {
    super();
    this.nodeId = "";
    this.itemName = "";
    this.kind = "lent";
    this._to = "";
    this._since = today();
    this._until = "";
    this._note = "";
    this._noReminder = false;
    this._error = "";
    this._busy = false;
  }

  static styles = [baseStyles];

  private async _save(e?: Event): Promise<void> {
    e?.preventDefault();
    const t = this.ctx.t;
    const to = this._to.trim();
    if (!to) {
      this._error = this.kind === "lent" ? t("checkout.toRequiredLent") : t("checkout.toRequiredOut");
      return;
    }
    this._busy = true;
    this._error = "";
    try {
      await this.ctx.api.checkout(this.nodeId, {
        checkout_type: this.kind,
        to,
        since: this._since || today(),
        ...(this._until ? { until: this._until } : {}),
        ...(this._note.trim() ? { note: this._note.trim() } : {}),
        ...(this.kind === "lent" && this._noReminder ? { no_reminder: true } : {}),
      });
      this.dispatchEvent(new CustomEvent("saved", { detail: { kind: "checkout", name: this.itemName }, bubbles: true, composed: true }));
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  render() {
    const t = this.ctx.t;
    const lent = this.kind === "lent";
    const persons = this.ctx.catalog?.persons ?? [];
    return html`
      <ot-dialog .heading=${lent ? t("checkout.titleLent", { name: this.itemName }) : t("checkout.titleOut", { name: this.itemName })} .closeLabel=${t("common.close")}>
        <form @submit=${this._save} class="stack">
          <label class="field">
            ${lent ? t("checkout.toLent") : t("checkout.toOut")} *
            <input
              .value=${this._to}
              list="persons"
              autocomplete="off"
              required
              aria-required="true"
              placeholder=${lent ? t("checkout.placeholderLent") : t("checkout.placeholderOut")}
              @input=${(e: Event) => (this._to = (e.target as HTMLInputElement).value)}
            />
            ${lent ? html`<datalist id="persons">${persons.map((p) => html`<option value=${p.name}></option>`)}</datalist>` : nothing}
          </label>
          <div class="two" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px">
            <label class="field">${t("checkout.since")}<input type="date" .value=${this._since} @input=${(e: Event) => (this._since = (e.target as HTMLInputElement).value)} /></label>
            <label class="field">${t("checkout.until")}<input type="date" .value=${this._until} @input=${(e: Event) => (this._until = (e.target as HTMLInputElement).value)} /></label>
          </div>
          <label class="field">${t("form.note")}<textarea rows="2" .value=${this._note} @input=${(e: Event) => (this._note = (e.target as HTMLTextAreaElement).value)}></textarea></label>
          ${lent
            ? html`<label class="row" style="gap:12px"><input type="checkbox" style="width:22px;min-height:0;height:22px" .checked=${this._noReminder} @change=${(e: Event) => (this._noReminder = (e.target as HTMLInputElement).checked)} /><span>${t("checkout.noReminder")}</span></label>
              <div class="small muted">${t("checkout.noReminderHelp")}</div>`
            : nothing}
          ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
        </form>
        <button slot="footer" class="btn text" @click=${() => this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }))}>${t("common.cancel")}</button>
        <button slot="footer" class="btn primary" ?disabled=${this._busy} @click=${() => this._save()}>${t("common.save")}</button>
      </ot-dialog>
    `;
  }
}
customElements.define("ot-checkout", OtCheckout);
