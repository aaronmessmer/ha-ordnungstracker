import { LitElement, html, nothing } from "lit";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { parseList } from "../lib/format";
import { canAdmin } from "../lib/print";
import { countTemplateNodes, parseTemplateLines, templateLines } from "../lib/templates";
import { baseStyles } from "../lib/styles";
import type { Template } from "../types";

interface Draft {
  name: string;
  kind: string;
  tags: string;
  owner: string;
  lines: string;
  subKind: string;
}

/** Vorlagen (Pflichtenheft 5.11): Voreinstellung für neue Einträge, wahlweise mit vorgegebenen Unterpunkten. */
export class OtSettingsTemplates extends LitElement {
  static properties = {
    ctx: { attribute: false },
    _draft: { state: true },
    _show: { state: true },
    _error: { state: true },
    _busy: { state: true },
  };
  declare ctx: AppContext;
  declare _draft: Draft | null;
  declare _show: Template | null;
  declare _error: string;
  declare _busy: boolean;

  constructor() {
    super();
    this._draft = null;
    this._show = null;
    this._error = "";
    this._busy = false;
  }

  static styles = [baseStyles];

  private get _kinds() {
    return this.ctx.catalog?.kinds ?? [];
  }

  private _new(): void {
    const kinds = this._kinds;
    this._error = "";
    this._draft = {
      name: "",
      kind: kinds.find((k) => k.class === "container")?.id ?? kinds[0]?.id ?? "",
      tags: "",
      owner: "",
      lines: "",
      subKind: kinds.find((k) => k.class === "group")?.id ?? kinds[0]?.id ?? "",
    };
  }

  private async _save(): Promise<void> {
    const d = this._draft;
    if (!d) return;
    const t = this.ctx.t;
    if (!d.name.trim()) {
      this._error = t("form.nameRequired");
      return;
    }
    const deep = this._kinds.find((k) => k.class === "item")?.id ?? d.subKind;
    this._busy = true;
    try {
      await this.ctx.api.templateAdd({
        name: d.name.trim(),
        kind: d.kind,
        ...(parseList(d.tags).length ? { tags: parseList(d.tags) } : {}),
        ...(d.owner ? { owner: d.owner } : {}),
        children: parseTemplateLines(d.lines, d.subKind, deep),
      });
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
    const tpl = this._show;
    if (!tpl) return;
    const t = this.ctx.t;
    const ok = await this.ctx.confirm({ title: t("templates.deleteTitle", { name: tpl.name }), message: t("templates.deleteMessage"), confirmLabel: t("common.delete"), danger: true });
    if (!ok) return;
    try {
      await this.ctx.api.templateDelete(tpl.id);
      this._show = null;
      await this.ctx.reloadCatalog();
      this.ctx.toast(t("templates.deleted"));
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  render() {
    const t = this.ctx.t;
    const templates = this.ctx.catalog?.templates ?? [];
    const kindName = (id: string) => this._kinds.find((k) => k.id === id)?.name ?? id;
    return html`
      <p class="muted small" style="margin:0 4px 10px">${t("templates.help")}</p>
      ${templates.length
        ? html`<div class="list">${templates.map((x) => html`<button class="item" style="width:100%" @click=${() => (this._show = x)}>
            <ha-icon class="icon" icon="mdi:file-tree-outline"></ha-icon>
            <span class="grow"><span class="title">${x.name}</span>
              <span class="small muted" style="display:block">${kindName(x.kind)} · ${t("templates.parts", { n: countTemplateNodes(x.children) })}</span></span>
            <ha-icon class="icon" icon="mdi:chevron-right"></ha-icon></button>`)}</div>`
        : html`<div class="empty small">${t("templates.none")}</div>`}
      <div style="margin-top:12px"><button class="btn primary" @click=${this._new}><ha-icon icon="mdi:plus"></ha-icon>${t("templates.new")}</button></div>
      ${this._showDialog(kindName)}${this._editDialog()}
    `;
  }

  private _showDialog(kindName: (id: string) => string) {
    const x = this._show;
    if (!x) return nothing;
    const t = this.ctx.t;
    const lines = templateLines(x.children);
    return html`<ot-dialog .heading=${x.name} .closeLabel=${t("common.close")} @close=${() => (this._show = null)}>
      <div class="stack">
        <div>${t("form.kind")}: <strong>${kindName(x.kind)}</strong></div>
        ${x.tags?.length ? html`<div>${t("form.tags")}: ${x.tags.join(", ")}</div>` : nothing}
        ${lines.length ? html`<div><div class="small muted">${t("templates.children")}</div><pre style="margin:4px 0 0;white-space:pre-wrap;font:inherit">${lines.join("\n")}</pre></div>` : html`<div class="muted small">${t("templates.noChildren")}</div>`}
        <div class="small muted">${t("templates.noEdit")}</div>
      </div>
      ${canAdmin(this.ctx) ? html`<button slot="footer" class="btn danger" @click=${this._delete}>${t("common.delete")}</button><span slot="footer" class="grow"></span>` : nothing}
      <button slot="footer" class="btn" @click=${() => (this._show = null)}>${t("common.close")}</button>
    </ot-dialog>`;
  }

  private _editDialog() {
    const d = this._draft;
    if (!d) return nothing;
    const t = this.ctx.t;
    const set = (patch: Partial<Draft>) => (this._draft = { ...d, ...patch });
    const kinds = this._kinds;
    const persons = this.ctx.catalog?.persons ?? [];
    return html`<ot-dialog .heading=${t("templates.new")} .closeLabel=${t("common.close")} @close=${() => (this._draft = null)}>
      <div class="stack">
        <label class="field">${t("form.name")} *<input .value=${d.name} placeholder=${t("templates.namePlaceholder")} @input=${(e: Event) => set({ name: (e.target as HTMLInputElement).value })} /></label>
        <label class="field">${t("form.kind")}
          <select .value=${d.kind} @change=${(e: Event) => set({ kind: (e.target as HTMLSelectElement).value })}>${kinds.map((k) => html`<option value=${k.id} ?selected=${k.id === d.kind}>${k.name}</option>`)}</select></label>
        <label class="field">${t("form.tags")}<input .value=${d.tags} @input=${(e: Event) => set({ tags: (e.target as HTMLInputElement).value })} /></label>
        <label class="field">${t("form.owner")}
          <select .value=${d.owner} @change=${(e: Event) => set({ owner: (e.target as HTMLSelectElement).value })}>
            <option value="" ?selected=${d.owner === ""}>${t("form.ownerNone")}</option>
            ${persons.map((p) => html`<option value=${p.id} ?selected=${p.id === d.owner}>${p.name}</option>`)}</select></label>
        <label class="field">${t("templates.children")}
          <textarea rows="5" .value=${d.lines} placeholder=${t("templates.linesPlaceholder")} @input=${(e: Event) => set({ lines: (e.target as HTMLTextAreaElement).value })}></textarea>
          <span class="small muted">${t("templates.linesHelp")}</span></label>
        <label class="field">${t("templates.subKind")}
          <select .value=${d.subKind} @change=${(e: Event) => set({ subKind: (e.target as HTMLSelectElement).value })}>${kinds.map((k) => html`<option value=${k.id} ?selected=${k.id === d.subKind}>${k.name}</option>`)}</select></label>
        ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
      </div>
      <button slot="footer" class="btn text" @click=${() => (this._draft = null)}>${t("common.cancel")}</button>
      <button slot="footer" class="btn primary" ?disabled=${this._busy} @click=${this._save}>${t("common.save")}</button>
    </ot-dialog>`;
  }
}
customElements.define("ot-settings-templates", OtSettingsTemplates);
