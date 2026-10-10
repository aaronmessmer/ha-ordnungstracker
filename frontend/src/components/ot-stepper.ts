import { LitElement, css, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { quantityText } from "../lib/format";
import { baseStyles } from "../lib/styles";

/** Plus und Minus für die Menge direkt in der Liste (Pflichtenheft 8.7). Ruft den Server selbst auf. */
export class OtStepper extends LitElement {
  static properties = {
    ctx: { attribute: false },
    nodeId: { type: String },
    itemName: { type: String },
    quantity: { type: Number },
    unit: { type: String },
    _busy: { state: true },
  };
  declare ctx: AppContext;
  declare nodeId: string;
  declare itemName: string;
  declare quantity: number | null;
  declare unit: string;
  declare _busy: boolean;

  constructor() {
    super();
    this.nodeId = "";
    this.itemName = "";
    this.quantity = null;
    this.unit = "";
    this._busy = false;
  }

  static styles = [
    baseStyles,
    css`
      :host {
        display: inline-flex;
        flex: none;
        margin-right: 8px;
      }
      .stepper {
        display: inline-flex;
        align-items: center;
        gap: 2px;
      }
      .stepper button {
        width: 40px;
        height: 40px;
        min-height: 40px;
        border-radius: 50%;
        border: 1px solid var(--divider-color);
        background: transparent;
        color: var(--primary-text-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }
      .stepper button:hover {
        background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
      }
      .stepper button[disabled] {
        opacity: 0.4;
      }
      .value {
        min-width: 3.4em;
        font-size: 0.95rem;
        text-align: center;
        font-variant-numeric: tabular-nums;
      }
    `,
  ];

  private async _step(delta: number): Promise<void> {
    if (this._busy) return;
    this._busy = true;
    try {
      const res = await this.ctx.api.quantityStep(this.nodeId, delta);
      this.quantity = res.quantity;
      this.dispatchEvent(new CustomEvent("quantity-changed", { detail: res, bubbles: true, composed: true }));
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    } finally {
      this._busy = false;
    }
  }

  render() {
    if (this.quantity === null || this.quantity === undefined) return nothing;
    const t = this.ctx.t;
    const label = this.itemName || "";
    return html`<span class="stepper" role="group" aria-label=${t("quantity.group", { name: label })}>
      <button type="button" aria-label=${t("quantity.less", { name: label })} ?disabled=${this._busy || this.quantity <= 0} @click=${() => this._step(-1)}><ha-icon icon="mdi:minus"></ha-icon></button>
      <span class="value" aria-live="polite">${quantityText({ quantity: this.quantity, unit: this.unit })}</span>
      <button type="button" aria-label=${t("quantity.more", { name: label })} ?disabled=${this._busy} @click=${() => this._step(1)}><ha-icon icon="mdi:plus"></ha-icon></button>
    </span>`;
  }
}
customElements.define("ot-stepper", OtStepper);
