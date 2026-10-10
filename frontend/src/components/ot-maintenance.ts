import { LitElement, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { baseStyles } from "../lib/styles";
import type { MaintenanceTask } from "../types";

const UNITS = ["days", "weeks", "months", "years"] as const;

/** Wartungsaufgabe anlegen oder ändern (Pflichtenheft 5.9): Titel, Intervall, nächste Fälligkeit, Notiz. */
export class OtMaintenance extends LitElement {
  static properties = {
    ctx: { attribute: false },
    nodeId: { type: String },
    task: { attribute: false },
    _title: { state: true },
    _value: { state: true },
    _unit: { state: true },
    _next: { state: true },
    _note: { state: true },
    _error: { state: true },
    _busy: { state: true },
  };
  declare ctx: AppContext;
  declare nodeId: string;
  declare task: MaintenanceTask | null;
  declare _title: string;
  declare _value: string;
  declare _unit: string;
  declare _next: string;
  declare _note: string;
  declare _error: string;
  declare _busy: boolean;

  constructor() {
    super();
    this.nodeId = "";
    this.task = null;
    this._title = "";
    this._value = "";
    this._unit = "months";
    this._next = "";
    this._note = "";
    this._error = "";
    this._busy = false;
  }

  static styles = [baseStyles];

  connectedCallback(): void {
    super.connectedCallback();
    const k = this.task;
    if (k) {
      this._title = k.title;
      this._value = k.interval ? String(k.interval.value) : "";
      this._unit = k.interval?.unit ?? "months";
      this._next = k.next_due ?? "";
      this._note = k.note ?? "";
    }
  }

  private _emit(name: string, detail: Record<string, unknown> = {}): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private async _save(e?: Event): Promise<void> {
    e?.preventDefault();
    const t = this.ctx.t;
    const title = this._title.trim();
    if (!title) {
      this._error = t("maintenance.titleRequired");
      return;
    }
    const n = this._value.trim() === "" ? null : Number.parseInt(this._value, 10);
    if (n !== null && !(n >= 1)) {
      this._error = t("maintenance.intervalInvalid");
      return;
    }
    const interval = n === null ? null : { value: n, unit: this._unit };
    this._busy = true;
    this._error = "";
    try {
      if (this.task) {
        await this.ctx.api.maintenanceUpdate(this.nodeId, this.task.id, {
          title,
          interval,
          next_due: this._next || null,
          note: this._note,
        });
      } else {
        await this.ctx.api.maintenanceAdd(this.nodeId, {
          title,
          interval,
          ...(this._next ? { next_due: this._next } : {}),
          ...(this._note.trim() ? { note: this._note.trim() } : {}),
        });
      }
      this._emit("saved", { kind: "maintenance" });
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private async _remove(): Promise<void> {
    const t = this.ctx.t;
    const task = this.task;
    if (!task) return;
    const ok = await this.ctx.confirm({
      title: t("maintenance.deleteTitle", { name: task.title }),
      message: t("maintenance.deleteMessage"),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    try {
      await this.ctx.api.maintenanceRemove(this.nodeId, task.id);
      this._emit("saved", { kind: "maintenance-removed" });
    } catch (err) {
      this._error = errorMessage(err);
    }
  }

  render() {
    const t = this.ctx.t;
    return html`
      <ot-dialog .heading=${this.task ? t("maintenance.edit") : t("maintenance.new")} .closeLabel=${t("common.close")}>
        <form @submit=${this._save} class="stack">
          <label class="field">${t("maintenance.title")} *
            <input .value=${this._title} autocomplete="off" required aria-required="true" placeholder=${t("maintenance.titlePlaceholder")} @input=${(e: Event) => (this._title = (e.target as HTMLInputElement).value)} />
          </label>
          <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:12px">
            <label class="field">${t("maintenance.every")}
              <input type="number" inputmode="numeric" min="1" .value=${this._value} placeholder=${t("maintenance.once")} @input=${(e: Event) => (this._value = (e.target as HTMLInputElement).value)} />
            </label>
            <label class="field">${t("maintenance.unit")}
              <select .value=${this._unit} @change=${(e: Event) => (this._unit = (e.target as HTMLSelectElement).value)}>
                ${UNITS.map((u) => html`<option value=${u} ?selected=${u === this._unit}>${t(`maintenance.unit.${u}` as never)}</option>`)}
              </select>
            </label>
          </div>
          <label class="field">${t("maintenance.nextDue")}
            <input type="date" .value=${this._next} @input=${(e: Event) => (this._next = (e.target as HTMLInputElement).value)} />
          </label>
          <label class="field">${t("form.note")}<textarea rows="2" .value=${this._note} @input=${(e: Event) => (this._note = (e.target as HTMLTextAreaElement).value)}></textarea></label>
          ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
        </form>
        ${this.task ? html`<button slot="footer" class="btn text danger" @click=${this._remove}>${t("common.delete")}</button><span slot="footer" class="grow"></span>` : nothing}
        <button slot="footer" class="btn text" @click=${() => this._emit("close")}>${t("common.cancel")}</button>
        <button slot="footer" class="btn primary" ?disabled=${this._busy} @click=${() => this._save()}>${t("common.save")}</button>
      </ot-dialog>
    `;
  }
}
customElements.define("ot-maintenance", OtMaintenance);
