import { LitElement, css, html, nothing } from "lit";
import { ApiError } from "../lib/api";
import type { AppContext } from "../lib/context";
import { errorMessage } from "../lib/context";
import { download, iconFor } from "../lib/format";
import { baseStyles } from "../lib/styles";
import type { Kind, KindClass, Person } from "../types";
import "./ot-settings-fields";
import "./ot-settings-reminders";
import "./ot-settings-synonyms";

declare const __OT_VERSION__: string;
const CLASSES: KindClass[] = ["place", "furniture", "container", "group", "item"];
const SECTIONS = ["kinds", "persons", "fields", "synonyms", "reminders", "data"] as const;

interface KindDraft {
  id: string | null;
  name: string;
  class: KindClass;
  icon: string;
  numbered: boolean;
  replacement: string;
  needsReplacement: boolean;
}
interface PersonDraft {
  id: string | null;
  name: string;
  ha: string;
}

/** Verwaltung (Pflichtenheft 8.13, Teil 1): Arten, Personen, Export/Import, Beispieldaten. */
export class OtSettingsPage extends LitElement {
  static properties = {
    ctx: { attribute: false },
    section: { type: String },
    _kind: { state: true },
    _person: { state: true },
    _error: { state: true },
    _busy: { state: true },
    _importText: { state: true },
  };
  declare ctx: AppContext;
  declare section: string;
  declare _kind: KindDraft | null;
  declare _person: PersonDraft | null;
  declare _error: string;
  declare _busy: boolean;
  declare _importText: string | null;

  constructor() {
    super();
    this.section = "kinds";
    this._kind = null;
    this._person = null;
    this._error = "";
    this._busy = false;
    this._importText = null;
  }

  static styles = [
    baseStyles,
    css`
      .tabs {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin: 8px 0 16px;
      }
      .entry {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 56px;
        padding: 8px 12px;
        width: 100%;
        border: none;
        border-bottom: 1px solid var(--divider-color);
        background: transparent;
        text-align: left;
      }
      .entry:last-child {
        border-bottom: none;
      }
      .block {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    `,
  ];

  private get _section(): (typeof SECTIONS)[number] {
    return (SECTIONS as readonly string[]).includes(this.section) ? (this.section as (typeof SECTIONS)[number]) : "kinds";
  }

  // ---- Arten ------------------------------------------------------------------------
  private _editKind(k: Kind | null): void {
    this._error = "";
    this._kind = k
      ? { id: k.id, name: k.name, class: k.class, icon: k.icon, numbered: k.numbered, replacement: "", needsReplacement: false }
      : { id: null, name: "", class: "container", icon: "", numbered: false, replacement: "", needsReplacement: false };
  }

  private async _saveKind(): Promise<void> {
    const k = this._kind;
    if (!k) return;
    if (!k.name.trim()) {
      this._error = this.ctx.t("form.nameRequired");
      return;
    }
    this._busy = true;
    try {
      if (k.id) await this.ctx.api.kindUpdate(k.id, { name: k.name, class: k.class, icon: k.icon, numbered: k.numbered });
      else await this.ctx.api.kindAdd({ name: k.name, class: k.class, icon: k.icon, numbered: k.numbered });
      this._kind = null;
      await this.ctx.reloadCatalog();
      this.ctx.toast(this.ctx.t("form.saved"));
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private async _deleteKind(): Promise<void> {
    const k = this._kind;
    if (!k?.id) return;
    this._busy = true;
    try {
      await this.ctx.api.kindDelete(k.id, k.needsReplacement ? k.replacement : undefined);
      this._kind = null;
      await this.ctx.reloadCatalog();
      this.ctx.toast(this.ctx.t("settings.kindDeleted"));
    } catch (err) {
      if (err instanceof ApiError && err.code === "in_use" && !k.needsReplacement) {
        const first = this.ctx.catalog?.kinds.find((x) => x.id !== k.id);
        this._kind = { ...k, needsReplacement: true, replacement: first?.id ?? "" };
        this._error = err.message;
      } else this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private _kindDialog() {
    const t = this.ctx.t;
    const k = this._kind;
    if (!k) return nothing;
    const set = (patch: Partial<KindDraft>) => (this._kind = { ...k, ...patch });
    return html`
      <ot-dialog .heading=${k.id ? t("settings.kindEdit") : t("settings.kindNew")} .closeLabel=${t("common.close")} @close=${() => (this._kind = null)}>
        <div class="block">
          <label class="field">${t("form.name")} *<input .value=${k.name} @input=${(e: Event) => set({ name: (e.target as HTMLInputElement).value })} /></label>
          <label class="field">${t("settings.class")}
            <select .value=${k.class} @change=${(e: Event) => set({ class: (e.target as HTMLSelectElement).value as KindClass })}>
              ${CLASSES.map((c) => html`<option value=${c} ?selected=${k.class === c}>${t(`class.${c}` as never)} – ${t(`classHelp.${c}` as never)}</option>`)}
            </select></label>
          <label class="field">${t("settings.icon")}<input .value=${k.icon} placeholder="mdi:package-variant" @input=${(e: Event) => set({ icon: (e.target as HTMLInputElement).value })} /></label>
          <label class="check"><input type="checkbox" .checked=${k.numbered} @change=${(e: Event) => set({ numbered: (e.target as HTMLInputElement).checked })} />${t("settings.numbered")}</label>
          ${k.needsReplacement
            ? html`<label class="field">${t("settings.replacement")}
                <select .value=${k.replacement} @change=${(e: Event) => set({ replacement: (e.target as HTMLSelectElement).value })}>
                  ${(this.ctx.catalog?.kinds ?? []).filter((x) => x.id !== k.id).map((x) => html`<option value=${x.id} ?selected=${x.id === k.replacement}>${x.name}</option>`)}
                </select></label>`
            : nothing}
          ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
        </div>
        ${k.id ? html`<button slot="footer" class="btn danger" ?disabled=${this._busy} @click=${this._deleteKind}>${k.needsReplacement ? t("settings.replaceDelete") : t("common.delete")}</button>` : nothing}
        <button slot="footer" class="btn primary" ?disabled=${this._busy} @click=${this._saveKind}>${t("common.save")}</button>
      </ot-dialog>
    `;
  }

  // ---- Personen ---------------------------------------------------------------------
  private _editPerson(p: Person | null): void {
    this._error = "";
    this._person = { id: p?.id ?? null, name: p?.name ?? "", ha: p?.ha_person ?? "" };
  }

  private async _savePerson(): Promise<void> {
    const p = this._person;
    if (!p) return;
    if (!p.name.trim()) {
      this._error = this.ctx.t("form.nameRequired");
      return;
    }
    this._busy = true;
    try {
      if (p.id) await this.ctx.api.personUpdate(p.id, { name: p.name, ha_person: p.ha || null });
      else await this.ctx.api.personAdd(p.name, p.ha || null);
      this._person = null;
      await this.ctx.reloadCatalog();
      this.ctx.toast(this.ctx.t("form.saved"));
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private async _deletePerson(): Promise<void> {
    const p = this._person;
    if (!p?.id) return;
    const t = this.ctx.t;
    const ok = await this.ctx.confirm({ title: t("settings.personDeleteTitle", { name: p.name }), message: t("settings.personDeleteMessage"), confirmLabel: t("common.delete"), danger: true });
    if (!ok) return;
    try {
      const res = await this.ctx.api.personDelete(p.id);
      this._person = null;
      await this.ctx.reloadCatalog();
      this.ctx.toast(t("settings.personDeleted", { n: res.cleared }));
    } catch (err) {
      this._error = errorMessage(err);
    }
  }

  private _personDialog() {
    const t = this.ctx.t;
    const p = this._person;
    if (!p) return nothing;
    const set = (patch: Partial<PersonDraft>) => (this._person = { ...p, ...patch });
    const haPersons = Object.keys(this.ctx.hass.states).filter((s) => s.startsWith("person."));
    return html`
      <ot-dialog .heading=${p.id ? t("settings.personEdit") : t("settings.personNew")} .closeLabel=${t("common.close")} @close=${() => (this._person = null)}>
        <div class="block">
          <label class="field">${t("form.name")} *<input .value=${p.name} @input=${(e: Event) => set({ name: (e.target as HTMLInputElement).value })} /></label>
          <label class="field">${t("settings.haPerson")}
            <select .value=${p.ha} @change=${(e: Event) => set({ ha: (e.target as HTMLSelectElement).value })}>
              <option value="" ?selected=${p.ha === ""}>${t("settings.noHaPerson")}</option>
              ${haPersons.map((s) => html`<option value=${s} ?selected=${s === p.ha}>${this.ctx.hass.states[s].attributes.friendly_name ?? s}</option>`)}
            </select></label>
          ${this._error ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
        </div>
        ${p.id ? html`<button slot="footer" class="btn danger" @click=${this._deletePerson}>${t("common.delete")}</button>` : nothing}
        <button slot="footer" class="btn primary" ?disabled=${this._busy} @click=${this._savePerson}>${t("common.save")}</button>
      </ot-dialog>
    `;
  }

  // ---- Daten ------------------------------------------------------------------------
  private async _export(format: "json" | "markdown"): Promise<void> {
    try {
      const res = await this.ctx.api.exportData(format);
      download(res.filename, res.text, format === "json" ? "application/json" : "text/markdown");
      this.ctx.toast(this.ctx.t("data.exported", { name: res.filename }));
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  /** Rückfall für die Companion-App, wo Downloads eingeschränkt sein können (docs/ENTSCHEIDUNGEN.md A4). */
  private async _copy(): Promise<void> {
    try {
      const res = await this.ctx.api.exportData("json");
      await navigator.clipboard.writeText(res.text);
      this.ctx.toast(this.ctx.t("data.copied"));
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  private async _pickFile(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    this._importText = await file.text();
    this._error = "";
  }

  private async _import(): Promise<void> {
    if (this._importText === null) return;
    const t = this.ctx.t;
    const ok = await this.ctx.confirm({ title: t("data.importTitle"), message: t("data.importMessage"), confirmLabel: t("data.import"), danger: true });
    if (!ok) return;
    this._busy = true;
    try {
      const res = await this.ctx.api.importText(this._importText);
      this._importText = null;
      await this.ctx.reloadCatalog();
      this.ctx.toast(t("data.imported", { n: res.nodes }));
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private _data() {
    const t = this.ctx.t;
    const status = this.ctx.status;
    return html`
      <div class="stack">
        <div class="card block">
          <h2>${t("data.export")}</h2>
          <p class="muted small" style="margin:0">${t("data.exportHelp")}</p>
          <div class="row wrap">
            <button class="btn" @click=${() => this._export("json")}><ha-icon icon="mdi:download"></ha-icon>inventar.json</button>
            <button class="btn" @click=${() => this._export("markdown")}><ha-icon icon="mdi:language-markdown-outline"></ha-icon>${t("data.markdown")}</button>
            <button class="btn text" @click=${this._copy}><ha-icon icon="mdi:content-copy"></ha-icon>${t("data.copy")}</button>
          </div>
        </div>
        <div class="card block">
          <h2>${t("data.import")}</h2>
          <p class="muted small" style="margin:0">${t("data.importHelp")}</p>
          <input type="file" accept="application/json,.json" aria-label=${t("data.import")} @change=${this._pickFile} />
          ${this._importText !== null
            ? html`<div class="row wrap"><span class="grow small">${t("data.ready", { kb: Math.max(1, Math.round(this._importText.length / 1024)) })}</span>
                <button class="btn danger" ?disabled=${this._busy} @click=${this._import}>${t("data.import")}</button></div>`
            : nothing}
          ${this._error && !this._kind && !this._person ? html`<div class="error-text" role="alert">${this._error}</div>` : nothing}
        </div>
        <div class="card block">
          <h2>${t("sample.title")}</h2>
          ${this.ctx.catalog?.sample_loaded
            ? html`<p class="muted small" style="margin:0">${t("sample.active")}</p><div><button class="btn danger" @click=${this._removeSample}>${t("sample.remove")}</button></div>`
            : html`<p class="muted small" style="margin:0">${status?.inventory_empty ? t("sample.help") : t("sample.onlyEmpty")}</p>
                <div><button class="btn" ?disabled=${!status?.inventory_empty} @click=${this._loadSample}>${t("sample.load")}</button></div>`}
        </div>
        <div class="muted small" style="margin:8px 4px">${t("settings.about", { version: __OT_VERSION__, nodes: status?.nodes ?? 0 })}</div>
      </div>
    `;
  }

  private async _loadSample(): Promise<void> {
    try {
      await this.ctx.api.sampleLoad();
      await this.ctx.reloadCatalog();
      this.ctx.toast(this.ctx.t("sample.loaded"));
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  private async _removeSample(): Promise<void> {
    const t = this.ctx.t;
    const ok = await this.ctx.confirm({ title: t("sample.removeTitle"), message: t("sample.removeMessage"), confirmLabel: t("sample.remove"), danger: true });
    if (!ok) return;
    try {
      await this.ctx.api.sampleRemove();
      await this.ctx.reloadCatalog();
      this.ctx.toast(t("sample.removed"));
    } catch (err) {
      this.ctx.toast(errorMessage(err), "error");
    }
  }

  render() {
    const t = this.ctx.t;
    const s = this._section;
    const cat = this.ctx.catalog;
    return html`
      <h1 style="font-size:1.5rem;font-weight:500;margin:4px 0">${t("nav.settings")}</h1>
      <div class="tabs" role="tablist">
        ${SECTIONS.map((x) => html`<button class="chip" role="tab" aria-selected=${s === x ? "true" : "false"} aria-pressed=${s === x ? "true" : "false"} @click=${() => this.ctx.go({ page: "settings", section: x }, { replace: true })}>${t(`settings.tab.${x}` as never)}</button>`)}
      </div>
      ${s === "kinds"
        ? html`<p class="muted small" style="margin:0 4px 10px">${t("settings.kindsHelp")}</p>
            <div class="list">
              ${(cat?.kinds ?? []).map((k) => html`<button class="entry" @click=${() => this._editKind(k)}>
                <ha-icon class="muted" icon=${iconFor(k)}></ha-icon>
                <span class="grow"><span>${k.name}</span><span class="small muted" style="display:block">${t(`class.${k.class}` as never)}${k.numbered ? ` · ${t("settings.numberedShort")}` : ""}</span></span>
                <ha-icon class="muted" icon="mdi:pencil"></ha-icon></button>`)}
            </div>
            <div style="margin-top:12px"><button class="btn primary" @click=${() => this._editKind(null)}><ha-icon icon="mdi:plus"></ha-icon>${t("settings.kindNew")}</button></div>`
        : nothing}
      ${s === "persons"
        ? html`<p class="muted small" style="margin:0 4px 10px">${t("settings.personsHelp")}</p>
            ${(cat?.persons ?? []).length
              ? html`<div class="list">${cat!.persons.map((p) => html`<button class="entry" @click=${() => this._editPerson(p)}>
                  <ha-icon class="muted" icon="mdi:account"></ha-icon>
                  <span class="grow"><span>${p.name}</span>${p.ha_person ? html`<span class="small muted" style="display:block">${this.ctx.hass.states[p.ha_person]?.attributes.friendly_name ?? p.ha_person}</span>` : nothing}</span>
                  <ha-icon class="muted" icon="mdi:pencil"></ha-icon></button>`)}</div>`
              : html`<div class="empty small">${t("settings.noPersons")}</div>`}
            <div style="margin-top:12px"><button class="btn primary" @click=${() => this._editPerson(null)}><ha-icon icon="mdi:plus"></ha-icon>${t("settings.personNew")}</button></div>`
        : nothing}
      ${s === "fields" ? html`<ot-settings-fields .ctx=${this.ctx}></ot-settings-fields>` : nothing}
      ${s === "synonyms" ? html`<ot-settings-synonyms .ctx=${this.ctx}></ot-settings-synonyms>` : nothing}
      ${s === "reminders" ? html`<ot-settings-reminders .ctx=${this.ctx}></ot-settings-reminders>` : nothing}
      ${s === "data" ? this._data() : nothing}
      ${this._kindDialog()} ${this._personDialog()}
    `;
  }
}
customElements.define("ot-settings-page", OtSettingsPage);
