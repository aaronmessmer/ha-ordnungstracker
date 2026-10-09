import { LitElement, css, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { Latest, debounce } from "../lib/latest";
import { baseStyles } from "../lib/styles";
import type { QuickPreview } from "../types";

export const PREVIEW_DELAY_MS = 250;

/**
 * Schnellerfassung (Pflichtenheft 8.3): ein großes Textfeld, eine Zeile pro Ding.
 * Die Vorschau kommt vom Server (derselbe Parser wie beim Anlegen), damit sie nie abweicht.
 */
export class OtQuickAdd extends LitElement {
  static properties = {
    ctx: { attribute: false },
    parentId: { type: String },
    parentName: { type: String },
    _text: { state: true },
    _commas: { state: true },
    _preview: { state: true },
    _error: { state: true },
    _busy: { state: true },
  };
  declare ctx: AppContext;
  declare parentId: string;
  declare parentName: string;
  declare _text: string;
  declare _commas: boolean;
  declare _preview: QuickPreview | null;
  declare _error: string;
  declare _busy: boolean;

  private _latest = new Latest();

  constructor() {
    super();
    this.parentId = "";
    this.parentName = "";
    this._text = "";
    this._commas = false;
    this._preview = null;
    this._error = "";
    this._busy = false;
  }

  static styles = [
    baseStyles,
    css`
      textarea {
        min-height: 160px;
        font-size: 1rem;
        line-height: 1.5;
      }
      ul.preview {
        margin: 0;
        padding: 0;
        list-style: none;
        font-size: 0.95rem;
        line-height: 1.6;
      }
      .hint {
        font-size: 0.85rem;
        color: var(--secondary-text-color);
        line-height: 1.5;
      }
      code {
        background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
        padding: 0 4px;
        border-radius: 4px;
      }
    `,
  ];

  private _refresh = debounce(async () => {
    if (!this._text.trim()) {
      this._latest.cancel();
      this._preview = null;
      return;
    }
    try {
      const result = await this._latest.run(() => this.ctx.api.quickPreview(this._text, this._commas));
      if (result) {
        this._preview = result;
        this._error = "";
      }
    } catch (err) {
      this._error = errorMessage(err);
    }
  }, PREVIEW_DELAY_MS);

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._refresh.cancel();
    this._latest.cancel();
  }

  private _edit(text: string, commas = this._commas): void {
    this._text = text;
    this._commas = commas;
    this._refresh();
  }

  private async _apply(): Promise<void> {
    if (!this._preview?.count) return;
    this._busy = true;
    try {
      const result = await this.ctx.api.quickApply(this.parentId, this._text, this._commas);
      this.dispatchEvent(new CustomEvent("saved", { detail: { count: result.created.length }, bubbles: true, composed: true }));
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  render() {
    const t = this.ctx.t;
    const count = this._preview?.count ?? 0;
    return html`
      <ot-dialog .heading=${t("quick.title", { name: this.parentName })} .closeLabel=${t("common.close")} wide>
        <div class="stack">
          <textarea
            aria-label=${t("quick.title", { name: this.parentName })}
            placeholder=${t("quick.placeholder")}
            .value=${this._text}
            @input=${(e: Event) => this._edit((e.target as HTMLTextAreaElement).value)}
          ></textarea>
          <label class="check">
            <input type="checkbox" .checked=${this._commas} @change=${(e: Event) => this._edit(this._text, (e.target as HTMLInputElement).checked)} />
            ${t("quick.commas")}
          </label>
          <div class="hint">${t("quick.help")}</div>
          ${this._preview && count > 0
            ? html`
                <div>
                  <h3>${t("quick.preview", { n: count })}</h3>
                  <ul class="preview" aria-live="polite">
                    ${this._preview.preview.map((line) => html`<li style="white-space:pre">${line}</li>`)}
                  </ul>
                </div>
              `
            : nothing}
          ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
        </div>
        <button slot="footer" class="btn text" @click=${() => this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }))}>${t("common.cancel")}</button>
        <button slot="footer" class="btn primary" ?disabled=${this._busy || count === 0} @click=${this._apply}>${t("quick.apply", { n: count })}</button>
      </ot-dialog>
    `;
  }
}
customElements.define("ot-quickadd", OtQuickAdd);
