import { LitElement, css, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { asNumberQuery, iconFor, pathText } from "../lib/format";
import { Latest, debounce } from "../lib/latest";
import { baseStyles } from "../lib/styles";
import type { Brief, Detail, PathPart, RootView } from "../types";

interface Target {
  id: string | null;
  label: string;
}

interface Option {
  id: string;
  name: string;
  icon: string;
  number: number | null;
  subtitle: string;
  hasChildren: boolean;
}

const UNSORTED = "unsortiert";
const TRASH = "papierkorb";

/**
 * Verschieben (Pflichtenheft 8.4): Ziel über Suche, Stöbern, Eingabe einer Kistennummer oder die
 * zuletzt verwendeten Ziele wählen. Der Inhalt wandert immer mit; mehrere Einträge auf einmal sind möglich.
 */
export class OtMove extends LitElement {
  static properties = {
    ctx: { attribute: false },
    ids: { attribute: false },
    startAt: { type: String },
    _query: { state: true },
    _results: { state: true },
    _browse: { state: true },
    _recent: { state: true },
    _target: { state: true },
    _error: { state: true },
    _busy: { state: true },
  };
  declare ctx: AppContext;
  declare ids: string[];
  declare startAt: string;
  declare _query: string;
  declare _results: Option[] | null;
  declare _browse: { path: PathPart[]; options: Option[] };
  declare _recent: Option[];
  declare _target: Target | null;
  declare _error: string;
  declare _busy: boolean;

  private _latest = new Latest();

  constructor() {
    super();
    this.ids = [];
    this.startAt = "";
    this._query = "";
    this._results = null;
    this._browse = { path: [], options: [] };
    this._recent = [];
    this._target = null;
    this._error = "";
    this._busy = false;
  }

  static styles = [
    baseStyles,
    css`
      .opt {
        display: flex;
        align-items: stretch;
        border-bottom: 1px solid var(--divider-color);
      }
      .opt:last-child {
        border-bottom: none;
      }
      .opt .main {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 52px;
        padding: 6px 10px;
        background: transparent;
        border: none;
        text-align: left;
      }
      .opt.sel .main {
        background: color-mix(in srgb, var(--primary-color) 18%, transparent);
      }
      .opt .main[disabled] {
        opacity: 0.4;
      }
      .opt .down {
        width: 48px;
        border: none;
        border-left: 1px solid var(--divider-color);
        background: transparent;
      }
      .target {
        font-size: 0.95rem;
      }
    `,
  ];

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    try {
      const user = await this.ctx.api.user();
      this._recent = user.targets.filter((b) => !this.ids.includes(b.id)).map((b) => this._fromBrief(b));
    } catch {
      /* ohne zuletzt verwendete Ziele geht es auch */
    }
    await this._open(this.startAt || null);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._latest.cancel();
    this._search.cancel();
  }

  private _fromBrief(b: Brief, subtitle = ""): Option {
    return {
      id: b.id,
      name: b.name,
      icon: iconFor(b),
      number: b.number,
      subtitle: subtitle || b.kind_name,
      hasChildren: b.children > 0,
    };
  }

  /** Stöbern: Inhalt eines Ortes (nur Dinge, die selbst Inhalt haben können). */
  private async _open(id: string | null): Promise<void> {
    try {
      const view = await this.ctx.api.node(id);
      if (id === null) {
        this._browse = { path: [], options: (view as RootView).contents.filter((b) => b.id !== TRASH).map((b) => this._fromBrief(b)) };
      } else {
        const d = view as Detail;
        this._browse = { path: d.path, options: d.contents.filter((b) => b.class !== "item").map((b) => this._fromBrief(b)) };
      }
    } catch (err) {
      this._error = errorMessage(err);
    }
  }

  private _search = debounce(async () => {
    const q = this._query.trim();
    if (!q) {
      this._latest.cancel();
      this._results = null;
      return;
    }
    try {
      const out = await this._latest.run(async () => {
        const number = asNumberQuery(q);
        const found: Option[] = [];
        if (number !== null) {
          try {
            const d = await this.ctx.api.byNumber(number);
            found.push({ ...this._fromBrief(d, pathText(d.path, false)), hasChildren: d.children > 0 });
          } catch {
            /* keine Kiste mit dieser Nummer */
          }
        }
        const res = await this.ctx.api.search(q, { classes: ["place", "furniture", "container", "group"] }, 30);
        for (const h of res.hits) {
          if (found.some((f) => f.id === h.id)) continue;
          const kind = this.ctx.catalog?.kinds.find((k) => k.id === h.kind);
          found.push({
            id: h.id,
            name: h.name,
            icon: iconFor({ icon: kind?.icon ?? "", class: h.class }),
            number: h.number,
            subtitle: pathText(h.path, false),
            hasChildren: false,
          });
        }
        return found;
      });
      if (out) this._results = out;
    } catch (err) {
      this._error = errorMessage(err);
    }
  }, 200);

  private _choose(o: Option): void {
    this._target = { id: o.id, label: o.subtitle && o.id !== o.name ? `${o.name}` : o.name };
    this._error = "";
  }

  private _disabled(id: string): boolean {
    return this.ids.includes(id) || id === TRASH;
  }

  private async _move(): Promise<void> {
    if (!this._target) return;
    this._busy = true;
    this._error = "";
    try {
      const target = this._target.id;
      await this.ctx.api.move(this.ids, target);
      if (target) await this.ctx.api.addTarget(target).catch(() => undefined);
      this.dispatchEvent(new CustomEvent("saved", { detail: { count: this.ids.length, target: this._target.label }, bubbles: true, composed: true }));
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private _opt(o: Option, canDescend: boolean) {
    const t = this.ctx.t;
    const sel = this._target?.id === o.id;
    return html`
      <div class="opt ${sel ? "sel" : ""}">
        <button class="main" ?disabled=${this._disabled(o.id)} aria-pressed=${sel ? "true" : "false"} @click=${() => this._choose(o)}>
          <ha-icon class="icon muted" icon=${o.icon}></ha-icon>
          <span class="grow">
            <span class="row">
              ${o.number !== null ? html`<span class="badge">${o.number}</span>` : nothing}
              <span class="ellipsis">${o.name}</span>
            </span>
            <span class="small muted ellipsis" style="display:block">${o.subtitle}</span>
          </span>
        </button>
        ${canDescend && o.hasChildren && !this._disabled(o.id)
          ? html`<button class="down" aria-label=${t("move.open", { name: o.name })} @click=${() => this._open(o.id)}><ha-icon icon="mdi:chevron-right"></ha-icon></button>`
          : nothing}
      </div>
    `;
  }

  render() {
    const t = this.ctx.t;
    const count = this.ids.length;
    const here = this._browse.path[this._browse.path.length - 1];
    return html`
      <ot-dialog .heading=${count === 1 ? t("move.titleOne") : t("move.titleMany", { n: count })} .closeLabel=${t("common.close")} wide>
        <div class="stack">
          <label class="field">
            ${t("move.search")}
            <input
              type="search"
              .value=${this._query}
              placeholder=${t("move.searchPlaceholder")}
              @input=${(e: Event) => {
                this._query = (e.target as HTMLInputElement).value;
                this._search();
              }}
            />
          </label>
          ${this._results !== null
            ? html`
                <div class="list">
                  ${this._results.length
                    ? this._results.map((o) => this._opt(o, false))
                    : html`<div class="empty">${t("search.none")}</div>`}
                </div>
              `
            : html`
                ${this._recent.length
                  ? html`<div>
                      <h3>${t("move.recent")}</h3>
                      <div class="list" style="margin-top:6px">${this._recent.map((o) => this._opt(o, false))}</div>
                    </div>`
                  : nothing}
                <div>
                  <h3>${t("move.browse")}</h3>
                  <ot-path
                    .path=${this._browse.path}
                    .rootLabel=${t("common.start")}
                    current
                    @open-node=${(e: CustomEvent<string | null>) => this._open(e.detail)}
                  ></ot-path>
                  <div class="row wrap" style="margin:6px 0">
                    ${here
                      ? html`<button class="btn" ?disabled=${this._disabled(here.id)} @click=${() => this._choose({ id: here.id, name: here.name, icon: "", number: null, subtitle: "", hasChildren: false })}>${t("move.chooseHere", { name: here.name })}</button>`
                      : html`<button class="btn" @click=${() => (this._target = { id: null, label: t("move.topLevel") })}>${t("move.topLevel")}</button>
                          <button class="btn" @click=${() => (this._target = { id: UNSORTED, label: t("overview.unsorted") })}>${t("overview.unsorted")}</button>`}
                  </div>
                  <div class="list">
                    ${this._browse.options.length
                      ? this._browse.options.map((o) => this._opt(o, true))
                      : html`<div class="empty small">${t("move.nothingBelow")}</div>`}
                  </div>
                </div>
              `}
          ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
        </div>
        <span slot="footer" class="grow target ellipsis">${this._target ? t("move.target", { name: this._target.label }) : t("move.noTarget")}</span>
        <button slot="footer" class="btn primary" ?disabled=${this._busy || !this._target} @click=${this._move}>${t("move.do")}</button>
      </ot-dialog>
    `;
  }
}
customElements.define("ot-move", OtMove);
