import { LitElement, css, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { baseStyles } from "../lib/styles";
import type { JournalEntry } from "../types";

export const PAGE_SIZE = 50;

/** Text zu einer Änderung: Verschieben mit altem und neuem Pfad, Bearbeiten mit den geänderten Angaben. */
export function describeDetails(entry: JournalEntry): string {
  const d = entry.details ?? {};
  if (entry.action === "move" && Array.isArray(d.from) && Array.isArray(d.to)) {
    return `${(d.from as string[]).join(" › ")} → ${(d.to as string[]).join(" › ")}`;
  }
  if (entry.action === "update" && d.changes && typeof d.changes === "object") {
    const old = (d.old ?? {}) as Record<string, unknown>;
    return Object.entries(d.changes as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${show(old[k])} → ${show(v)}`)
      .join("; ");
  }
  if (entry.action === "field") return `${show(d.field)}: ${show(d.old)} → ${show(d.new)}`;
  if (entry.action === "restore" && typeof d.backup === "string") return d.backup;
  return "";
}

function show(value: unknown): string {
  if (value === null || value === undefined || value === "") return "–";
  if (Array.isArray(value)) return value.join(", ") || "–";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Änderungsprotokoll (Pflichtenheft 6.4), pro Knoten oder gesamt; neueste zuerst, nachladbar. */
export class OtJournal extends LitElement {
  static properties = {
    ctx: { attribute: false },
    nodeId: { type: String },
    _entries: { state: true },
    _more: { state: true },
    _error: { state: true },
    _busy: { state: true },
  };
  declare ctx: AppContext;
  declare nodeId: string;
  declare _entries: JournalEntry[] | null;
  declare _more: boolean;
  declare _error: string;
  declare _busy: boolean;

  private _loaded: { id: string; revision: number } | null = null;

  constructor() {
    super();
    this.nodeId = "";
    this._entries = null;
    this._more = false;
    this._error = "";
    this._busy = false;
  }

  static styles = [
    baseStyles,
    css`
      .entry {
        padding: 10px 12px;
        border-bottom: 1px solid var(--divider-color);
      }
      .entry:last-child {
        border-bottom: none;
      }
      .when {
        font-size: 0.8rem;
        color: var(--secondary-text-color);
      }
      .detail {
        font-size: 0.9rem;
        color: var(--secondary-text-color);
        word-break: break-word;
      }
      a.node {
        color: var(--primary-color);
        cursor: pointer;
      }
    `,
  ];

  willUpdate(changed: Map<string, unknown>): void {
    const rev = this.ctx?.revision ?? 0;
    if (!this._loaded || changed.has("nodeId") || this._loaded.revision !== rev) {
      this._loaded = { id: this.nodeId, revision: rev };
      void this._load(false);
    }
  }

  private async _load(append: boolean): Promise<void> {
    this._busy = true;
    try {
      const offset = append ? (this._entries?.length ?? 0) : 0;
      const rows = await this.ctx.api.journal(this.nodeId || null, PAGE_SIZE, offset);
      this._entries = append ? [...(this._entries ?? []), ...rows] : rows;
      this._more = rows.length === PAGE_SIZE;
      this._error = "";
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private _when(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(this.ctx.lang, { dateStyle: "medium", timeStyle: "short" }).format(d);
  }

  private _action(action: string): string {
    const key = `journal.action.${action}`;
    const text = this.ctx.t(key as never);
    return text === key ? action : text;
  }

  render() {
    const t = this.ctx.t;
    if (this._error && !this._entries) return html`<div class="error-text" role="alert">${this._error}</div>`;
    if (!this._entries) return html`<div class="empty muted">${t("common.loading")}</div>`;
    if (this._entries.length === 0) return html`<div class="empty"><ha-icon icon="mdi:history"></ha-icon><p>${t("journal.none")}</p></div>`;
    return html`
      <div class="list">
        ${this._entries.map((e) => {
          const detail = describeDetails(e);
          return html`<div class="entry">
            <div class="when">${this._when(e.time)} · ${e.user}</div>
            <div>
              <strong>${this._action(e.action)}</strong>
              ${e.name ? html`: ${e.node ? html`<a class="node" role="link" tabindex="0" @click=${() => this.ctx.go({ page: "node", id: e.node ?? null })} @keydown=${(ev: KeyboardEvent) => ev.key === "Enter" && this.ctx.go({ page: "node", id: e.node ?? null })}>${e.name}</a>` : e.name}` : nothing}
            </div>
            ${detail ? html`<div class="detail">${detail}</div>` : nothing}
          </div>`;
        })}
      </div>
      ${this._more ? html`<div style="margin-top:12px"><button class="btn" ?disabled=${this._busy} @click=${() => this._load(true)}>${t("journal.more")}</button></div>` : nothing}
    `;
  }
}
customElements.define("ot-journal", OtJournal);
