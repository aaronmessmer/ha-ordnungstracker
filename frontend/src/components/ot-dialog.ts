import { LitElement, css, html } from "lit";
import { baseStyles } from "../lib/styles";

/**
 * Einfacher Dialog (auf dem Handy ein Blatt von unten, am PC mittig).
 * Schließt mit Esc, Tippen neben den Dialog oder dem Schließen-Knopf; Fokus bleibt darin.
 */
export class OtDialog extends LitElement {
  static properties = {
    heading: { type: String },
    closeLabel: { type: String },
    wide: { type: Boolean },
  };
  declare heading: string;
  declare closeLabel: string;
  declare wide: boolean;

  constructor() {
    super();
    this.heading = "";
    this.closeLabel = "Schließen";
    this.wide = false;
  }

  static styles = [
    baseStyles,
    css`
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 20;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .dialog {
        background: var(--card-background-color, #fff);
        color: var(--primary-text-color);
        border-radius: var(--ot-radius);
        width: min(560px, 100vw - 32px);
        max-height: calc(100dvh - 32px);
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
      }
      .dialog.wide {
        width: min(760px, 100vw - 32px);
      }
      header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 8px 8px 20px;
        border-bottom: 1px solid var(--divider-color);
      }
      header h2 {
        flex: 1;
        font-size: 1.2rem;
      }
      .body {
        padding: 16px 20px;
        overflow-y: auto;
        flex: 1;
      }
      footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 12px 20px;
        border-top: 1px solid var(--divider-color);
      }
      footer:not(:has(*)) {
        display: none;
      }
      @media (max-width: 600px) {
        .backdrop {
          align-items: flex-end;
        }
        .dialog,
        .dialog.wide {
          width: 100vw;
          max-height: 94dvh;
          border-radius: var(--ot-radius) var(--ot-radius) 0 0;
        }
      }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    this._previous = document.activeElement as HTMLElement | null;
    this.addEventListener("keydown", this._keydown);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this._keydown);
    this._previous?.focus?.();
  }

  private _previous: HTMLElement | null = null;

  protected firstUpdated(): void {
    // erstes Eingabefeld bekommt den Fokus, sonst der Dialog selbst
    const slotted = this.querySelector<HTMLElement>("input, textarea, select");
    (slotted ?? this.renderRoot.querySelector<HTMLElement>(".dialog"))?.focus();
  }

  private _keydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      this._close();
    } else if (e.key === "Tab") {
      // Fokus im Dialog halten
      const focusable = [
        ...this.renderRoot.querySelectorAll<HTMLElement>("button, [href]"),
        ...this.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, summary"),
      ].filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = (this.getRootNode() as Document | ShadowRoot).activeElement;
      if (e.shiftKey && (active === first || active === this)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  private _close(): void {
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="backdrop" @click=${(e: Event) => e.target === e.currentTarget && this._close()}>
        <div class="dialog ${this.wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-label=${this.heading} tabindex="-1">
          <header>
            <h2>${this.heading}</h2>
            <button class="icon-btn" aria-label=${this.closeLabel} @click=${this._close}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </header>
          <div class="body"><slot></slot></div>
          <footer><slot name="footer"></slot></footer>
        </div>
      </div>
    `;
  }
}
customElements.define("ot-dialog", OtDialog);
