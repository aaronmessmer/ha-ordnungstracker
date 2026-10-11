import { LitElement, css, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { iconFor, quantityText } from "../lib/format";
import { Latest, debounce } from "../lib/latest";
import { baseStyles } from "../lib/styles";
import type { Brief, Detail, StocktakeState } from "../types";
import "./ot-move";
import "./ot-quickadd";

type Verdict = "present" | "missing";

/**
 * Inventur (Pflichtenheft 8.9): Der Inhalt eines Knotens als Abhakliste. Pro Eintrag „da“, „fehlt“ oder „gehört
 * woanders hin“. Der Zwischenstand wird auf dem Server gemerkt und überlebt das Verlassen der Ansicht.
 * Am Ende erhalten Bestätigte das Datum der Prüfung, Fehlende den Zustand „vermisst“.
 */
export class OtStocktakePage extends LitElement {
  static properties = {
    ctx: { attribute: false },
    nodeId: { type: String },
    _node: { state: true },
    _verdicts: { state: true },
    _error: { state: true },
    _dialog: { state: true },
    _moveId: { state: true },
    _busy: { state: true },
  };
  declare ctx: AppContext;
  declare nodeId: string;
  declare _node: Detail | null;
  declare _verdicts: Record<string, Verdict>;
  declare _error: string;
  declare _dialog: "add" | "move" | null;
  declare _moveId: string;
  declare _busy: boolean;

  private _latest = new Latest();
  private _loaded: { id: string; revision: number } | null = null;
  private _stateLoaded = false;

  constructor() {
    super();
    this.nodeId = "";
    this._node = null;
    this._verdicts = {};
    this._error = "";
    this._dialog = null;
    this._moveId = "";
    this._busy = false;
  }

  static styles = [
    baseStyles,
    css`
      .row3 {
        display: flex;
        gap: 6px;
        flex: none;
      }
      .row3 button {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 1px solid var(--divider-color);
        background: transparent;
        color: var(--primary-text-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }
      .row3 button[aria-pressed="true"].present {
        background: var(--success-color, #43a047);
        border-color: var(--success-color, #43a047);
        color: #fff;
      }
      .row3 button[aria-pressed="true"].missing {
        background: var(--error-color, #db4437);
        border-color: var(--error-color, #db4437);
        color: #fff;
      }
      .line {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px 6px 12px;
        border-bottom: 1px solid var(--divider-color);
        min-height: 60px;
      }
      .line:last-child {
        border-bottom: none;
      }
      .line .name {
        flex: 1;
        min-width: 0;
        text-align: left;
        border: none;
        background: transparent;
        color: inherit;
      }
      .bar {
        position: sticky;
        bottom: 8px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
        margin-top: 12px;
        padding: 8px 12px;
        border-radius: 28px;
        background: var(--card-background-color, #fff);
        border: 1px solid var(--divider-color);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
        z-index: 5;
      }
    `,
  ];

  willUpdate(changed: Map<string, unknown>): void {
    const rev = this.ctx?.revision ?? 0;
    if (!this._loaded || changed.has("nodeId") || this._loaded.revision !== rev) {
      const sameNode = this._loaded?.id === this.nodeId;
      this._loaded = { id: this.nodeId, revision: rev };
      if (!sameNode) this._stateLoaded = false;
      void this._load();
    }
  }

  private async _load(): Promise<void> {
    const id = this.nodeId;
    try {
      const node = await this._latest.run(() => this.ctx.api.node(id));
      if (!node || node.id === null) return;
      this._node = node as Detail;
      this._error = "";
      if (!this._stateLoaded) {
        this._stateLoaded = true;
        const saved = await this.ctx.api.stocktakeGet(id);
        this._verdicts = this._fromState(saved);
      }
      this._prune();
    } catch (err) {
      this._error = errorMessage(err);
    }
  }

  private _fromState(state: StocktakeState | null): Record<string, Verdict> {
    const v: Record<string, Verdict> = {};
    for (const i of state?.present ?? []) v[i] = "present";
    for (const i of state?.missing ?? []) v[i] = "missing";
    return v;
  }

  private _toState(): StocktakeState {
    const ids = Object.keys(this._verdicts);
    return { present: ids.filter((i) => this._verdicts[i] === "present"), missing: ids.filter((i) => this._verdicts[i] === "missing") };
  }

  /** Einträge, die nicht mehr hier liegen (verschoben, gelöscht), fallen aus dem Zwischenstand. */
  private _prune(): void {
    const here = new Set(this._node?.contents.map((c) => c.id) ?? []);
    const kept = Object.fromEntries(Object.entries(this._verdicts).filter(([id]) => here.has(id)));
    if (Object.keys(kept).length !== Object.keys(this._verdicts).length) {
      this._verdicts = kept;
      this._save();
    }
  }

  private _save = debounce(() => {
    const state = this._toState();
    const empty = !state.present?.length && !state.missing?.length;
    void this.ctx.api.stocktakeSet(this.nodeId, empty ? null : state).catch(() => undefined);
  }, 400);

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._save.flush(); // nichts verlieren, wenn man die Ansicht verlässt
  }

  private _mark(id: string, verdict: Verdict): void {
    const next = { ...this._verdicts };
    if (next[id] === verdict) delete next[id];
    else next[id] = verdict;
    this._verdicts = next;
    this._save();
  }

  private _allPresent(): void {
    const next = { ...this._verdicts };
    for (const c of this._node?.contents ?? []) if (!next[c.id]) next[c.id] = "present";
    this._verdicts = next;
    this._save();
  }

  private async _discard(): Promise<void> {
    const t = this.ctx.t;
    const ok = await this.ctx.confirm({ title: t("stocktake.discardTitle"), message: t("stocktake.discardMessage"), confirmLabel: t("stocktake.discard"), danger: true });
    if (!ok) return;
    this._verdicts = {};
    this._save.cancel();
    await this.ctx.api.stocktakeSet(this.nodeId, null).catch(() => undefined);
    this.ctx.go({ page: "node", id: this.nodeId });
  }

  private async _finish(): Promise<void> {
    const t = this.ctx.t;
    const contents = this._node?.contents ?? [];
    const open = contents.filter((c) => !this._verdicts[c.id]).length;
    const missing = Object.values(this._verdicts).filter((v) => v === "missing").length;
    const ok = await this.ctx.confirm({
      title: t("stocktake.finishTitle"),
      message: open > 0 ? t("stocktake.finishOpen", { n: open, missing }) : t("stocktake.finishAll", { missing }),
      confirmLabel: t("stocktake.finish"),
    });
    if (!ok) return;
    this._busy = true;
    try {
      this._save.cancel();
      const res = await this.ctx.api.stocktakeApply(this._verdicts as Record<string, Verdict>);
      await this.ctx.api.stocktakeSet(this.nodeId, null);
      this._verdicts = {};
      this.ctx.toast(t("stocktake.done", { verified: res.verified, missing: res.missing }));
      this.ctx.go({ page: "node", id: this.nodeId });
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    } finally {
      this._busy = false;
    }
  }

  render() {
    const t = this.ctx.t;
    if (this._error && !this._node) return html`<div class="empty"><p class="error-text" role="alert">${this._error}</p></div>`;
    const n = this._node;
    if (!n) return html`<div class="empty muted">${t("common.loading")}</div>`;
    const contents = n.contents;
    const decided = contents.filter((c) => this._verdicts[c.id]).length;
    return html`
      <ot-path .path=${n.path} .rootLabel=${t("common.start")} current @open-node=${(e: CustomEvent<string | null>) => this.ctx.go({ page: "node", id: e.detail })}></ot-path>
      <h1 style="font-size:1.5rem;font-weight:500;margin:4px 0">${t("stocktake.title", { name: n.name })}</h1>
      <p class="small muted" style="margin:0 4px 8px">${t("stocktake.help")}</p>
      <div class="small" style="margin:0 4px 8px" aria-live="polite">${t("stocktake.progress", { done: decided, total: contents.length })}</div>
      ${contents.length === 0
        ? html`<div class="empty"><ha-icon icon="mdi:package-variant-closed"></ha-icon><p>${t("stocktake.empty")}</p></div>`
        : html`<div class="list">${contents.map((c) => this._line(c))}</div>`}
      <div class="bar" role="toolbar" aria-label=${t("stocktake.actions")}>
        <button class="btn" @click=${() => (this._dialog = "add")}><ha-icon icon="mdi:plus"></ha-icon>${t("stocktake.addFound")}</button>
        ${contents.length > decided ? html`<button class="btn text" @click=${this._allPresent}>${t("stocktake.allPresent")}</button>` : nothing}
        <span class="grow"></span>
        <button class="btn text" @click=${this._discard}>${t("stocktake.discard")}</button>
        <button class="btn primary" ?disabled=${this._busy || decided === 0} @click=${this._finish}>${t("stocktake.finish")}</button>
      </div>
      ${this._dialogs(n)}
    `;
  }

  private _line(c: Brief) {
    const t = this.ctx.t;
    const v = this._verdicts[c.id];
    const sub = [c.kind_name, quantityText(c)].filter(Boolean).join(" · ");
    return html`<div class="line">
      <button class="name" @click=${() => this.ctx.go({ page: "node", id: c.id })}>
        <span class="row"><ha-icon class="muted" icon=${iconFor(c)}></ha-icon>${c.number !== null ? html`<span class="badge">${c.number}</span>` : nothing}<span class="title">${c.name}</span></span>
        ${sub ? html`<span class="small muted" style="display:block">${sub}</span>` : nothing}
        ${c.hints.length ? html`<span class="small" style="display:block;color:var(--warning-color)">${c.hints[0].text}</span>` : nothing}
      </button>
      <span class="row3" role="group" aria-label=${c.name}>
        <button class="present" aria-pressed=${v === "present" ? "true" : "false"} aria-label=${`${t("stocktake.present")}: ${c.name}`} title=${t("stocktake.present")} @click=${() => this._mark(c.id, "present")}><ha-icon icon="mdi:check"></ha-icon></button>
        <button class="missing" aria-pressed=${v === "missing" ? "true" : "false"} aria-label=${`${t("stocktake.missing")}: ${c.name}`} title=${t("stocktake.missing")} @click=${() => this._mark(c.id, "missing")}><ha-icon icon="mdi:close"></ha-icon></button>
        <button aria-label=${`${t("stocktake.elsewhere")}: ${c.name}`} title=${t("stocktake.elsewhere")} @click=${() => { this._moveId = c.id; this._dialog = "move"; }}><ha-icon icon="mdi:folder-move-outline"></ha-icon></button>
      </span>
    </div>`;
  }

  private _dialogs(n: Detail) {
    const close = () => (this._dialog = null);
    if (this._dialog === "add") {
      return html`<ot-quickadd .ctx=${this.ctx} .parentId=${n.id} .parentName=${n.name} @saved=${() => { this._dialog = null; this.ctx.toast(this.ctx.t("stocktake.added")); void this._load(); }} @close=${close}></ot-quickadd>`;
    }
    if (this._dialog === "move") {
      return html`<ot-move .ctx=${this.ctx} .ids=${[this._moveId]} .startAt=${n.id} @saved=${() => { this._dialog = null; void this._load(); }} @close=${close}></ot-move>`;
    }
    return nothing;
  }
}
customElements.define("ot-stocktake-page", OtStocktakePage);
