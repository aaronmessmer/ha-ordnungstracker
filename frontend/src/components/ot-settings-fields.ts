import { LitElement, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { parseList } from "../lib/format";
import { baseStyles } from "../lib/styles";
import type { FieldDef, FieldType, KindClass } from "../types";
import "./ot-node-picker";

const TYPES: FieldType[] = ["text", "multiline", "number", "date", "bool", "choice", "link"];
const CLASSES: KindClass[] = ["place", "furniture", "container", "group", "item"];

interface Draft {
  id: string | null;
  name: string;
  type: FieldType;
  group: string;
  scopeNode: string;
  scopeName: string;
  kinds: string[];
  classes: KindClass[];
  unit: string;
  options: string;
  remind: string;
  builtin: boolean;
}

/** Eigene Felder verwalten (Pflichtenheft 5.8, 8.13): anlegen, ändern, mitgelieferte aus- und einblenden, löschen. */
export class OtSettingsFields extends LitElement {
  static properties = {
    ctx: { attribute: false },
    _draft: { state: true },
    _error: { state: true },
    _busy: { state: true },
    _scopeNames: { state: true },
  };
  declare ctx: AppContext;
  declare _draft: Draft | null;
  declare _error: string;
  declare _busy: boolean;
  declare _scopeNames: Record<string, string>;

  constructor() {
    super();
    this._draft = null;
    this._error = "";
    this._busy = false;
    this._scopeNames = {};
  }

  static styles = [baseStyles];

  protected willUpdate(): void {
    for (const f of this.ctx?.catalog?.fields ?? []) {
      const id = f.scope.node;
      if (id && !(id in this._scopeNames)) {
        this._scopeNames = { ...this._scopeNames, [id]: "…" };
        void this.ctx.api
          .node(id)
          .then((d) => (this._scopeNames = { ...this._scopeNames, [id]: "name" in d ? (d as { name: string }).name : id }))
          .catch(() => (this._scopeNames = { ...this._scopeNames, [id]: id }));
      }
    }
  }

  private _edit(f: FieldDef | null): void {
    this._error = "";
    this._draft = f
      ? {
          id: f.id,
          name: f.name,
          type: f.type,
          group: f.group ?? "",
          scopeNode: f.scope.node ?? "",
          scopeName: f.scope.node ? (this._scopeNames[f.scope.node] ?? "") : "",
          kinds: [...(f.kinds ?? [])],
          classes: [...(f.classes ?? [])],
          unit: f.unit ?? "",
          options: (f.options ?? []).join("\n"),
          remind: f.remind_days_before !== undefined ? String(f.remind_days_before) : "",
          builtin: !!f.builtin,
        }
      : { id: null, name: "", type: "text", group: "", scopeNode: "", scopeName: "", kinds: [], classes: [], unit: "", options: "", remind: "", builtin: false };
  }

  private async _save(): Promise<void> {
    const d = this._draft;
    if (!d) return;
    const t = this.ctx.t;
    if (!d.name.trim()) {
      this._error = t("form.nameRequired");
      return;
    }
    const remind = d.remind.trim() === "" ? null : Number.parseInt(d.remind, 10);
    if (remind !== null && !(remind >= 0)) {
      this._error = t("fields.remindInvalid");
      return;
    }
    this._busy = true;
    try {
      const options = parseList(d.options);
      if (d.id) {
        await this.ctx.api.fieldDefUpdate(d.id, {
          name: d.name,
          group: d.group,
          kinds: d.kinds,
          classes: d.classes,
          ...(d.type === "number" ? { unit: d.unit } : {}),
          ...(d.type === "choice" ? { options } : {}),
          ...(d.type === "date" ? { remind_days_before: remind } : {}),
        });
      } else {
        await this.ctx.api.fieldDefAdd({
          name: d.name,
          field_type: d.type,
          ...(d.group ? { group: d.group } : {}),
          ...(d.scopeNode ? { scope_node: d.scopeNode } : {}),
          ...(d.kinds.length ? { kinds: d.kinds } : {}),
          ...(d.classes.length ? { classes: d.classes } : {}),
          ...(d.type === "number" && d.unit ? { unit: d.unit } : {}),
          ...(d.type === "choice" ? { options } : {}),
          ...(d.type === "date" && remind !== null ? { remind_days_before: remind } : {}),
        });
      }
      this._draft = null;
      await this.ctx.reloadCatalog();
      this.ctx.toast(t("form.saved"));
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private async _delete(): Promise<void> {
    const d = this._draft;
    if (!d?.id) return;
    const t = this.ctx.t;
    const ok = await this.ctx.confirm({
      title: t("fields.deleteTitle", { name: d.name }),
      message: t("fields.deleteMessage"),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    try {
      await this.ctx.api.fieldDefDelete(d.id);
      this._draft = null;
      await this.ctx.reloadCatalog();
      this.ctx.toast(t("fields.deleted"));
    } catch (err) {
      this._error = errorMessage(err);
    }
  }

  private async _toggleHidden(f: FieldDef): Promise<void> {
    try {
      await this.ctx.api.fieldDefUpdate(f.id, { hidden: !f.hidden });
      await this.ctx.reloadCatalog();
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  private _toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
  }

  render() {
    const t = this.ctx.t;
    const fields = this.ctx.catalog?.fields ?? [];
    const groups = [...new Set(fields.map((f) => f.group ?? ""))];
    return html`
      <p class="muted small" style="margin:0 4px 10px">${t("fields.help")}</p>
      ${groups.map((g) => html`
        <div class="section-title">${g || t("form.fieldsOther")}</div>
        <div class="list">${fields.filter((f) => (f.group ?? "") === g).map((f) => this._row(f))}</div>`)}
      ${fields.length === 0 ? html`<div class="empty small">${t("fields.none")}</div>` : nothing}
      <div style="margin-top:12px"><button class="btn primary" @click=${() => this._edit(null)}><ha-icon icon="mdi:plus"></ha-icon>${t("fields.new")}</button></div>
      ${this._dialog()}
    `;
  }

  private _row(f: FieldDef) {
    const t = this.ctx.t;
    const scope = f.scope.node ? t("fields.scopeLocal", { name: this._scopeNames[f.scope.node] ?? "…" }) : t("fields.scopeGlobal");
    const rest = [t(`fields.type.${f.type}` as never), scope, f.remind_days_before !== undefined ? t("fields.remindShort", { n: f.remind_days_before }) : ""].filter(Boolean).join(" · ");
    return html`<div class="rowbox" style="display:flex;align-items:center;border-bottom:1px solid var(--divider-color);${f.hidden ? "opacity:.6" : ""}">
      <button class="item" style="border:none;flex:1;min-width:0;width:auto" @click=${() => this._edit(f)}>
        <span class="grow"><span class="title">${f.name}</span>
          <span class="small muted" style="display:block">${rest}</span></span>
        ${f.builtin ? html`<span class="chip">${t("fields.builtin")}</span>` : nothing}
      </button>
      <button class="btn text" aria-pressed=${f.hidden ? "true" : "false"} aria-label=${`${f.hidden ? t("fields.show") : t("fields.hide")}: ${f.name}`} @click=${() => this._toggleHidden(f)}>
        <ha-icon icon=${f.hidden ? "mdi:eye-off-outline" : "mdi:eye-outline"}></ha-icon>${f.hidden ? t("fields.show") : t("fields.hide")}</button>
    </div>`;
  }

  private _dialog() {
    const d = this._draft;
    if (!d) return nothing;
    const t = this.ctx.t;
    const set = (patch: Partial<Draft>) => (this._draft = { ...d, ...patch });
    const kinds = this.ctx.catalog?.kinds ?? [];
    return html`<ot-dialog .heading=${d.id ? t("fields.edit") : t("fields.new")} .closeLabel=${t("common.close")} @close=${() => (this._draft = null)}>
      <div class="stack">
        <label class="field">${t("form.name")} *<input .value=${d.name} @input=${(e: Event) => set({ name: (e.target as HTMLInputElement).value })} /></label>
        <label class="field">${t("fields.typeLabel")}
          <select .value=${d.type} ?disabled=${!!d.id} @change=${(e: Event) => set({ type: (e.target as HTMLSelectElement).value as FieldType })}>
            ${TYPES.map((x) => html`<option value=${x} ?selected=${x === d.type}>${t(`fields.type.${x}` as never)}</option>`)}
          </select></label>
        <label class="field">${t("fields.group")}<input .value=${d.group} placeholder=${t("fields.groupPlaceholder")} @input=${(e: Event) => set({ group: (e.target as HTMLInputElement).value })} /></label>
        ${d.type === "number" ? html`<label class="field">${t("fields.unit")}<input .value=${d.unit} @input=${(e: Event) => set({ unit: (e.target as HTMLInputElement).value })} /></label>` : nothing}
        ${d.type === "choice" ? html`<label class="field">${t("fields.options")}<textarea rows="3" .value=${d.options} @input=${(e: Event) => set({ options: (e.target as HTMLTextAreaElement).value })}></textarea><span class="small muted">${t("fields.optionsHelp")}</span></label>` : nothing}
        ${d.type === "date" ? html`<label class="field">${t("fields.remind")}<input type="number" inputmode="numeric" min="0" .value=${d.remind} placeholder=${t("fields.remindNone")} @input=${(e: Event) => set({ remind: (e.target as HTMLInputElement).value })} /><span class="small muted">${t("fields.remindHelp")}</span></label>` : nothing}
        ${d.id
          ? html`<div class="small muted">${d.scopeNode ? t("fields.scopeLocal", { name: d.scopeName || this._scopeNames[d.scopeNode] || d.scopeNode }) : t("fields.scopeGlobal")} · ${t("fields.scopeFixed")}</div>`
          : html`<ot-node-picker .ctx=${this.ctx} .label=${t("fields.scopeLabel")} .value=${d.scopeNode} .valueName=${d.scopeName} @picked=${(e: CustomEvent<{ id: string; name: string }>) => set({ scopeNode: e.detail.id, scopeName: e.detail.name })}></ot-node-picker>
            ${d.scopeNode ? nothing : html`<div class="small muted">${t("fields.scopeHelp")}</div>`}`}
        <details>
          <summary style="min-height:44px;display:flex;align-items:center;color:var(--primary-color)">${t("fields.restrict")}</summary>
          <div class="stack" style="margin-top:8px">
            <div class="small muted">${t("fields.restrictHelp")}</div>
            <div class="row wrap">${CLASSES.map((c) => html`<button class="chip" aria-pressed=${d.classes.includes(c) ? "true" : "false"} @click=${() => set({ classes: this._toggle(d.classes, c) })}>${t(`class.${c}` as never)}</button>`)}</div>
            <div class="row wrap">${kinds.map((k) => html`<button class="chip" aria-pressed=${d.kinds.includes(k.id) ? "true" : "false"} @click=${() => set({ kinds: this._toggle(d.kinds, k.id) })}>${k.name}</button>`)}</div>
          </div>
        </details>
        ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
      </div>
      ${d.id && !d.builtin ? html`<button slot="footer" class="btn danger" @click=${this._delete}>${t("common.delete")}</button><span slot="footer" class="grow"></span>` : nothing}
      <button slot="footer" class="btn primary" ?disabled=${this._busy} @click=${this._save}>${t("common.save")}</button>
    </ot-dialog>`;
  }
}
customElements.define("ot-settings-fields", OtSettingsFields);
