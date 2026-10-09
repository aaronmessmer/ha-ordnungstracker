import { LitElement, css, html } from "lit";
import type { PathPart } from "../types";
import { baseStyles } from "../lib/styles";

/** Der Pfad ist immer sichtbar und antippbar (Pflichtenheft 10.1). */
export class OtPath extends LitElement {
  static properties = {
    path: { attribute: false },
    rootLabel: { type: String },
    current: { type: Boolean },
  };
  declare path: PathPart[];
  declare rootLabel: string;
  declare current: boolean;

  constructor() {
    super();
    this.path = [];
    this.rootLabel = "Start";
    this.current = false;
  }

  static styles = [
    baseStyles,
    css`
      nav {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0;
        font-size: 0.9rem;
      }
      button {
        border: none;
        background: transparent;
        padding: 6px 4px;
        min-height: 36px;
        color: var(--primary-color);
        border-radius: 6px;
      }
      button:hover {
        text-decoration: underline;
      }
      .sep {
        color: var(--secondary-text-color);
        --mdc-icon-size: 18px;
      }
      .here {
        padding: 6px 4px;
        color: var(--secondary-text-color);
      }
    `,
  ];

  private _go(id: string | null): void {
    this.dispatchEvent(new CustomEvent("open-node", { detail: id, bubbles: true, composed: true }));
  }

  render() {
    const parts = this.current ? this.path.slice(0, -1) : this.path;
    return html`
      <nav aria-label="Pfad">
        <button @click=${() => this._go(null)}>${this.rootLabel}</button>
        ${parts.map(
          (p) => html`
            <ha-icon class="sep" icon="mdi:chevron-right"></ha-icon>
            <button @click=${() => this._go(p.id)}>${p.name}</button>
          `,
        )}
        ${this.current && this.path.length
          ? html`<ha-icon class="sep" icon="mdi:chevron-right"></ha-icon><span class="here" aria-current="page">${this.path[this.path.length - 1].name}</span>`
          : ""}
      </nav>
    `;
  }
}
customElements.define("ot-path", OtPath);
