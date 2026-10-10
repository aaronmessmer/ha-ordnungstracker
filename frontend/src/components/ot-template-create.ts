import { LitElement, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { countTemplateNodes } from "../lib/templates";
import { baseStyles } from "../lib/styles";

/** Neuen Eintrag aus einer Vorlage anlegen (Pflichtenheft 5.11, 8.2): Art, Schlagwörter und Unterpunkte sind schon da. */
export class OtTemplateCreate extends LitElement {
  static properties = {
    ctx: { attribute: false },
    parentId: { attribute: false },
    _template: { state: true },
    _name: { state: true },
    _error: { state: true },
    _busy: { state: true },
  };
  declare ctx: AppContext;
  declare parentId: string | null;
  declare _template: string;
  declare _name: string;
  declare _error: string;
  declare _busy: boolean;

  constructor() {
    super();
    this.parentId = null;
    this._template = "";
    this._name = "";
    this._error = "";
    this._busy = false;
  }

  static styles = [baseStyles];

  connectedCallback(): void {
    super.connectedCallback();
    this._template = this.ctx.catalog?.templates[0]?.id ?? "";
  }

  private async _save(): Promise<void> {
    if (!this._template) return;
    this._busy = true;
    try {
      const made = await this.ctx.api.createFromTemplate({
        template: this._template,
        ...(this.parentId ? { parent: this.parentId } : {}),
        ...(this._name.trim() ? { name: this._name.trim() } : {}),
      });
      this.dispatchEvent(new CustomEvent("saved", { detail: { kind: "created", id: made.id, name: made.name }, bubbles: true, composed: true }));
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  render() {
    const t = this.ctx.t;
    const templates = this.ctx.catalog?.templates ?? [];
    const chosen = templates.find((x) => x.id === this._template);
    return html`<ot-dialog .heading=${t("templates.createTitle")} .closeLabel=${t("common.close")}>
      <div class="stack">
        <label class="field">${t("templates.which")}
          <select .value=${this._template} @change=${(e: Event) => (this._template = (e.target as HTMLSelectElement).value)}>
            ${templates.map((x) => html`<option value=${x.id} ?selected=${x.id === this._template}>${x.name}</option>`)}
          </select></label>
        ${chosen ? html`<div class="small muted">${t("templates.parts", { n: countTemplateNodes(chosen.children) })}</div>` : nothing}
        <label class="field">${t("templates.nameOptional")}<input .value=${this._name} placeholder=${chosen?.name ?? ""} autocomplete="off" @input=${(e: Event) => (this._name = (e.target as HTMLInputElement).value)} /></label>
        ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
      </div>
      <button slot="footer" class="btn text" @click=${() => this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }))}>${t("common.cancel")}</button>
      <button slot="footer" class="btn primary" ?disabled=${this._busy || !this._template} @click=${this._save}>${t("templates.create")}</button>
    </ot-dialog>`;
  }
}
customElements.define("ot-template-create", OtTemplateCreate);
