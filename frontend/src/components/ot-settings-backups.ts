import { LitElement, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { Latest } from "../lib/latest";
import { baseStyles } from "../lib/styles";
import type { BackupInfo } from "../types";

/** Sicherungen ansehen, anlegen und wiederherstellen (Pflichtenheft 6.3, 8.13). Vor dem Wiederherstellen wird der jetzige Stand gesichert. */
export class OtSettingsBackups extends LitElement {
  static properties = {
    ctx: { attribute: false },
    _rows: { state: true },
    _error: { state: true },
    _busy: { state: true },
  };
  declare ctx: AppContext;
  declare _rows: BackupInfo[] | null;
  declare _error: string;
  declare _busy: boolean;

  private _latest = new Latest();

  constructor() {
    super();
    this._rows = null;
    this._error = "";
    this._busy = false;
  }

  static styles = [baseStyles];

  connectedCallback(): void {
    super.connectedCallback();
    void this._load();
  }

  private async _load(): Promise<void> {
    try {
      const rows = await this._latest.run(() => this.ctx.api.backups());
      if (rows) {
        this._rows = rows;
        this._error = "";
      }
    } catch (err) {
      this._error = errorMessage(err);
    }
  }

  private _when(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(this.ctx.lang, { dateStyle: "medium", timeStyle: "medium" }).format(d);
  }

  private _reason(reason: string): string {
    if (!reason) return this.ctx.t("backups.auto");
    const key = `backups.reason.${reason}`;
    const text = this.ctx.t(key as never);
    return text === key ? reason : text;
  }

  private async _create(): Promise<void> {
    this._busy = true;
    try {
      await this.ctx.api.backupCreate();
      this.ctx.toast(this.ctx.t("backups.created"));
      await this._load();
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    } finally {
      this._busy = false;
    }
  }

  private async _restore(b: BackupInfo): Promise<void> {
    const t = this.ctx.t;
    const ok = await this.ctx.confirm({
      title: t("backups.restoreTitle", { time: this._when(b.time) }),
      message: t("backups.restoreMessage"),
      confirmLabel: t("backups.restore"),
      danger: true,
    });
    if (!ok) return;
    this._busy = true;
    try {
      const res = await this.ctx.api.backupRestore(b.name);
      await this.ctx.reloadCatalog();
      this.ctx.toast(t("backups.restored", { n: res.nodes }));
      await this._load();
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    } finally {
      this._busy = false;
    }
  }

  render() {
    const t = this.ctx.t;
    return html`
      <p class="muted small" style="margin:0 4px 10px">${t("backups.help")}</p>
      <div style="margin-bottom:12px"><button class="btn primary" ?disabled=${this._busy} @click=${this._create}><ha-icon icon="mdi:content-save-outline"></ha-icon>${t("backups.create")}</button></div>
      ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
      ${this._rows === null
        ? html`<div class="empty muted">${t("common.loading")}</div>`
        : this._rows.length === 0
          ? html`<div class="empty small">${t("backups.none")}</div>`
          : html`<div class="list">${this._rows.map((b) => html`<div class="item" style="cursor:default">
              <ha-icon class="icon" icon="mdi:backup-restore"></ha-icon>
              <span class="grow"><span class="title">${this._when(b.time)}</span><span class="small muted" style="display:block">${this._reason(b.reason)}</span></span>
              <button class="btn" ?disabled=${this._busy} aria-label=${`${t("backups.restore")}: ${this._when(b.time)}`} @click=${() => this._restore(b)}>${t("backups.restore")}</button>
            </div>`)}</div>`}
    `;
  }
}
customElements.define("ot-settings-backups", OtSettingsBackups);
