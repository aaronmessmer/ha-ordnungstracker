import { LitElement, css, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { daysBetween, fieldValueText, formatDate, hintTone, iconFor, quantityText, today } from "../lib/format";
import { Latest } from "../lib/latest";
import { rowFromBrief } from "../lib/rows";
import { Selection } from "../lib/selection";
import { baseStyles } from "../lib/styles";
import type { Detail, MaintenanceTask, RootView } from "../types";
import { canAdmin, openPrint } from "../lib/print";
import "./ot-checkout";
import "./ot-list-add";
import "./ot-template-create";
import "./ot-maintenance";
import "./ot-stepper";

const SYSTEM = ["unsortiert", "papierkorb"];

type Dialog = "create" | "edit" | "quick" | "move" | "delete" | "lent" | "out" | "task" | "template" | "list" | null;

/** Knotenseite (Stöbern, Pflichtenheft 8.1): Pfad, Angaben, Inhalt – und alles zum Anlegen, Ändern, Verschieben, Löschen. */
export class OtNodePage extends LitElement {
  static properties = {
    ctx: { attribute: false },
    nodeId: { attribute: false },
    _data: { state: true },
    _error: { state: true },
    _dialog: { state: true },
    _moveIds: { state: true },
    _deleteMode: { state: true },
    _favorite: { state: true },
    _menu: { state: true },
    _task: { state: true },
  };
  declare ctx: AppContext;
  declare nodeId: string | null;
  declare _data: Detail | RootView | null;
  declare _error: string;
  declare _dialog: Dialog;
  declare _moveIds: string[];
  declare _deleteMode: "trash" | "lift";
  declare _favorite: boolean;
  declare _menu: boolean;
  declare _task: MaintenanceTask | null;

  private _selection = new Selection();
  private _latest = new Latest();
  private _loaded: { id: string | null; revision: number } | null = null;

  constructor() {
    super();
    this.nodeId = null;
    this._data = null;
    this._error = "";
    this._dialog = null;
    this._moveIds = [];
    this._deleteMode = "trash";
    this._favorite = false;
    this._menu = false;
    this._task = null;
  }

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }
      .head {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 4px 0 8px;
      }
      .head h1 {
        font-size: 1.5rem;
        font-weight: 500;
        word-break: break-word;
      }
      .head .badge {
        font-size: 1.1rem;
      }
      .head ha-icon {
        --mdc-icon-size: 32px;
        color: var(--secondary-text-color);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 8px 0 12px;
      }
      dl {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 6px 16px;
        margin: 0;
      }
      dt {
        color: var(--secondary-text-color);
      }
      dd {
        margin: 0;
        word-break: break-word;
      }
      dd.dim {
        opacity: 0.55;
      }
      .group-name {
        grid-column: 1 / -1;
        font-size: 0.8rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--secondary-text-color);
        margin-top: 8px;
      }
      .banner {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        padding: 12px 16px;
        border-radius: var(--ot-radius);
        background: color-mix(in srgb, var(--warning-color, #ff9800) 18%, transparent);
        margin-bottom: 12px;
      }
      .selbar {
        position: sticky;
        bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 12px;
        padding: 8px 12px;
        border-radius: 28px;
        background: var(--card-background-color, #fff);
        border: 1px solid var(--divider-color);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
        z-index: 5;
      }
      .menu {
        position: relative;
      }
      .menu .pop {
        position: absolute;
        right: 0;
        top: 100%;
        z-index: 6;
        min-width: 220px;
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
      .radio {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 8px 0;
      }
      .radio input {
        width: 22px;
        height: 22px;
        min-height: 0;
        margin-top: 2px;
      }
    `,
  ];

  willUpdate(changed: Map<string, unknown>): void {
    const rev = this.ctx?.revision ?? 0;
    if (!this._loaded || changed.has("nodeId") || this._loaded.revision !== rev) {
      const sameNode = this._loaded?.id === this.nodeId;
      this._loaded = { id: this.nodeId, revision: rev };
      if (!sameNode) {
        this._selection.clear();
        this._menu = false;
      }
      void this._load();
    }
  }

  private async _load(): Promise<void> {
    try {
      const id = this.nodeId;
      const data = await this._latest.run(() => this.ctx.api.node(id, { track: true }));
      if (!data) return;
      this._data = data;
      this._error = "";
      this._selection.retain(data.contents.map((c) => c.id));
      if (id) {
        const user = await this.ctx.api.user().catch(() => null);
        this._favorite = !!user?.favorites.includes(id);
      }
    } catch (err) {
      this._data = null;
      this._error = errorMessage(err);
    }
  }

  private get _detail(): Detail | null {
    return this._data && this._data.id !== null ? (this._data as Detail) : null;
  }

  private _open(id: string | null): void {
    this.ctx.go({ page: "node", id });
  }

  private async _toggleFavorite(): Promise<void> {
    const d = this._detail;
    if (!d) return;
    try {
      await this.ctx.api.favorite(d.id, !this._favorite);
      this._favorite = !this._favorite;
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  private async _restore(): Promise<void> {
    const d = this._detail;
    if (!d) return;
    try {
      await this.ctx.api.restore(d.id);
      this.ctx.toast(this.ctx.t("trash.restored", { name: d.name }));
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  private async _return(): Promise<void> {
    const d = this._detail;
    if (!d) return;
    try {
      await this.ctx.api.returnNode(d.id);
      this.ctx.toast(this.ctx.t("checkout.returned", { name: d.name }));
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  private async _toggleReminder(): Promise<void> {
    const d = this._detail;
    if (!d?.checkout) return;
    try {
      await this.ctx.api.checkoutReminder(d.id, !!d.checkout.no_reminder);
      this.ctx.toast(this.ctx.t(d.checkout.no_reminder ? "checkout.reminderOn" : "checkout.reminderOff"));
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  private async _taskDone(task: MaintenanceTask): Promise<void> {
    const d = this._detail;
    if (!d) return;
    try {
      await this.ctx.api.maintenanceDone(d.id, task.id);
      this.ctx.toast(this.ctx.t("maintenance.doneToast", { title: task.title }));
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  private async _deleteSelected(): Promise<void> {
    const ids = this._selection.values();
    const t = this.ctx.t;
    const ok = await this.ctx.confirm({
      title: t("delete.manyTitle", { n: ids.length }),
      message: t("delete.manyMessage", { n: ids.length }),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    try {
      for (const id of ids) await this.ctx.api.remove(id, "trash");
      this._selection.clear();
      this.ctx.toast(t("delete.done", { n: ids.length }));
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  private async _deleteOne(): Promise<void> {
    const d = this._detail;
    if (!d) return;
    try {
      await this.ctx.api.remove(d.id, this._deleteMode);
      this._dialog = null;
      this.ctx.toast(this.ctx.t("delete.doneOne", { name: d.name }));
      this._open(d.parent);
    } catch (err) {
      this._dialog = null;
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  private _closeDialog = () => {
    this._dialog = null;
  };

  private _saved = (e: CustomEvent<{ kind?: string; name?: string; count?: number; target?: string }>) => {
    const t = this.ctx.t;
    const d = e.detail;
    this._dialog = null;
    if (d.kind === "created") this.ctx.toast(t("form.created", { name: d.name ?? "" }));
    else if (d.kind === "list-added") this.ctx.toast(t("lists.addedTo", { list: d.name ?? "" }));
    else if (d.kind === "checkout") this.ctx.toast(t("checkout.done", { name: d.name ?? "" }));
    else if (d.kind === "maintenance") this.ctx.toast(t("maintenance.saved"));
    else if (d.kind === "maintenance-removed") this.ctx.toast(t("maintenance.removed"));
    else if (d.kind === "saved") this.ctx.toast(t("form.saved"));
    else if (d.target !== undefined) {
      this.ctx.toast(t("move.done", { n: d.count ?? 0, name: d.target }));
      this._selection.clear();
    } else this.ctx.toast(t("quick.done", { n: d.count ?? 0 }));
    void this._load();
  };

  render() {
    const t = this.ctx.t;
    if (this._error && !this._data) {
      return html`<div class="empty"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><p role="alert">${this._error}</p>
        <button class="btn" @click=${() => this._open(null)}>${t("common.start")}</button></div>`;
    }
    if (!this._data) return html`<div class="empty muted">${t("common.loading")}</div>`;
    const d = this._detail;
    const rows = this._data.contents.map((c) => rowFromBrief(c));
    const system = d ? SYSTEM.includes(d.id) : false;
    const inTrash = d?.in_trash ?? false;
    const canAdd = !inTrash && d?.id !== "papierkorb";
    return html`
      ${d ? html`<ot-path .path=${d.path} .rootLabel=${t("common.start")} current @open-node=${(e: CustomEvent<string | null>) => this._open(e.detail)}></ot-path>` : nothing}
      ${this._head(d, system)}
      ${d && inTrash ? this._trashBanner(d) : nothing}
      ${canAdd ? html`
        <div class="actions">
          <button class="btn primary" @click=${() => (this._dialog = "create")}><ha-icon icon="mdi:plus"></ha-icon>${t("node.new")}</button>
          ${(this.ctx.catalog?.templates.length ?? 0) > 0 ? html`<button class="btn" @click=${() => (this._dialog = "template")}><ha-icon icon="mdi:file-tree-outline"></ha-icon>${t("templates.fromTemplate")}</button>` : nothing}
          ${d ? html`<button class="btn" @click=${() => (this._dialog = "quick")}><ha-icon icon="mdi:text-box-plus-outline"></ha-icon>${t("node.quick")}</button>` : nothing}
          ${rows.length > 1 ? html`<button class="btn text" @click=${() => { this._selection.selectAll(rows.map((r) => r.id)); this.requestUpdate(); }}><ha-icon icon="mdi:select-all"></ha-icon>${t("node.selectAll")}</button>` : nothing}
        </div>` : nothing}
      ${d && !system && !inTrash ? this._checkoutActions(d) : nothing}
      ${d ? this._info(d) : nothing}
      ${d && !system && !inTrash ? this._maintenance(d) : nothing}
      <div class="section-title">${t("node.contents")}${rows.length ? ` (${rows.length})` : ""}</div>
      ${rows.length
        ? html`<ot-node-list
            .ctx=${this.ctx}
            .rows=${rows}
            .selection=${this._selection}
            .selectable=${!inTrash}
            .label=${t("node.contents")}
            @open-node=${(e: CustomEvent<string>) => this._open(e.detail)}
            @selection-changed=${() => this.requestUpdate()}
          ></ot-node-list>`
        : this._empty(d)}
      ${this._selection.active ? this._selectionBar() : nothing}
      ${this._dialogs(d)}
    `;
  }

  private _head(d: Detail | null, system: boolean) {
    const t = this.ctx.t;
    if (!d) {
      return html`<div class="head"><ha-icon icon="mdi:home-variant-outline"></ha-icon><h1 class="grow">${t("node.rootTitle")}</h1>
        <a class="btn text" href="#" @click=${(e: Event) => { e.preventDefault(); this.ctx.go({ page: "trash" }); }}><ha-icon icon="mdi:delete-outline"></ha-icon>${t("nav.trash")}</a></div>`;
    }
    return html`
      <div class="head">
        <ha-icon icon=${iconFor(d)}></ha-icon>
        ${d.number !== null ? html`<span class="badge">${d.number}</span>` : nothing}
        <h1 class="grow">${d.name}</h1>
        ${!system && !d.in_trash
          ? html`<button class="icon-btn" aria-label=${this._favorite ? t("node.unfavorite") : t("node.favorite")} aria-pressed=${this._favorite ? "true" : "false"} @click=${this._toggleFavorite}>
              <ha-icon icon=${this._favorite ? "mdi:star" : "mdi:star-outline"} style=${this._favorite ? "color: var(--warning-color, #ffa600)" : ""}></ha-icon>
            </button>
            <div class="menu">
              <button class="icon-btn" aria-label=${t("node.more")} aria-haspopup="true" aria-expanded=${this._menu ? "true" : "false"} @click=${() => (this._menu = !this._menu)}><ha-icon icon="mdi:dots-vertical"></ha-icon></button>
              ${this._menu ? html`<div class="pop" role="menu">
                <button role="menuitem" @click=${() => { this._menu = false; this._dialog = "edit"; }}><ha-icon icon="mdi:pencil"></ha-icon>${t("common.edit")}</button>
                <button role="menuitem" @click=${() => { this._menu = false; this._moveIds = [d.id]; this._dialog = "move"; }}><ha-icon icon="mdi:folder-move-outline"></ha-icon>${t("common.move")}</button>
                <button role="menuitem" @click=${() => { this._menu = false; this._dialog = "list"; }}><ha-icon icon="mdi:format-list-checks"></ha-icon>${t("lists.addToList")}</button>
                ${d.class !== "item"
                  ? html`<button role="menuitem" @click=${() => { this._menu = false; this.ctx.go({ page: "stocktake", id: d.id }); }}><ha-icon icon="mdi:clipboard-check-outline"></ha-icon>${t("stocktake.start")}</button>
                    <button role="menuitem" @click=${() => { this._menu = false; void openPrint(this.ctx, "sheet", { node: d.id }); }}><ha-icon icon="mdi:printer"></ha-icon>${t("print.sheet")}</button>`
                  : nothing}
                <button role="menuitem" @click=${() => { this._menu = false; this.ctx.go({ page: "journal", node: d.id }); }}><ha-icon icon="mdi:history"></ha-icon>${t("journal.node")}</button>
                ${canAdmin(this.ctx) ? html`<button role="menuitem" @click=${() => { this._menu = false; this._deleteMode = "trash"; this._dialog = "delete"; }}><ha-icon icon="mdi:delete-outline"></ha-icon>${t("common.delete")}</button>` : nothing}
              </div>` : nothing}
            </div>`
          : nothing}
      </div>
    `;
  }

  private _trashBanner(d: Detail) {
    const t = this.ctx.t;
    const topLevel = d.parent === "papierkorb";
    return html`<div class="banner">
      <ha-icon icon="mdi:delete-clock-outline"></ha-icon>
      <span class="grow">${topLevel ? t("trash.bannerTop", { date: d.trashed ? formatDate(d.trashed.at.slice(0, 10), this.ctx.lang) : "" }) : t("trash.bannerInside")}</span>
      ${topLevel ? html`<button class="btn" @click=${this._restore}>${t("trash.restore")}</button>` : nothing}
    </div>`;
  }

  private _info(d: Detail) {
    const t = this.ctx.t;
    const lang = this.ctx.lang;
    const items: Array<[string, unknown, boolean?]> = [];
    items.push([t("node.kind"), d.kind_name]);
    if (d.effective_owner) {
      items.push([t("node.owner"), d.effective_owner.inherited ? `${d.effective_owner.name} (${t("node.inherited")})` : d.effective_owner.name]);
    }
    const q = quantityText(d);
    if (q) items.push([t("node.quantity"), d.min_quantity !== null ? `${q} (${t("node.minimum")} ${d.min_quantity})` : q]);
    if (d.aliases.length) items.push([t("node.aliases"), d.aliases.join(", ")]);
    if (d.tags.length) items.push([t("node.tags"), html`${d.tags.map((x) => html`<span class="chip" style="margin-right:4px">${x}</span>`)}`]);
    const co = d.effective_checkout;
    if (co) {
      const what = co.type === "lent" ? t("node.lentTo") : t("node.outAt");
      const text = `${co.to} · ${t("node.since")} ${formatDate(co.since, lang)}${co.until ? ` · ${t("node.until")} ${formatDate(co.until, lang)}` : ""}`;
      items.push([what, co.inherited ? `${text} (${t("node.viaContainer")})` : text]);
    }
    if (d.condition !== "ok") items.push([t("node.condition"), t(`condition.${d.condition}` as never)]);
    if (d.note) items.push([t("node.note"), html`<span style="white-space:pre-wrap">${d.note}</span>`]);
    const fieldRows = d.fields.filter((f) => f.value !== null && f.value !== undefined && f.value !== "");
    if (items.length <= 1 && fieldRows.length === 0 && d.hints.length === 0) return nothing;
    let lastGroup = "";
    return html`
      <div class="card">
        ${d.hints.length ? html`<div class="row wrap" style="margin-bottom:10px">${d.hints.map((h) => html`<span class="chip ${hintTone(h)}">${h.text}</span>`)}</div>` : nothing}
        <dl>
          ${items.map(([k, v]) => html`<dt>${k}</dt><dd>${v as never}</dd>`)}
          ${fieldRows.map((f) => {
            const header = f.group !== lastGroup && f.group ? html`<div class="group-name">${f.group}</div>` : nothing;
            lastGroup = f.group;
            return html`${header}<dt>${f.name}</dt><dd class=${f.assigned ? "" : "dim"} title=${f.assigned ? "" : t("node.unassigned")}>${fieldValueText(f, lang, t("common.yes"), t("common.no"))}${f.assigned ? "" : ` (${t("node.unassigned")})`}</dd>`;
          })}
        </dl>
      </div>
    `;
  }

  /** „Ausleihen“, „Entnehmen“ oder „Zurücklegen“ (Pflichtenheft 8.6) und die Menge mit Plus/Minus. */
  private _checkoutActions(d: Detail) {
    const t = this.ctx.t;
    const co = d.checkout;
    return html`
      <div class="actions">
        ${co
          ? html`<button class="btn primary" @click=${this._return}><ha-icon icon="mdi:keyboard-return"></ha-icon>${t("checkout.return")}</button>
              ${co.type === "lent"
                ? html`<button class="btn text" @click=${this._toggleReminder}><ha-icon icon=${co.no_reminder ? "mdi:bell-outline" : "mdi:bell-off-outline"}></ha-icon>${co.no_reminder ? t("checkout.reminderOnShort") : t("checkout.reminderOffShort")}</button>`
                : nothing}`
          : html`<button class="btn" @click=${() => (this._dialog = "lent")}><ha-icon icon="mdi:account-arrow-right-outline"></ha-icon>${t("checkout.lend")}</button>
              <button class="btn" @click=${() => (this._dialog = "out")}><ha-icon icon="mdi:package-up"></ha-icon>${t("checkout.takeOut")}</button>`}
        ${d.quantity !== null
          ? html`<span class="grow"></span><ot-stepper .ctx=${this.ctx} .nodeId=${d.id} .itemName=${d.name} .quantity=${d.quantity} .unit=${d.unit}></ot-stepper>`
          : nothing}
      </div>
    `;
  }

  /** Wartungsaufgaben (Pflichtenheft 5.9): fällig, „Erledigt“ mit einem Tipp, Protokoll. */
  private _maintenance(d: Detail) {
    const t = this.ctx.t;
    const tasks = d.maintenance;
    const now = today();
    return html`
      <div class="section-title row">
        <span class="grow">${t("maintenance.section")}</span>
        <button class="btn text" @click=${() => { this._task = null; this._dialog = "task"; }}><ha-icon icon="mdi:plus"></ha-icon>${t("maintenance.add")}</button>
      </div>
      ${tasks.length
        ? html`<div class="list">${tasks.map((k) => {
            const days = k.next_due ? daysBetween(now, k.next_due) : null;
            const overdue = days !== null && days < 0;
            const unit = k.interval ? t(`maintenance.unit.${k.interval.unit}` as never) : "";
            const meta = [
              k.interval ? t("maintenance.everyText", { n: k.interval.value, unit }) : t("maintenance.once"),
              k.next_due ? `${t("maintenance.due")} ${formatDate(k.next_due, this.ctx.lang)}` : t("maintenance.noDate"),
              k.log?.length ? t("maintenance.last", { date: formatDate(k.log[k.log.length - 1].date, this.ctx.lang) }) : "",
            ].filter(Boolean);
            return html`<div class="rowbox" style="display:flex;align-items:center;border-bottom:1px solid var(--divider-color)">
              <button class="item" style="border:none;flex:1;min-width:0;width:auto" @click=${() => { this._task = k; this._dialog = "task"; }} aria-label=${`${t("maintenance.edit")}: ${k.title}`}>
                <span class="grow">
                  <span class="title">${k.title}</span>
                  <span class="small muted" style="display:block">${meta.join(" · ")}</span>
                  ${overdue ? html`<span class="chip error" style="margin-top:4px">${t("due.overdue")}</span>` : days !== null && days <= 14 ? html`<span class="chip warning" style="margin-top:4px">${t("maintenance.soon", { n: days })}</span>` : nothing}
                </span>
              </button>
              <button class="btn" style="margin-right:8px" aria-label=${`${t("maintenance.done")}: ${k.title}`} @click=${() => this._taskDone(k)}><ha-icon icon="mdi:check"></ha-icon>${t("maintenance.done")}</button>
            </div>`;
          })}</div>`
        : html`<div class="small muted" style="padding:0 4px">${t("maintenance.none")}</div>`}
    `;
  }

  private _empty(d: Detail | null) {
    const t = this.ctx.t;
    if (d?.in_trash) return html`<div class="empty small">${t("node.emptyTrashed")}</div>`;
    const key = !d ? "node.emptyRoot" : d.class === "place" ? "node.emptyPlace" : d.class === "container" ? "node.emptyContainer" : d.class === "item" ? "node.emptyItem" : "node.emptyGeneric";
    return html`<div class="empty"><ha-icon icon="mdi:package-variant-closed"></ha-icon><p>${t(key)}</p></div>`;
  }

  private _selectionBar() {
    const t = this.ctx.t;
    const n = this._selection.size;
    return html`<div class="selbar" role="toolbar" aria-label=${t("node.selection")}>
      <span class="grow">${t("node.selected", { n })}</span>
      <button class="btn" @click=${() => { this._moveIds = this._selection.values(); this._dialog = "move"; }}><ha-icon icon="mdi:folder-move-outline"></ha-icon>${t("common.move")}</button>
      ${canAdmin(this.ctx) ? html`<button class="btn danger" @click=${this._deleteSelected}><ha-icon icon="mdi:delete-outline"></ha-icon>${t("common.delete")}</button>` : nothing}
      <button class="icon-btn" aria-label=${t("common.cancel")} @click=${() => { this._selection.clear(); this.requestUpdate(); }}><ha-icon icon="mdi:close"></ha-icon></button>
    </div>`;
  }

  private _dialogs(d: Detail | null) {
    const t = this.ctx.t;
    switch (this._dialog) {
      case "create":
        return html`<ot-node-form .ctx=${this.ctx} mode="create" .parentId=${d?.id ?? null} @saved=${this._saved} @close=${this._closeDialog}></ot-node-form>`;
      case "edit":
        return d ? html`<ot-node-form .ctx=${this.ctx} mode="edit" .node=${d} @saved=${this._saved} @close=${this._closeDialog}></ot-node-form>` : nothing;
      case "quick":
        return d ? html`<ot-quickadd .ctx=${this.ctx} .parentId=${d.id} .parentName=${d.name} @saved=${this._saved} @close=${this._closeDialog}></ot-quickadd>` : nothing;
      case "move":
        return html`<ot-move .ctx=${this.ctx} .ids=${this._moveIds} .startAt=${d?.id ?? ""} @saved=${this._saved} @close=${this._closeDialog}></ot-move>`;
      case "delete":
        return d ? this._deleteDialog(d, t) : nothing;
      case "lent":
      case "out":
        return d ? html`<ot-checkout .ctx=${this.ctx} .nodeId=${d.id} .itemName=${d.name} .kind=${this._dialog} @saved=${this._saved} @close=${this._closeDialog}></ot-checkout>` : nothing;
      case "template":
        return html`<ot-template-create .ctx=${this.ctx} .parentId=${d?.id ?? null} @saved=${this._saved} @close=${this._closeDialog}></ot-template-create>`;
      case "list":
        return d ? html`<ot-list-add .ctx=${this.ctx} .nodeId=${d.id} .itemName=${d.name} @saved=${this._saved} @close=${this._closeDialog}></ot-list-add>` : nothing;
      case "task":
        return d ? html`<ot-maintenance .ctx=${this.ctx} .nodeId=${d.id} .task=${this._task} @saved=${this._saved} @close=${this._closeDialog}></ot-maintenance>` : nothing;
      default:
        return nothing;
    }
  }

  private _deleteDialog(d: Detail, t: AppContext["t"]) {
    const n = d.descendants;
    return html`
      <ot-dialog .heading=${t("delete.title", { name: d.name })} .closeLabel=${t("common.close")} @close=${this._closeDialog}>
        <p style="margin-top:0">${n > 0 ? t("delete.withContent", { n }) : t("delete.empty")}</p>
        ${n > 0
          ? html`
              <label class="radio"><input type="radio" name="mode" .checked=${this._deleteMode === "trash"} @change=${() => (this._deleteMode = "trash")} /><span>${t("delete.modeTrash", { n })}</span></label>
              <label class="radio"><input type="radio" name="mode" .checked=${this._deleteMode === "lift"} @change=${() => (this._deleteMode = "lift")} /><span>${t("delete.modeLift")}</span></label>
            `
          : nothing}
        <p class="small muted">${t("delete.trashInfo", { days: this.ctx.catalog?.settings.trash_days ?? 30 })}</p>
        <button slot="footer" class="btn text" @click=${this._closeDialog}>${t("common.cancel")}</button>
        <button slot="footer" class="btn danger" @click=${this._deleteOne}>${t("common.delete")}</button>
      </ot-dialog>
    `;
  }
}
customElements.define("ot-node-page", OtNodePage);
