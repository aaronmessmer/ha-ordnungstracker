import { LitElement, css, html } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { formatDate, iconFor } from "../lib/format";
import { Latest } from "../lib/latest";
import { baseStyles } from "../lib/styles";
import type { TrashEntry } from "../types";

/** Papierkorb (Pflichtenheft 5.13, 8.5): wiederherstellen, endgültig löschen, leeren. */
export class OtTrashPage extends LitElement {
  static properties = {
    ctx: { attribute: false },
    _entries: { state: true },
    _error: { state: true },
  };
  declare ctx: AppContext;
  declare _entries: TrashEntry[] | null;
  declare _error: string;

  private _latest = new Latest();
  private _revision = -1;

  constructor() {
    super();
    this._entries = null;
    this._error = "";
  }

  static styles = [
    baseStyles,
    css`
      .entry {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 8px 8px 12px;
        border-bottom: 1px solid var(--divider-color);
      }
      .entry:last-child {
        border-bottom: none;
      }
    `,
  ];

  willUpdate(): void {
    const rev = this.ctx?.revision ?? 0;
    if (rev !== this._revision) {
      this._revision = rev;
      void this._load();
    }
  }

  private async _load(): Promise<void> {
    try {
      const res = await this._latest.run(() => this.ctx.api.trash());
      if (res) this._entries = res;
    } catch (err) {
      this._error = errorMessage(err);
    }
  }

  private async _restore(e: TrashEntry): Promise<void> {
    try {
      const res = await this.ctx.api.restore(e.id);
      const toUnsorted = res.parent === "unsortiert";
      this.ctx.toast(this.ctx.t(toUnsorted ? "trash.restoredUnsorted" : "trash.restored", { name: e.name }));
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  private async _purge(e: TrashEntry): Promise<void> {
    const t = this.ctx.t;
    const ok = await this.ctx.confirm({
      title: t("trash.purgeTitle", { name: e.name }),
      message: t("trash.purgeMessage", { n: e.descendants }),
      confirmLabel: t("trash.purge"),
      danger: true,
    });
    if (!ok) return;
    try {
      await this.ctx.api.purge(e.id);
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  private async _empty(): Promise<void> {
    const t = this.ctx.t;
    const ok = await this.ctx.confirm({
      title: t("trash.emptyTitle"),
      message: t("trash.emptyMessage"),
      confirmLabel: t("trash.empty"),
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await this.ctx.api.emptyTrash();
      this.ctx.toast(t("trash.emptied", { n: res.removed }));
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  render() {
    const t = this.ctx.t;
    const days = this.ctx.catalog?.settings.trash_days ?? 30;
    return html`
      <div class="row" style="margin:4px 0 8px">
        <h1 class="grow" style="font-size:1.5rem;font-weight:500">${t("nav.trash")}</h1>
        <button class="btn danger" ?disabled=${!this._entries?.length} @click=${this._empty}><ha-icon icon="mdi:delete-forever-outline"></ha-icon>${t("trash.empty")}</button>
      </div>
      <p class="muted small" style="margin:0 4px 12px">${t("trash.info", { days })}</p>
      ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : ""}
      ${this._entries === null
        ? html`<div class="empty muted">${t("common.loading")}</div>`
        : this._entries.length === 0
          ? html`<div class="empty"><ha-icon icon="mdi:delete-empty-outline"></ha-icon><p>${t("trash.none")}</p></div>`
          : html`<div class="list">
              ${this._entries.map(
                (e) => html`<div class="entry">
                  <ha-icon class="icon muted" icon=${iconFor(e)}></ha-icon>
                  <span class="grow">
                    <button class="btn text" style="padding:0;min-height:0;font-size:1rem;display:block" @click=${() => this.ctx.go({ page: "node", id: e.id })}>${e.number !== null ? `${e.number} · ` : ""}${e.name}</button>
                    <span class="small muted">${e.kind_name}${e.descendants ? ` · ${t("trash.withContent", { n: e.descendants })}` : ""}${e.trashed ? ` · ${t("trash.deletedOn", { date: formatDate(e.trashed.at.slice(0, 10), this.ctx.lang) })}` : ""}</span>
                  </span>
                  <button class="icon-btn" aria-label=${t("trash.restore")} title=${t("trash.restore")} @click=${() => this._restore(e)}><ha-icon icon="mdi:restore"></ha-icon></button>
                  <button class="icon-btn" aria-label=${t("trash.purge")} title=${t("trash.purge")} @click=${() => this._purge(e)}><ha-icon icon="mdi:delete-forever-outline"></ha-icon></button>
                </div>`,
              )}
            </div>`}
    `;
  }
}
customElements.define("ot-trash-page", OtTrashPage);
