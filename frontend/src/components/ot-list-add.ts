import { LitElement, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { parseNumber } from "../lib/format";
import { baseStyles } from "../lib/styles";

/** Einen Eintrag auf eine Liste setzen (Pflichtenheft 5.10): vorhandene Liste wählen oder gleich eine neue anlegen. */
export class OtListAdd extends LitElement {
  static properties = {
    ctx: { attribute: false },
    nodeId: { type: String },
    itemName: { type: String },
    _list: { state: true },
    _newName: { state: true },
    _quantity: { state: true },
    _note: { state: true },
    _error: { state: true },
    _busy: { state: true },
  };
  declare ctx: AppContext;
  declare nodeId: string;
  declare itemName: string;
  declare _list: string;
  declare _newName: string;
  declare _quantity: string;
  declare _note: string;
  declare _error: string;
  declare _busy: boolean;

  constructor() {
    super();
    this.nodeId = "";
    this.itemName = "";
    this._list = "";
    this._newName = "";
    this._quantity = "";
    this._note = "";
    this._error = "";
    this._busy = false;
  }

  static styles = [baseStyles];

  connectedCallback(): void {
    super.connectedCallback();
    this._list = this.ctx.catalog?.lists[0]?.id ?? "";
  }

  private async _save(): Promise<void> {
    const t = this.ctx.t;
    const quantity = parseNumber(this._quantity);
    if (quantity === undefined) {
      this._error = t("form.numberInvalid");
      return;
    }
    this._busy = true;
    try {
      let listId = this._list;
      let listName = this.ctx.catalog?.lists.find((l) => l.id === listId)?.name ?? "";
      if (!listId) {
        const name = this._newName.trim();
        if (!name) {
          this._error = t("lists.nameNeeded");
          return;
        }
        const created = await this.ctx.api.listCreate(name);
        listId = created.id;
        listName = created.name;
        await this.ctx.reloadCatalog();
      }
      await this.ctx.api.listEntryAdd(listId, {
        node: this.nodeId,
        ...(quantity !== null ? { quantity } : {}),
        ...(this._note.trim() ? { note: this._note.trim() } : {}),
      });
      this.dispatchEvent(new CustomEvent("saved", { detail: { kind: "list-added", name: listName }, bubbles: true, composed: true }));
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  render() {
    const t = this.ctx.t;
    const lists = this.ctx.catalog?.lists ?? [];
    return html`<ot-dialog .heading=${t("lists.addTitle", { name: this.itemName })} .closeLabel=${t("common.close")}>
      <div class="stack">
        <label class="field">${t("lists.which")}
          <select .value=${this._list} @change=${(e: Event) => (this._list = (e.target as HTMLSelectElement).value)}>
            ${lists.map((l) => html`<option value=${l.id} ?selected=${l.id === this._list}>${l.name}</option>`)}
            <option value="" ?selected=${this._list === ""}>${t("lists.newOption")}</option>
          </select></label>
        ${this._list === "" ? html`<label class="field">${t("lists.newName")} *<input .value=${this._newName} placeholder=${t("lists.namePlaceholder")} autocomplete="off" @input=${(e: Event) => (this._newName = (e.target as HTMLInputElement).value)} /></label>` : nothing}
        <label class="field">${t("form.quantity")}<input inputmode="decimal" .value=${this._quantity} @input=${(e: Event) => (this._quantity = (e.target as HTMLInputElement).value)} /></label>
        <label class="field">${t("form.note")}<input .value=${this._note} @input=${(e: Event) => (this._note = (e.target as HTMLInputElement).value)} /></label>
        ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
      </div>
      <button slot="footer" class="btn text" @click=${() => this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }))}>${t("common.cancel")}</button>
      <button slot="footer" class="btn primary" ?disabled=${this._busy} @click=${this._save}>${t("common.save")}</button>
    </ot-dialog>`;
  }
}
customElements.define("ot-list-add", OtListAdd);
