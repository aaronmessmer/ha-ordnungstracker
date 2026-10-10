import { LitElement, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { parseNumber } from "../lib/format";
import { baseStyles } from "../lib/styles";
import type { FieldType } from "../types";

export interface FieldLike {
  id: string;
  name: string;
  type: FieldType;
  unit?: string;
  options?: string[];
}

/**
 * Eingabe für ein eigenes Feld, passend zum Typ (Text, Zahl, Datum, Ja/Nein, Auswahl, Link).
 * `value-changed` liefert den neuen Wert; `null` heißt „leer“ (Wert wird entfernt).
 */
export class OtFieldInput extends LitElement {
  static properties = {
    ctx: { attribute: false },
    field: { attribute: false },
    value: { attribute: false },
    dim: { type: Boolean },
  };
  declare ctx: AppContext;
  declare field: FieldLike;
  declare value: unknown;
  declare dim: boolean;

  constructor() {
    super();
    this.dim = false;
  }

  static styles = [baseStyles];

  private _emit(value: unknown): void {
    this.dispatchEvent(new CustomEvent("value-changed", { detail: { id: this.field.id, value }, bubbles: true, composed: true }));
  }

  render() {
    const f = this.field;
    const t = this.ctx.t;
    const label = f.unit ? `${f.name} (${f.unit})` : f.name;
    const text = this.value === null || this.value === undefined ? "" : String(this.value);
    let control;
    switch (f.type) {
      case "multiline":
        control = html`<textarea rows="3" .value=${text} @input=${(e: Event) => this._emit((e.target as HTMLTextAreaElement).value || null)}></textarea>`;
        break;
      case "number":
        control = html`<input inputmode="decimal" .value=${text} @input=${(e: Event) => {
          const raw = (e.target as HTMLInputElement).value;
          const n = parseNumber(raw);
          this._emit(n === undefined ? raw : n);
        }} />`;
        break;
      case "date":
        control = html`<input type="date" .value=${text} @input=${(e: Event) => this._emit((e.target as HTMLInputElement).value || null)} />`;
        break;
      case "link":
        control = html`<input type="url" inputmode="url" autocapitalize="off" .value=${text} @input=${(e: Event) => this._emit((e.target as HTMLInputElement).value.trim() || null)} />`;
        break;
      case "bool":
        control = html`<select .value=${this.value === true ? "yes" : this.value === false ? "no" : ""} @change=${(e: Event) => {
          const v = (e.target as HTMLSelectElement).value;
          this._emit(v === "yes" ? true : v === "no" ? false : null);
        }}>
          <option value="" ?selected=${this.value === null || this.value === undefined}>–</option>
          <option value="yes" ?selected=${this.value === true}>${t("common.yes")}</option>
          <option value="no" ?selected=${this.value === false}>${t("common.no")}</option>
        </select>`;
        break;
      case "choice":
        control = html`<select .value=${text} @change=${(e: Event) => this._emit((e.target as HTMLSelectElement).value || null)}>
          <option value="" ?selected=${text === ""}>–</option>
          ${(f.options ?? []).map((o) => html`<option value=${o} ?selected=${o === text}>${o}</option>`)}
        </select>`;
        break;
      default:
        control = html`<input .value=${text} @input=${(e: Event) => this._emit((e.target as HTMLInputElement).value || null)} />`;
    }
    return html`<label class="field" style=${this.dim ? "opacity:.6" : ""}>${label}${control}${this.dim ? html`<span class="small muted">${t("node.unassigned")}</span>` : nothing}</label>`;
  }
}
customElements.define("ot-field-input", OtFieldInput);
