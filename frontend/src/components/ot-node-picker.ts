import { LitElement, css, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { asNumberQuery, pathText } from "../lib/format";
import { Latest, debounce } from "../lib/latest";
import { baseStyles } from "../lib/styles";
import type { Hit } from "../types";

/** Einen Eintrag per Suche (oder Nummer) wählen, z. B. als Geltungsbereich eines Feldes. */
export class OtNodePicker extends LitElement {
  static properties = {
    ctx: { attribute: false },
    label: { type: String },
    value: { type: String },
    valueName: { type: String },
    _query: { state: true },
    _hits: { state: true },
  };
  declare ctx: AppContext;
  declare label: string;
  declare value: string;
  declare valueName: string;
  declare _query: string;
  declare _hits: Hit[];

  private _latest = new Latest();

  constructor() {
    super();
    this.label = "";
    this.value = "";
    this.valueName = "";
    this._query = "";
    this._hits = [];
  }

  static styles = [
    baseStyles,
    css`
      .hits {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        overflow: hidden;
        margin-top: 4px;
      }
      .hits button {
        display: block;
        width: 100%;
        min-height: 44px;
        text-align: left;
        border: none;
        border-bottom: 1px solid var(--divider-color);
        background: transparent;
        padding: 6px 12px;
      }
      .hits button:last-child {
        border-bottom: none;
      }
      .hits button:hover {
        background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
      }
    `,
  ];

  private _search = debounce(async () => {
    const q = this._query.trim();
    if (!q) {
      this._latest.cancel();
      this._hits = [];
      return;
    }
    const number = asNumberQuery(q);
    try {
      if (number !== null) {
        const d = await this._latest.run(() => this.ctx.api.byNumber(number).catch(() => null));
        if (d !== undefined) this._hits = d ? [{ id: d.id, name: d.name, kind: d.kind, class: d.class, number: d.number, path: d.path, owner: null, owner_inherited: false, hints: [], matched_in: "", archived: false }] : [];
        return;
      }
      const res = await this._latest.run(() => this.ctx.api.search(q, {}, 6));
      if (res) this._hits = res.hits;
    } catch {
      this._hits = [];
    }
  }, 250);

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._search.cancel();
  }

  private _pick(h: Hit): void {
    this._query = "";
    this._hits = [];
    this.dispatchEvent(new CustomEvent("picked", { detail: { id: h.id, name: h.name }, bubbles: true, composed: true }));
  }

  private _clear(): void {
    this.dispatchEvent(new CustomEvent("picked", { detail: { id: "", name: "" }, bubbles: true, composed: true }));
  }

  render() {
    const t = this.ctx.t;
    if (this.value) {
      return html`<div class="field"><span>${this.label}</span>
        <div class="row"><span class="chip">${this.valueName || this.value}</span><button class="btn text" @click=${this._clear}>${t("picker.change")}</button></div></div>`;
    }
    return html`<label class="field">${this.label}
      <input type="search" .value=${this._query} placeholder=${t("picker.placeholder")} autocomplete="off" @input=${(e: Event) => { this._query = (e.target as HTMLInputElement).value; this._search(); }} />
    </label>
    ${this._hits.length
      ? html`<div class="hits" role="listbox">${this._hits.map((h) => html`<button role="option" @click=${() => this._pick(h)}>
          <span>${h.number !== null ? `${h.number} · ` : ""}${h.name}</span>
          <span class="small muted" style="display:block">${pathText(h.path, false)}</span></button>`)}</div>`
      : nothing}`;
  }
}
customElements.define("ot-node-picker", OtNodePicker);
