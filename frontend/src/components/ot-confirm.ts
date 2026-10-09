import { LitElement, css, html } from "lit";
import { baseStyles } from "../lib/styles";

/** Rückfrage – nur dort, wo etwas verloren gehen kann (Pflichtenheft 10.1). */
export class OtConfirm extends LitElement {
  static properties = {
    heading: { type: String },
    message: { type: String },
    confirmLabel: { type: String },
    cancelLabel: { type: String },
    danger: { type: Boolean },
  };
  declare heading: string;
  declare message: string;
  declare confirmLabel: string;
  declare cancelLabel: string;
  declare danger: boolean;

  constructor() {
    super();
    this.heading = "";
    this.message = "";
    this.confirmLabel = "OK";
    this.cancelLabel = "Abbrechen";
    this.danger = false;
  }

  static styles = [baseStyles, css`p { margin: 0; white-space: pre-line; line-height: 1.5; }`];

  private _fire(name: string): void {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <ot-dialog .heading=${this.heading} @close=${() => this._fire("cancel")}>
        <p>${this.message}</p>
        <button slot="footer" class="btn text" @click=${() => this._fire("cancel")}>${this.cancelLabel}</button>
        <button slot="footer" class="btn ${this.danger ? "danger" : "primary"}" @click=${() => this._fire("confirm")}>${this.confirmLabel}</button>
      </ot-dialog>
    `;
  }
}
customElements.define("ot-confirm", OtConfirm);
