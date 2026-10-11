import { LitElement, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { parseList } from "../lib/format";
import { baseStyles } from "../lib/styles";

/** Synonymgruppen (Pflichtenheft 5.12): Die Suche erweitert einen Begriff um alle Mitglieder seiner Gruppe. */
export class OtSettingsSynonyms extends LitElement {
  static properties = {
    ctx: { attribute: false },
    _index: { state: true },
    _text: { state: true },
    _error: { state: true },
  };
  declare ctx: AppContext;
  declare _index: number | null; // -1 = neue Gruppe
  declare _text: string;
  declare _error: string;

  constructor() {
    super();
    this._index = null;
    this._text = "";
    this._error = "";
  }

  static styles = [baseStyles];

  private get _groups(): string[][] {
    return this.ctx.catalog?.synonyms ?? [];
  }

  private _edit(i: number): void {
    this._error = "";
    this._index = i;
    this._text = i >= 0 ? this._groups[i].join(", ") : "";
  }

  private async _store(groups: string[][], message: string): Promise<boolean> {
    try {
      await this.ctx.api.synonyms(groups);
      await this.ctx.reloadCatalog();
      this.ctx.toast(message);
      return true;
    } catch (err) {
      this._error = errorMessage(err);
      return false;
    }
  }

  private async _save(): Promise<void> {
    const terms = parseList(this._text);
    if (terms.length < 2) {
      this._error = this.ctx.t("synonyms.atLeastTwo");
      return;
    }
    const groups = this._groups.map((g) => [...g]);
    if (this._index !== null && this._index >= 0) groups[this._index] = terms;
    else groups.push(terms);
    if (await this._store(groups, this.ctx.t("form.saved"))) this._index = null;
  }

  private async _delete(): Promise<void> {
    if (this._index === null || this._index < 0) return;
    const groups = this._groups.filter((_, i) => i !== this._index);
    if (await this._store(groups, this.ctx.t("synonyms.deleted"))) this._index = null;
  }

  render() {
    const t = this.ctx.t;
    const groups = this._groups;
    return html`
      <p class="muted small" style="margin:0 4px 10px">${t("synonyms.help")}</p>
      ${groups.length
        ? html`<div class="list">${groups.map((g, i) => html`<button class="item" style="width:100%" @click=${() => this._edit(i)}>
            <ha-icon class="icon" icon="mdi:equal"></ha-icon><span class="grow">${g.join(" = ")}</span><ha-icon class="icon" icon="mdi:pencil"></ha-icon></button>`)}</div>`
        : html`<div class="empty small">${t("synonyms.none")}</div>`}
      <div style="margin-top:12px"><button class="btn primary" @click=${() => this._edit(-1)}><ha-icon icon="mdi:plus"></ha-icon>${t("synonyms.new")}</button></div>
      ${this._index !== null
        ? html`<ot-dialog .heading=${this._index >= 0 ? t("synonyms.edit") : t("synonyms.new")} .closeLabel=${t("common.close")} @close=${() => (this._index = null)}>
            <label class="field">${t("synonyms.terms")}
              <textarea rows="3" .value=${this._text} placeholder="Tacker, Hefter, Klammermaschine" @input=${(e: Event) => (this._text = (e.target as HTMLTextAreaElement).value)}></textarea>
              <span class="small muted">${t("synonyms.termsHelp")}</span></label>
            ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
            ${this._index >= 0 ? html`<button slot="footer" class="btn danger" @click=${this._delete}>${t("common.delete")}</button><span slot="footer" class="grow"></span>` : nothing}
            <button slot="footer" class="btn primary" @click=${this._save}>${t("common.save")}</button>
          </ot-dialog>`
        : nothing}
    `;
  }
}
customElements.define("ot-settings-synonyms", OtSettingsSynonyms);
