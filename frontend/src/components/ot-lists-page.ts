import { LitElement, css, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { Latest } from "../lib/latest";
import { parseNumber } from "../lib/format";
import { canAdmin, openPrint } from "../lib/print";
import { baseStyles } from "../lib/styles";
import type { ListEntry, ListView } from "../types";
import "./ot-node-picker";

type Dialog = "new" | "rename" | "add" | null;

/**
 * Listen und Sets (Pflichtenheft 5.10): Packlisten quer zum Baum. Ohne `listId` die Übersicht der Listen,
 * sonst eine Liste zum Abhaken, nach Raum gruppiert („Raum für Raum zusammensuchen“).
 */
export class OtListsPage extends LitElement {
  static properties = {
    ctx: { attribute: false },
    listId: { type: String },
    _view: { state: true },
    _error: { state: true },
    _dialog: { state: true },
    _name: { state: true },
    _addMode: { state: true },
    _addNode: { state: true },
    _addNodeName: { state: true },
    _addText: { state: true },
    _addQuantity: { state: true },
    _addNote: { state: true },
    _menu: { state: true },
  };
  declare ctx: AppContext;
  declare listId: string;
  declare _view: ListView | null;
  declare _error: string;
  declare _dialog: Dialog;
  declare _name: string;
  declare _addMode: "node" | "text";
  declare _addNode: string;
  declare _addNodeName: string;
  declare _addText: string;
  declare _addQuantity: string;
  declare _addNote: string;
  declare _menu: boolean;

  private _latest = new Latest();
  private _loaded: { id: string; revision: number } | null = null;

  constructor() {
    super();
    this.listId = "";
    this._view = null;
    this._error = "";
    this._dialog = null;
    this._name = "";
    this._addMode = "node";
    this._addNode = "";
    this._addNodeName = "";
    this._addText = "";
    this._addQuantity = "";
    this._addNote = "";
    this._menu = false;
  }

  static styles = [
    baseStyles,
    css`
      .entry {
        display: flex;
        align-items: center;
        gap: 4px;
        border-bottom: 1px solid var(--divider-color);
        min-height: 56px;
        padding: 0 4px 0 0;
      }
      .entry:last-child {
        border-bottom: none;
      }
      .entry .box {
        flex: none;
        width: 52px;
        height: 52px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        color: var(--primary-color);
      }
      .entry .text {
        flex: 1;
        min-width: 0;
        padding: 6px 0;
        text-align: left;
        border: none;
        background: transparent;
        color: inherit;
      }
      .entry.done .title {
        text-decoration: line-through;
        opacity: 0.55;
      }
      .menu {
        position: relative;
      }
      .menu .pop {
        position: absolute;
        right: 0;
        top: 100%;
        z-index: 6;
        min-width: 230px;
        background: var(--card-background-color, #fff);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        padding: 4px 0;
      }
      .menu .pop button {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        min-height: 44px;
        padding: 0 16px;
        border: none;
        background: transparent;
        text-align: left;
      }
      .menu .pop button:hover {
        background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
      }
    `,
  ];

  willUpdate(changed: Map<string, unknown>): void {
    const rev = this.ctx?.revision ?? 0;
    if (!this.listId) {
      this._view = null;
      return;
    }
    if (!this._loaded || changed.has("listId") || this._loaded.revision !== rev) {
      this._loaded = { id: this.listId, revision: rev };
      void this._load();
    }
  }

  private async _load(): Promise<void> {
    const id = this.listId;
    try {
      const view = await this._latest.run(() => this.ctx.api.list(id));
      if (view) {
        this._view = view;
        this._error = "";
      }
    } catch (err) {
      this._view = null;
      this._error = errorMessage(err);
    }
  }

  private _fail(err: unknown): void {
    this.ctx.toast(errorMessage(err), "error");
  }

  private async _toggle(e: ListEntry): Promise<void> {
    // Sofort anzeigen; der Server bestätigt, ein Fehler stellt den alten Stand wieder her.
    e.checked = !e.checked;
    this.requestUpdate();
    try {
      await this.ctx.api.listEntryUpdate(this.listId, e.id, { checked: !!e.checked });
    } catch (err) {
      e.checked = !e.checked;
      this.requestUpdate();
      this._fail(err);
    }
  }

  private async _remove(e: ListEntry): Promise<void> {
    try {
      await this.ctx.api.listEntryRemove(this.listId, e.id);
      this.ctx.toast(this.ctx.t("lists.entryRemoved", { name: e.name }));
    } catch (err) {
      this._fail(err);
    }
  }

  private async _reset(): Promise<void> {
    this._menu = false;
    try {
      const r = await this.ctx.api.listReset(this.listId);
      this.ctx.toast(this.ctx.t("lists.resetDone", { n: r.reset }));
    } catch (err) {
      this._fail(err);
    }
  }

  private async _delete(): Promise<void> {
    this._menu = false;
    const t = this.ctx.t;
    const v = this._view;
    if (!v) return;
    const ok = await this.ctx.confirm({
      title: t("lists.deleteTitle", { name: v.name }),
      message: t("lists.deleteMessage"),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    try {
      await this.ctx.api.listDelete(v.id);
      await this.ctx.reloadCatalog();
      this.ctx.toast(t("lists.deleted"));
      this.ctx.go({ page: "lists" }, { replace: true });
    } catch (err) {
      this._fail(err);
    }
  }

  private async _saveName(): Promise<void> {
    const name = this._name.trim();
    if (!name) {
      this._error = this.ctx.t("form.nameRequired");
      return;
    }
    try {
      if (this._dialog === "new") {
        const created = await this.ctx.api.listCreate(name);
        await this.ctx.reloadCatalog();
        this._dialog = null;
        this.ctx.go({ page: "list", id: created.id });
      } else {
        await this.ctx.api.listRename(this.listId, name);
        await this.ctx.reloadCatalog();
        this._dialog = null;
      }
      this._error = "";
    } catch (err) {
      this._error = errorMessage(err);
    }
  }

  private async _saveEntry(): Promise<void> {
    const t = this.ctx.t;
    const quantity = parseNumber(this._addQuantity);
    if (quantity === undefined) {
      this._error = t("form.numberInvalid");
      return;
    }
    if (this._addMode === "node" && !this._addNode) {
      this._error = t("lists.pickNode");
      return;
    }
    if (this._addMode === "text" && !this._addText.trim()) {
      this._error = t("lists.textRequired");
      return;
    }
    try {
      await this.ctx.api.listEntryAdd(this.listId, {
        ...(this._addMode === "node" ? { node: this._addNode } : { text: this._addText.trim() }),
        ...(quantity !== null ? { quantity } : {}),
        ...(this._addNote.trim() ? { note: this._addNote.trim() } : {}),
      });
      this._dialog = null;
      this._error = "";
      this.ctx.toast(t("lists.entryAdded"));
    } catch (err) {
      this._error = errorMessage(err);
    }
  }

  private _openAdd(): void {
    this._addMode = "node";
    this._addNode = "";
    this._addNodeName = "";
    this._addText = "";
    this._addQuantity = "";
    this._addNote = "";
    this._error = "";
    this._dialog = "add";
  }

  render() {
    return html`${this.listId ? this._viewPage() : this._index()}${this._dialogs()}`;
  }

  // ---- Übersicht der Listen ----------------------------------------------------------
  private _index() {
    const t = this.ctx.t;
    const lists = this.ctx.catalog?.lists ?? [];
    return html`
      <div class="row" style="margin:4px 0 12px">
        <h1 class="grow" style="font-size:1.5rem;font-weight:500">${t("lists.title")}</h1>
        <button class="btn primary" @click=${() => { this._name = ""; this._error = ""; this._dialog = "new"; }}><ha-icon icon="mdi:plus"></ha-icon>${t("lists.new")}</button>
      </div>
      ${lists.length
        ? html`<div class="list">${lists.map((l) => html`<button class="item" @click=${() => this.ctx.go({ page: "list", id: l.id })}>
            <ha-icon class="icon" icon="mdi:format-list-checks"></ha-icon>
            <span class="grow"><span class="title">${l.name}</span><span class="small muted" style="display:block">${t("lists.count", { n: l.entries })}</span></span>
            <ha-icon class="icon" icon="mdi:chevron-right"></ha-icon></button>`)}</div>`
        : html`<div class="empty"><ha-icon icon="mdi:format-list-checks"></ha-icon><p>${t("lists.none")}</p></div>`}
    `;
  }

  // ---- Eine Liste ------------------------------------------------------------------
  private _viewPage() {
    const t = this.ctx.t;
    const v = this._view;
    if (this._error && !v) {
      return html`<div class="empty"><p class="error-text" role="alert">${this._error}</p><button class="btn" @click=${() => this.ctx.go({ page: "lists" })}>${t("lists.title")}</button></div>`;
    }
    if (!v) return html`<div class="empty muted">${t("common.loading")}</div>`;
    const all = v.groups.flatMap((g) => g.entries);
    const done = all.filter((e) => e.checked).length;
    return html`
      <div class="row" style="margin:4px 0 4px">
        <h1 class="grow" style="font-size:1.5rem;font-weight:500;word-break:break-word">${v.name}</h1>
        <div class="menu">
          <button class="icon-btn" aria-label=${t("node.more")} aria-haspopup="true" aria-expanded=${this._menu ? "true" : "false"} @click=${() => (this._menu = !this._menu)}><ha-icon icon="mdi:dots-vertical"></ha-icon></button>
          ${this._menu
            ? html`<div class="pop" role="menu">
                <button role="menuitem" @click=${() => { this._menu = false; this._name = v.name; this._error = ""; this._dialog = "rename"; }}><ha-icon icon="mdi:pencil"></ha-icon>${t("lists.rename")}</button>
                <button role="menuitem" @click=${this._reset}><ha-icon icon="mdi:checkbox-blank-outline"></ha-icon>${t("lists.reset")}</button>
                <button role="menuitem" @click=${() => { this._menu = false; void openPrint(this.ctx, "packlist", { list: v.id }); }}><ha-icon icon="mdi:printer"></ha-icon>${t("print.packlist")}</button>
                ${canAdmin(this.ctx) ? html`<button role="menuitem" @click=${this._delete}><ha-icon icon="mdi:delete-outline"></ha-icon>${t("common.delete")}</button>` : nothing}
              </div>`
            : nothing}
        </div>
      </div>
      <div class="small muted" style="margin:0 4px 8px" aria-live="polite">${t("lists.progress", { done, total: all.length })}</div>
      <div class="actions row" style="margin-bottom:8px"><button class="btn primary" @click=${() => this._openAdd()}><ha-icon icon="mdi:plus"></ha-icon>${t("lists.add")}</button></div>
      ${all.length === 0 ? html`<div class="empty"><ha-icon icon="mdi:format-list-checks"></ha-icon><p>${t("lists.emptyList")}</p></div>` : nothing}
      ${v.groups.map((g) => html`
        <div class="section-title">${g.place_id ? g.place_name : t("lists.noPlace")}</div>
        <div class="list">${g.entries.map((e) => this._entry(e))}</div>`)}
    `;
  }

  private _entry(e: ListEntry) {
    const t = this.ctx.t;
    const sub = [e.path.length ? e.path.join(" › ") : "", e.note ?? ""].filter(Boolean).join(" · ");
    return html`<div class="entry ${e.checked ? "done" : ""}">
      <button class="box" role="checkbox" aria-checked=${e.checked ? "true" : "false"} aria-label=${e.name} @click=${() => this._toggle(e)}>
        <ha-icon icon=${e.checked ? "mdi:checkbox-marked" : "mdi:checkbox-blank-outline"}></ha-icon>
      </button>
      <button class="text" @click=${() => (e.node ? this.ctx.go({ page: "node", id: e.node }) : this._toggle(e))} aria-label=${e.node ? `${t("lists.open")}: ${e.name}` : e.name}>
        <span class="title">${e.quantity !== undefined ? `${e.quantity}× ` : ""}${e.name}</span>
        ${sub ? html`<span class="small muted ellipsis" style="display:block">${sub}</span>` : nothing}
      </button>
      <button class="icon-btn" aria-label=${`${t("lists.removeEntry")}: ${e.name}`} @click=${() => this._remove(e)}><ha-icon icon="mdi:close"></ha-icon></button>
    </div>`;
  }

  // ---- Dialoge -----------------------------------------------------------------------
  private _dialogs() {
    const t = this.ctx.t;
    const close = () => (this._dialog = null);
    if (this._dialog === "new" || this._dialog === "rename") {
      return html`<ot-dialog .heading=${this._dialog === "new" ? t("lists.new") : t("lists.rename")} .closeLabel=${t("common.close")} @close=${close}>
        <form @submit=${(e: Event) => { e.preventDefault(); void this._saveName(); }}>
          <label class="field">${t("form.name")} *
            <input .value=${this._name} autocomplete="off" required placeholder=${t("lists.namePlaceholder")} @input=${(e: Event) => (this._name = (e.target as HTMLInputElement).value)} />
          </label>
          ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
        </form>
        <button slot="footer" class="btn text" @click=${close}>${t("common.cancel")}</button>
        <button slot="footer" class="btn primary" @click=${this._saveName}>${t("common.save")}</button>
      </ot-dialog>`;
    }
    if (this._dialog === "add") {
      return html`<ot-dialog .heading=${t("lists.add")} .closeLabel=${t("common.close")} @close=${close}>
        <div class="stack">
          <div class="row wrap">
            <button class="chip" aria-pressed=${this._addMode === "node" ? "true" : "false"} @click=${() => (this._addMode = "node")}>${t("lists.fromInventory")}</button>
            <button class="chip" aria-pressed=${this._addMode === "text" ? "true" : "false"} @click=${() => (this._addMode = "text")}>${t("lists.freeText")}</button>
          </div>
          ${this._addMode === "node"
            ? html`<ot-node-picker .ctx=${this.ctx} .label=${t("lists.pickLabel")} .value=${this._addNode} .valueName=${this._addNodeName} @picked=${(e: CustomEvent<{ id: string; name: string }>) => { this._addNode = e.detail.id; this._addNodeName = e.detail.name; }}></ot-node-picker>`
            : html`<label class="field">${t("lists.text")}<input .value=${this._addText} autocomplete="off" placeholder=${t("lists.textPlaceholder")} @input=${(e: Event) => (this._addText = (e.target as HTMLInputElement).value)} /></label>`}
          <label class="field">${t("form.quantity")}<input inputmode="decimal" .value=${this._addQuantity} @input=${(e: Event) => (this._addQuantity = (e.target as HTMLInputElement).value)} /></label>
          <label class="field">${t("form.note")}<input .value=${this._addNote} @input=${(e: Event) => (this._addNote = (e.target as HTMLInputElement).value)} /></label>
          ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
        </div>
        <button slot="footer" class="btn text" @click=${close}>${t("common.cancel")}</button>
        <button slot="footer" class="btn primary" @click=${this._saveEntry}>${t("common.save")}</button>
      </ot-dialog>`;
    }
    return nothing;
  }
}
customElements.define("ot-lists-page", OtListsPage);
