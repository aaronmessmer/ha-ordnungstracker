import { LitElement, css, html, nothing } from "lit";
import { Api, ApiError } from "../lib/api";
import type { AppContext, ConfirmOptions } from "../lib/context";
import { errorMessage } from "../lib/context";
import { asNumberQuery } from "../lib/format";
import { makeT } from "../lib/i18n";
import { pickLanguage } from "../lib/i18n";
import { debounce } from "../lib/latest";
import { Navigator, type Route, parseRoute } from "../lib/router";
import { baseStyles } from "../lib/styles";
import type { Catalog, ChangeEvent, HomeAssistant, Status } from "../types";

interface Toast {
  id: number;
  message: string;
  kind: "info" | "error";
}

const CATALOG_ACTIONS = /^(kind|person|field_def|synonyms|settings|template|sample|import|restore|list|reload|rollback)/;
const TOAST_MS = 3000;
const MAX_TOASTS = 2;

/** Seitenleisten-Panel „Ordnung“: Hülle mit Kopfzeile, Suche, Navigation, Baum (breit), Abo auf Änderungen. */
export class OtPanel extends LitElement {
  static properties = {
    hass: { attribute: false },
    narrow: { type: Boolean },
    route: { attribute: false },
    panel: { attribute: false },
    _route: { state: true },
    _ctx: { state: true },
    _toasts: { state: true },
    _confirm: { state: true },
    _search: { state: true },
    _numberId: { state: true },
    _booting: { state: true },
    _fatal: { state: true },
  };
  declare hass: HomeAssistant;
  declare narrow: boolean;
  declare route: unknown;
  declare panel: unknown;
  declare _route: Route;
  declare _ctx: AppContext | null;
  declare _toasts: Toast[];
  declare _confirm: (ConfirmOptions & { resolve: (v: boolean) => void }) | null;
  declare _search: string;
  declare _numberId: { number: number; id: string } | null;
  declare _booting: boolean;
  declare _fatal: string;

  private _api: Api | null = null;
  private _nav = new Navigator(window);
  private _unsub: (() => void) | undefined;
  private _revision = 0;
  private _catalog: Catalog | null = null;
  private _status: Status | null = null;
  private _toastSeq = 0;
  private _started = false;

  constructor() {
    super();
    this.narrow = false;
    this._route = { page: "overview" };
    this._ctx = null;
    this._toasts = [];
    this._confirm = null;
    this._search = "";
    this._numberId = null;
    this._booting = true;
    this._fatal = "";
  }

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        min-height: 100%;
        background: var(--primary-background-color);
        --ot-touch: 48px;
      }
      header.bar {
        position: sticky;
        top: 0;
        z-index: 8;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        min-height: 56px;
        background: var(--app-header-background-color, var(--primary-color));
        color: var(--app-header-text-color, var(--text-primary-color, #fff));
      }
      header.bar .icon-btn {
        color: inherit;
      }
      header.bar h1 {
        font-size: 1.15rem;
        padding: 0 8px;
        white-space: nowrap;
      }
      header.bar input[type="search"] {
        flex: 1;
        min-width: 0;
        background: color-mix(in srgb, #fff 22%, transparent);
        color: inherit;
        border: none;
        border-radius: 24px;
        padding: 0 16px;
        min-height: 40px;
      }
      header.bar input::placeholder {
        color: inherit;
        opacity: 0.8;
      }
      nav.top {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        scrollbar-width: none;
        padding: 10px 16px 0;
        max-width: 1200px;
        margin: 0 auto;
      }
      .layout {
        display: flex;
        align-items: flex-start;
        max-width: 1200px;
        margin: 0 auto;
      }
      aside {
        width: 280px;
        flex: none;
        position: sticky;
        top: 64px;
        max-height: calc(100dvh - 72px);
        overflow-y: auto;
        padding: 12px 0 12px 12px;
      }
      main {
        flex: 1;
        min-width: 0;
        padding: 12px 16px 96px;
      }
      .toasts {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        top: 64px;
        z-index: 30;
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: min(480px, 100vw - 32px);
        pointer-events: none;
      }
      .toast {
        pointer-events: auto;
        padding: 12px 16px;
        border-radius: 8px;
        background: var(--primary-text-color);
        color: var(--primary-background-color);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      }
      .toast.error {
        background: var(--error-color, #db4437);
        color: #fff;
      }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    this._nav.start();
    this._route = this._nav.current();
    this._unsubRoute = this._nav.subscribe((r) => this._onRoute(r));
  }

  private _unsubRoute: (() => void) | undefined;

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._nav.stop();
    this._unsubRoute?.();
    this._unsub?.();
    this._unsub = undefined;
    this._started = false;
  }

  /** `hass` ändert sich bei jeder Zustandsänderung in Home Assistant – dafür muss nichts neu gezeichnet werden. */
  protected shouldUpdate(changed: Map<string, unknown>): boolean {
    if (this.hasUpdated && changed.size === 1 && changed.has("hass")) {
      const old = changed.get("hass") as HomeAssistant | undefined;
      return !old || old.language !== this.hass.language;
    }
    return true;
  }

  willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("narrow") && this._api) this._rebuild();
    if (changed.has("hass") && this.hass) {
      if (!this._api) this._api = new Api(this.hass);
      else this._api.setHass(this.hass);
      if (!this._started) {
        this._started = true;
        void this._boot();
      } else if (changed.get("hass") && (changed.get("hass") as HomeAssistant).language !== this.hass.language) {
        this._rebuild();
      }
    }
  }

  // ---- Start und Abo -------------------------------------------------------------------
  private async _boot(): Promise<void> {
    try {
      await this._loadCatalog();
      this._booting = false;
      this._unsub = await this._api!.subscribe((e) => this._changed(e));
    } catch (err) {
      this._fatal = err instanceof ApiError && err.code === "not_loaded" ? err.message : errorMessage(err);
      this._booting = false;
    }
  }

  private async _loadCatalog(): Promise<void> {
    const [catalog, status] = await Promise.all([this._api!.catalog(), this._api!.status()]);
    this._catalog = catalog;
    this._status = status;
    this._rebuild();
  }

  private _bumpDebounced = debounce(() => {
    this._revision++;
    this._rebuild();
  }, 120);

  private _changed(e: ChangeEvent): void {
    if (e.reload || e.actions.some((a) => CATALOG_ACTIONS.test(a))) {
      void this._loadCatalog().then(() => this._bumpDebounced());
    } else {
      void this._api!.status().then((s) => {
        this._status = s;
      });
      this._bumpDebounced();
    }
  }

  private _rebuild(): void {
    if (!this._api) return;
    const lang = pickLanguage(this.hass?.language);
    const self = this;
    this._ctx = {
      get hass() {
        return self.hass; // immer der aktuelle Stand, ohne bei jeder Zustandsänderung neu zu zeichnen
      },
      api: this._api,
      t: makeT(this.hass?.language),
      lang,
      nav: this._nav,
      catalog: this._catalog,
      status: this._status,
      narrow: this.narrow,
      revision: this._revision,
      go: (route, opts) => this._nav.navigate(route, opts),
      toast: (m, k) => self._toast(m, k),
      confirm: (o) => self._askConfirm(o),
      reloadCatalog: () => self._loadCatalog(),
    };
  }

  // ---- Hilfen für Seiten ---------------------------------------------------------------
  private _toast(message: string, kind: "info" | "error" = "info"): void {
    const id = ++this._toastSeq;
    this._toasts = [...this._toasts, { id, message, kind }].slice(-MAX_TOASTS);
    setTimeout(() => (this._toasts = this._toasts.filter((t) => t.id !== id)), kind === "error" ? TOAST_MS * 2 : TOAST_MS);
  }

  private _askConfirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this._confirm = { ...options, resolve };
    });
  }

  private _answer(value: boolean): void {
    this._confirm?.resolve(value);
    this._confirm = null;
  }

  private async _onRoute(route: Route): Promise<void> {
    this._route = route;
    this._numberId = null;
    if (route.page === "search") this._search = route.query;
    else if (route.page === "overview") this._search = "";
    if (route.page === "number") {
      try {
        const d = await this._api!.byNumber(route.number);
        if (this._route === route) this._numberId = { number: route.number, id: d.id };
      } catch (err) {
        this._toast(errorMessage(err), "error");
        this._nav.navigate({ page: "overview" }, { replace: true });
      }
    }
  }

  protected updated(): void {
    // Auf dem Handy kann die Leiste scrollen: den aktiven Reiter sichtbar halten.
    const active = this.renderRoot.querySelector<HTMLElement>("nav.top .chip[aria-pressed=true]");
    active?.scrollIntoView?.({ inline: "center", block: "nearest" });
  }

  protected firstUpdated(): void {
    void this._onRoute(this._route);
  }

  // ---- Suche in der Kopfzeile -----------------------------------------------------------
  private _typeSearch = debounce((text: string) => {
    const route = this._route;
    const filters = route.page === "search" ? route.filters : {};
    if (!text.trim() && route.page === "search" && Object.keys(filters).length === 0) {
      this._nav.navigate({ page: "overview" }, { replace: true });
      return;
    }
    if (!text.trim() && route.page !== "search") return;
    this._nav.navigate({ page: "search", query: text, filters }, { replace: route.page === "search" });
  }, 250);

  private async _enter(): Promise<void> {
    this._typeSearch.cancel();
    const number = asNumberQuery(this._search);
    if (number === null) {
      const route = this._route;
      this._nav.navigate({ page: "search", query: this._search, filters: route.page === "search" ? route.filters : {} });
      return;
    }
    try {
      const d = await this._api!.byNumber(number);
      this._nav.navigate({ page: "node", id: d.id });
    } catch {
      this._nav.navigate({ page: "search", query: this._search, filters: {} }); // keine Kiste mit dieser Nummer: normal suchen
    }
  }

  private _back(): void {
    if (window.history.length > 1) this._nav.back();
    else this._nav.navigate({ page: "overview" });
  }

  // ---- Darstellung ---------------------------------------------------------------------
  render() {
    const ctx = this._ctx;
    const t = ctx?.t ?? makeT(this.hass?.language);
    const onOverview = this._route.page === "overview";
    return html`
      <header class="bar">
        ${this.narrow
          ? html`<button class="icon-btn" aria-label=${t("nav.menu")} @click=${() => this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }))}><ha-icon icon="mdi:menu"></ha-icon></button>`
          : nothing}
        ${!onOverview
          ? html`<button class="icon-btn" aria-label=${t("nav.back")} @click=${this._back}><ha-icon icon="mdi:arrow-left"></ha-icon></button>`
          : nothing}
        ${this.narrow ? nothing : html`<h1>${t("app.title")}</h1>`}
        <input
          type="search"
          .value=${this._search}
          placeholder=${t("search.placeholder")}
          aria-label=${t("search.placeholder")}
          enterkeyhint="search"
          @input=${(e: Event) => {
            this._search = (e.target as HTMLInputElement).value;
            this._typeSearch(this._search);
          }}
          @keydown=${(e: KeyboardEvent) => e.key === "Enter" && this._enter()}
        />
        <button class="icon-btn" aria-label=${t("nav.settings")} @click=${() => this._nav.navigate({ page: "settings", section: "" })}><ha-icon icon="mdi:cog-outline"></ha-icon></button>
      </header>
      ${this._booting
        ? html`<main><div class="empty muted">${t("common.loading")}</div></main>`
        : this._fatal
          ? html`<main><div class="empty"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><p class="error-text" role="alert">${this._fatal}</p></div></main>`
          : ctx
            ? this._layout(ctx)
            : nothing}
      <div class="toasts" aria-live="polite">
        ${this._toasts.map((x) => html`<div class="toast ${x.kind}" role=${x.kind === "error" ? "alert" : "status"}>${x.message}</div>`)}
      </div>
      ${this._confirm
        ? html`<ot-confirm
            .heading=${this._confirm.title}
            .message=${this._confirm.message}
            .confirmLabel=${this._confirm.confirmLabel}
            .cancelLabel=${t("common.cancel")}
            .danger=${this._confirm.danger ?? false}
            @confirm=${() => this._answer(true)}
            @cancel=${() => this._answer(false)}
          ></ot-confirm>`
        : nothing}
    `;
  }

  private _layout(ctx: AppContext) {
    const t = ctx.t;
    const r = this._route;
    const currentId = r.page === "node" ? (r.id ?? "") : r.page === "number" ? (this._numberId?.id ?? "") : "";
    const tab = (page: Route["page"], label: string, route: Route, icon: string) =>
      html`<button class="chip" style="min-height:36px" aria-pressed=${r.page === page ? "true" : "false"} @click=${() => this._nav.navigate(route)}><ha-icon icon=${icon} style="--mdc-icon-size:18px"></ha-icon>${label}</button>`;
    return html`
      <nav class="top" aria-label=${t("nav.main")}>
        ${tab("overview", t("nav.overview"), { page: "overview" }, "mdi:view-dashboard-outline")}
        ${tab("node", t("nav.browse"), { page: "node", id: null }, "mdi:folder-outline")}
        ${tab("due", t("nav.due"), { page: "due" }, "mdi:calendar-alert")}
        ${tab("out", t("nav.out"), { page: "out" }, "mdi:package-up")}
        ${tab("restock", t("nav.restock"), { page: "restock" }, "mdi:cart-outline")}
        ${tab("trash", t("nav.trash"), { page: "trash" }, "mdi:delete-outline")}
      </nav>
      <div class="layout">
        ${this.narrow ? nothing : html`<aside><ot-tree .ctx=${ctx} .currentId=${currentId}></ot-tree></aside>`}
        <main>${this._page(ctx)}</main>
      </div>
    `;
  }

  private _page(ctx: AppContext) {
    const r = this._route;
    switch (r.page) {
      case "overview":
        return html`<ot-overview .ctx=${ctx}></ot-overview>`;
      case "node":
        return html`<ot-node-page .ctx=${ctx} .nodeId=${r.id}></ot-node-page>`;
      case "number":
        return this._numberId
          ? html`<ot-node-page .ctx=${ctx} .nodeId=${this._numberId.id}></ot-node-page>`
          : html`<div class="empty muted">${ctx.t("common.loading")}</div>`;
      case "search":
        return html`<ot-search-page .ctx=${ctx} .query=${r.query} .filters=${r.filters}></ot-search-page>`;
      case "trash":
        return html`<ot-trash-page .ctx=${ctx}></ot-trash-page>`;
      case "due":
        return html`<ot-due-page .ctx=${ctx}></ot-due-page>`;
      case "restock":
        return html`<ot-due-page .ctx=${ctx} only="below_min"></ot-due-page>`;
      case "out":
        return html`<ot-out-page .ctx=${ctx}></ot-out-page>`;
      case "settings":
        return html`<ot-settings-page .ctx=${ctx} .section=${r.section}></ot-settings-page>`;
    }
  }
}
customElements.define("ordnungstracker-panel", OtPanel);

export { parseRoute };
