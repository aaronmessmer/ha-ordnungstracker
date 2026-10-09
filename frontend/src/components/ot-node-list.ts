import { LitElement, css, html, nothing } from "lit";
import { hintTone } from "../lib/format";
import type { Row } from "../lib/rows";
import { baseStyles } from "../lib/styles";
import type { Selection } from "../lib/selection";

export const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE = 10;
const BATCH = 100;

/**
 * Liste von Einträgen. Antippen öffnet; langes Drücken (oder Rechtsklick) startet die
 * Mehrfachauswahl. Lange Listen werden in Portionen nachgeladen, damit sie flüssig bleiben.
 */
export class OtNodeList extends LitElement {
  static properties = {
    rows: { attribute: false },
    selection: { attribute: false },
    selectable: { type: Boolean },
    showCounts: { type: Boolean },
    label: { type: String },
    _limit: { state: true },
  };
  declare rows: Row[];
  declare selection: Selection | null;
  declare selectable: boolean;
  declare showCounts: boolean;
  declare label: string;
  declare _limit: number;

  /** Texte für Screenreader. */
  texts = { selected: "ausgewählt", items: "Einträge" };

  constructor() {
    super();
    this.rows = [];
    this.selection = null;
    this.selectable = false;
    this.showCounts = true;
    this.label = "";
    this._limit = BATCH;
  }

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }
      .sentinel {
        height: 1px;
      }
      .counts {
        font-size: 0.8rem;
        color: var(--secondary-text-color);
        white-space: nowrap;
      }
      .chips {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-top: 4px;
      }
      .check {
        color: var(--primary-color);
      }
    `,
  ];

  private _timer: ReturnType<typeof setTimeout> | undefined;
  private _origin: { x: number; y: number } | null = null;
  private _suppressClick = false;
  private _observer: IntersectionObserver | undefined;

  willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("rows")) this._limit = BATCH;
  }

  protected updated(): void {
    this._observer?.disconnect();
    const sentinel = this.renderRoot.querySelector(".sentinel");
    if (sentinel && typeof IntersectionObserver !== "undefined") {
      this._observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) this._limit += BATCH;
      });
      this._observer.observe(sentinel);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
    clearTimeout(this._timer);
  }

  private _fire(name: string, id: string): void {
    this.dispatchEvent(new CustomEvent(name, { detail: id, bubbles: true, composed: true }));
  }

  private _down(e: PointerEvent, id: string): void {
    if (!this.selectable || e.button !== 0) return;
    this._origin = { x: e.clientX, y: e.clientY };
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this._suppressClick = true;
      this.selection?.start(id);
      this._changed();
    }, LONG_PRESS_MS);
  }

  private _move(e: PointerEvent): void {
    if (!this._origin) return;
    if (Math.hypot(e.clientX - this._origin.x, e.clientY - this._origin.y) > MOVE_TOLERANCE) this._cancel();
  }

  private _cancel(): void {
    clearTimeout(this._timer);
    this._origin = null;
  }

  private _click(id: string): void {
    this._cancel();
    if (this._suppressClick) {
      this._suppressClick = false;
      return;
    }
    if (this.selectable && this.selection?.active) {
      this.selection.toggle(id);
      this._changed();
    } else {
      this._fire("open-node", id);
    }
  }

  private _context(e: Event, id: string): void {
    if (!this.selectable) return;
    e.preventDefault();
    this._cancel();
    if (!this.selection?.has(id)) this.selection?.start(id);
    this._changed();
  }

  private _key(e: KeyboardEvent, id: string): void {
    if (e.key !== " " || !this.selectable || !this.selection) return;
    e.preventDefault();
    if (this.selection.active) this.selection.toggle(id);
    else this.selection.start(id);
    this._changed();
  }

  private _changed(): void {
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent("selection-changed", { bubbles: true, composed: true }));
  }

  render() {
    const shown = this.rows.slice(0, this._limit);
    return html`
      <div class="list" role="list" aria-label=${this.label}>
        ${shown.map((r) => this._row(r))}
        ${this.rows.length > this._limit ? html`<div class="sentinel"></div>` : nothing}
      </div>
    `;
  }

  private _row(r: Row) {
    const selected = this.selection?.has(r.id) ?? false;
    const selecting = this.selection?.active ?? false;
    return html`
      <button
        class="item ${selected ? "selected" : ""}"
        role="listitem"
        aria-label=${`${r.number !== null ? `${r.number} ` : ""}${r.name}${selected ? `, ${this.texts.selected}` : ""}`}
        @pointerdown=${(e: PointerEvent) => this._down(e, r.id)}
        @pointermove=${this._move}
        @pointerup=${this._cancel}
        @pointercancel=${this._cancel}
        @pointerleave=${this._cancel}
        @click=${() => this._click(r.id)}
        @contextmenu=${(e: Event) => this._context(e, r.id)}
        @keydown=${(e: KeyboardEvent) => this._key(e, r.id)}
      >
        ${selecting
          ? html`<ha-icon class="icon check" icon=${selected ? "mdi:checkbox-marked-circle" : "mdi:checkbox-blank-circle-outline"}></ha-icon>`
          : html`<ha-icon class="icon" icon=${r.icon}></ha-icon>`}
        <span class="grow">
          <span class="row">
            ${r.number !== null ? html`<span class="badge">${r.number}</span>` : nothing}
            <span class="title ellipsis ${r.archived ? "muted" : ""}">${r.name}</span>
          </span>
          ${r.subtitle ? html`<span class="small muted ellipsis" style="display:block">${r.subtitle}</span>` : nothing}
          ${r.hints.length
            ? html`<span class="chips">${r.hints.slice(0, 2).map((h) => html`<span class="chip ${hintTone(h)}">${h.text}</span>`)}</span>`
            : nothing}
        </span>
        ${this.showCounts && r.counts
          ? html`<span class="counts" title=${`${r.counts[0]} / ${r.counts[1]}`}>${r.counts[0]}${r.counts[1] !== r.counts[0] ? ` · ${r.counts[1]}` : ""}</span>`
          : nothing}
        ${selecting ? nothing : html`<ha-icon class="icon" icon="mdi:chevron-right"></ha-icon>`}
      </button>
    `;
  }
}
customElements.define("ot-node-list", OtNodeList);
