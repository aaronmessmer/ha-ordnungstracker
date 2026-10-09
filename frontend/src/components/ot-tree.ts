import { LitElement, css, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { iconFor } from "../lib/format";
import { baseStyles } from "../lib/styles";
import type { Brief, Detail, RootView } from "../types";

/** Baum für breite Bildschirme („Baum links, Inhalt rechts“, Pflichtenheft 10.1). Lädt Ebenen erst beim Aufklappen. */
export class OtTree extends LitElement {
  static properties = {
    ctx: { attribute: false },
    currentId: { type: String },
    _children: { state: true },
    _open: { state: true },
  };
  declare ctx: AppContext;
  declare currentId: string;
  declare _children: Record<string, Brief[]>;
  declare _open: Set<string>;

  private _revision = -1;

  constructor() {
    super();
    this.currentId = "";
    this._children = {};
    this._open = new Set<string>(["_root"]);
  }

  static styles = [
    baseStyles,
    css`
      ul {
        list-style: none;
        margin: 0;
        padding-left: 14px;
      }
      ul.root {
        padding-left: 0;
      }
      .node {
        display: flex;
        align-items: center;
        gap: 2px;
        min-height: 36px;
      }
      .node .toggle {
        width: 28px;
        height: 36px;
        border: none;
        background: transparent;
        flex: none;
        --mdc-icon-size: 20px;
      }
      .node .name {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 6px;
        border: none;
        background: transparent;
        text-align: left;
        min-height: 36px;
        padding: 0 6px;
        border-radius: 6px;
        --mdc-icon-size: 20px;
      }
      .node .name:hover {
        background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
      }
      .node .name.current {
        background: color-mix(in srgb, var(--primary-color) 18%, transparent);
        font-weight: 500;
      }
      .spacer {
        width: 28px;
        flex: none;
      }
    `,
  ];

  willUpdate(): void {
    const rev = this.ctx?.revision ?? 0;
    if (rev !== this._revision) {
      this._revision = rev;
      void this._reloadOpen();
    }
  }

  private async _reloadOpen(): Promise<void> {
    for (const id of this._open) await this._load(id);
  }

  private async _load(id: string): Promise<void> {
    try {
      const view = await this.ctx.api.node(id === "_root" ? null : id);
      const contents = (view as Detail | RootView).contents.filter((c) => c.class !== "item" && c.id !== "papierkorb");
      this._children = { ...this._children, [id]: contents };
    } catch {
      /* Baum ist nur Navigationshilfe; Fehler zeigt die Seite selbst */
    }
  }

  private async _toggle(id: string): Promise<void> {
    const open = new Set(this._open);
    if (open.has(id)) open.delete(id);
    else {
      open.add(id);
      if (!this._children[id]) await this._load(id);
    }
    this._open = open;
  }

  private _branch(id: string, root = false): unknown {
    const items = this._children[id];
    if (!items) return nothing;
    return html`<ul class=${root ? "root" : ""} role=${root ? "tree" : "group"}>
      ${items.map((b) => {
        const open = this._open.has(b.id);
        const expandable = b.children > 0;
        return html`<li role="treeitem" aria-expanded=${expandable ? String(open) : nothing}>
          <div class="node">
            ${expandable
              ? html`<button class="toggle" aria-label=${open ? this.ctx.t("tree.collapse", { name: b.name }) : this.ctx.t("tree.expand", { name: b.name })} @click=${() => this._toggle(b.id)}><ha-icon icon=${open ? "mdi:chevron-down" : "mdi:chevron-right"}></ha-icon></button>`
              : html`<span class="spacer"></span>`}
            <button class="name ${b.id === this.currentId ? "current" : ""}" aria-current=${b.id === this.currentId ? "page" : nothing} @click=${() => this.ctx.go({ page: "node", id: b.id })}>
              <ha-icon icon=${iconFor(b)}></ha-icon>
              ${b.number !== null ? html`<span class="badge">${b.number}</span>` : nothing}
              <span class="ellipsis">${b.name}</span>
            </button>
          </div>
          ${open ? this._branch(b.id) : nothing}
        </li>`;
      })}
    </ul>`;
  }

  render() {
    if (!this._children["_root"]) void this._load("_root");
    return html`<nav aria-label=${this.ctx.t("tree.label")}>${this._branch("_root", true) as never}</nav>`;
  }
}
customElements.define("ot-tree", OtTree);
