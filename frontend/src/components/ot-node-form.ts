import { LitElement, css, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { parseList, parseNumber } from "../lib/format";
import { baseStyles } from "../lib/styles";
import type { Detail } from "../types";

/**
 * Anlegen und Bearbeiten in einem Dialog. Pflicht ist nur der Name; die Art wird vorgeschlagen,
 * selten Gebrauchtes ist eingeklappt (Pflichtenheft 8.2, 10.1).
 */
export class OtNodeForm extends LitElement {
  static properties = {
    ctx: { attribute: false },
    mode: { type: String },
    parentId: { attribute: false },
    node: { attribute: false },
    _name: { state: true },
    _kind: { state: true },
    _number: { state: true },
    _aliases: { state: true },
    _tags: { state: true },
    _owner: { state: true },
    _quantity: { state: true },
    _unit: { state: true },
    _minQuantity: { state: true },
    _note: { state: true },
    _error: { state: true },
    _busy: { state: true },
  };
  declare ctx: AppContext;
  declare mode: "create" | "edit";
  declare parentId: string | null;
  declare node: Detail | null;
  declare _name: string;
  declare _kind: string;
  declare _number: string;
  declare _aliases: string;
  declare _tags: string;
  declare _owner: string;
  declare _quantity: string;
  declare _unit: string;
  declare _minQuantity: string;
  declare _note: string;
  declare _error: string;
  declare _busy: boolean;

  private _numberTouched = false;
  private _nextNumber: number | null = null;

  constructor() {
    super();
    this.mode = "create";
    this.parentId = null;
    this.node = null;
    this._name = "";
    this._kind = "";
    this._number = "";
    this._aliases = "";
    this._tags = "";
    this._owner = "";
    this._quantity = "";
    this._unit = "";
    this._minQuantity = "";
    this._note = "";
    this._error = "";
    this._busy = false;
  }

  static styles = [
    baseStyles,
    css`
      form {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      details {
        border-top: 1px solid var(--divider-color);
        padding-top: 8px;
      }
      summary {
        cursor: pointer;
        min-height: 44px;
        display: flex;
        align-items: center;
        color: var(--primary-color);
      }
      .two {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 12px;
      }
    `,
  ];

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    const n = this.node;
    if (this.mode === "edit" && n) {
      this._name = n.name;
      this._kind = n.kind;
      this._number = n.number !== null ? String(n.number) : "";
      this._numberTouched = true;
      this._aliases = n.aliases.join(", ");
      this._tags = n.tags.join(", ");
      this._owner = n.owner ?? "";
      this._quantity = n.quantity !== null ? String(n.quantity) : "";
      this._unit = n.unit;
      this._minQuantity = n.min_quantity !== null ? String(n.min_quantity) : "";
      this._note = n.note;
    } else {
      try {
        const s = await this.ctx.api.suggest(this.parentId);
        this._nextNumber = s.next_number;
        this._kind = s.kinds[0] ?? this.ctx.catalog?.kinds[0]?.id ?? "";
        this._syncNumber();
      } catch (err) {
        this._error = errorMessage(err);
      }
    }
  }

  private get _kinds() {
    return this.ctx.catalog?.kinds ?? [];
  }

  private get _numbered(): boolean {
    return this._kinds.find((k) => k.id === this._kind)?.numbered ?? false;
  }

  /** Bei nummerierten Arten die kleinste freie Nummer vorschlagen – solange der Nutzer nichts eingetragen hat. */
  private _syncNumber(): void {
    if (this.mode === "edit" || this._numberTouched) return;
    this._number = this._numbered && this._nextNumber !== null ? String(this._nextNumber) : "";
  }

  private _input(field: "_name" | "_aliases" | "_tags" | "_quantity" | "_unit" | "_minQuantity" | "_note" | "_owner") {
    return (e: Event) => {
      this[field] = (e.target as HTMLInputElement).value;
    };
  }

  private async _save(e?: Event): Promise<void> {
    e?.preventDefault();
    const t = this.ctx.t;
    const name = this._name.trim();
    if (!name) {
      this._error = t("form.nameRequired");
      return;
    }
    const quantity = parseNumber(this._quantity);
    const minQuantity = parseNumber(this._minQuantity);
    const number = this._number.trim() === "" ? null : Number.parseInt(this._number, 10);
    if (quantity === undefined || minQuantity === undefined || (number !== null && !(number >= 1))) {
      this._error = t("form.numberInvalid");
      return;
    }
    this._busy = true;
    this._error = "";
    try {
      if (this.mode === "create") {
        const payload: Record<string, unknown> = {
          name,
          kind: this._kind,
          aliases: parseList(this._aliases),
          tags: parseList(this._tags),
          note: this._note,
          unit: this._unit,
        };
        if (this.parentId) payload.parent = this.parentId;
        if (number !== null) payload.number = number;
        if (this._owner) payload.owner = this._owner;
        if (quantity !== null) payload.quantity = quantity;
        if (minQuantity !== null) payload.min_quantity = minQuantity;
        const created = await this.ctx.api.create(payload);
        this._done("created", created.id, name);
      } else if (this.node) {
        await this.ctx.api.update(this.node.id, {
          name,
          kind: this._kind,
          number,
          aliases: parseList(this._aliases),
          tags: parseList(this._tags),
          note: this._note,
          owner: this._owner || null,
          quantity,
          unit: this._unit,
          min_quantity: minQuantity,
        });
        this._done("saved", this.node.id, name);
      }
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private _done(kind: "created" | "saved", id: string, name: string): void {
    this.dispatchEvent(new CustomEvent("saved", { detail: { kind, id, name }, bubbles: true, composed: true }));
  }

  render() {
    const t = this.ctx.t;
    const persons = this.ctx.catalog?.persons ?? [];
    const inherited = this.node?.effective_owner?.inherited ? this.node.effective_owner.name : "";
    const heading = this.mode === "create" ? t("form.createTitle") : t("form.editTitle");
    return html`
      <ot-dialog .heading=${heading} .closeLabel=${t("common.close")}>
        <form @submit=${this._save} id="form">
          <label class="field">
            ${t("form.name")} *
            <input
              .value=${this._name}
              @input=${this._input("_name")}
              autocomplete="off"
              required
              aria-required="true"
              enterkeyhint="done"
            />
          </label>
          <div class="two">
            <label class="field">
              ${t("form.kind")}
              <select
                .value=${this._kind}
                @change=${(e: Event) => {
                  this._kind = (e.target as HTMLSelectElement).value;
                  this._syncNumber();
                }}
              >
                ${this._kinds.map((k) => html`<option value=${k.id} ?selected=${k.id === this._kind}>${k.name}</option>`)}
              </select>
            </label>
            <label class="field">
              ${t("form.number")}
              <input
                type="number"
                inputmode="numeric"
                min="1"
                .value=${this._number}
                placeholder=${t("form.numberNone")}
                @input=${(e: Event) => {
                  this._numberTouched = true;
                  this._number = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          </div>
          <details>
            <summary>${t("form.more")}</summary>
            <div class="stack" style="margin-top:8px">
              <label class="field">${t("form.aliases")}<input .value=${this._aliases} @input=${this._input("_aliases")} /></label>
              <label class="field">${t("form.tags")}<input .value=${this._tags} @input=${this._input("_tags")} /></label>
              <label class="field">
                ${t("form.owner")}
                <select .value=${this._owner} @change=${this._input("_owner")}>
                  <option value="" ?selected=${this._owner === ""}>${inherited ? t("form.ownerInherited", { name: inherited }) : t("form.ownerNone")}</option>
                  ${persons.map((p) => html`<option value=${p.id} ?selected=${p.id === this._owner}>${p.name}</option>`)}
                </select>
              </label>
              <div class="two">
                <label class="field">${t("form.quantity")}<input inputmode="decimal" .value=${this._quantity} @input=${this._input("_quantity")} /></label>
                <label class="field">${t("form.unit")}<input .value=${this._unit} @input=${this._input("_unit")} /></label>
              </div>
              <label class="field">${t("form.minQuantity")}<input inputmode="decimal" .value=${this._minQuantity} @input=${this._input("_minQuantity")} /></label>
              <label class="field">${t("form.note")}<textarea rows="3" .value=${this._note} @input=${this._input("_note")}></textarea></label>
            </div>
          </details>
          ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
        </form>
        <button slot="footer" class="btn text" @click=${() => this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }))}>${t("common.cancel")}</button>
        <button slot="footer" class="btn primary" ?disabled=${this._busy} @click=${() => this._save()}>${t("common.save")}</button>
      </ot-dialog>
    `;
  }
}
customElements.define("ot-node-form", OtNodeForm);
