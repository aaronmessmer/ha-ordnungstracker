import { LitElement, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { baseStyles } from "../lib/styles";

const KEYS = ["lent_days", "stale_days", "trash_days"] as const;
type Key = (typeof KEYS)[number];

/** Schwellen für Erinnerungen und Papierkorb (Pflichtenheft 8.13) sowie der Stand der To-do-Anbindung. */
export class OtSettingsReminders extends LitElement {
  static properties = {
    ctx: { attribute: false },
    _values: { state: true },
    _error: { state: true },
    _busy: { state: true },
  };
  declare ctx: AppContext;
  declare _values: Record<Key, string> | null;
  declare _error: string;
  declare _busy: boolean;

  constructor() {
    super();
    this._values = null;
    this._error = "";
    this._busy = false;
  }

  static styles = [baseStyles];

  private get _current(): Record<Key, string> {
    const s = this.ctx.catalog?.settings;
    return this._values ?? { lent_days: String(s?.lent_days ?? 30), stale_days: String(s?.stale_days ?? 365), trash_days: String(s?.trash_days ?? 30) };
  }

  private async _save(): Promise<void> {
    const t = this.ctx.t;
    const parsed: Record<string, number> = {};
    for (const k of KEYS) {
      const n = Number.parseInt(this._current[k], 10);
      if (!(n >= 1)) {
        this._error = t("reminders.invalid");
        return;
      }
      parsed[k] = n;
    }
    this._busy = true;
    this._error = "";
    try {
      await this.ctx.api.settings(parsed);
      this._values = null;
      await this.ctx.reloadCatalog();
      this.ctx.toast(t("form.saved"));
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
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
    const v = this._current;
    const status = this.ctx.status;
    const input = (k: Key) => html`<label class="field">${t(`reminders.${k}` as never)}
      <input type="number" inputmode="numeric" min="1" .value=${v[k]} @input=${(e: Event) => (this._values = { ...v, [k]: (e.target as HTMLInputElement).value })} />
      <span class="small muted">${t(`reminders.${k}Help` as never)}</span></label>`;
    return html`
      <div class="stack">
        <div class="card stack">
          <h2>${t("reminders.title")}</h2>
          ${KEYS.map(input)}
          ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
          <div><button class="btn primary" ?disabled=${this._busy || this._values === null} @click=${this._save}>${t("common.save")}</button></div>
        </div>
        <div class="card stack">
          <h2>${t("restock.todoTitle")}</h2>
          <p class="small muted" style="margin:0">${status?.todo_entity
            ? t(status.todo_auto ? "restock.todoAuto" : "restock.todoManual", { entity: status.todo_entity })
            : t("restock.noTodo")}</p>
          <p class="small muted" style="margin:0">${t("restock.todoWhere")}</p>
          ${status?.todo_entity ? html`<div><button class="btn" @click=${this._transfer}><ha-icon icon="mdi:cart-arrow-right"></ha-icon>${t("restock.toTodo")}</button></div>` : nothing}
        </div>
      </div>
    `;
  }
}
customElements.define("ot-settings-reminders", OtSettingsReminders);
