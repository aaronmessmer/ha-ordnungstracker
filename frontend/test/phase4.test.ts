import { describe, expect, it, vi } from "vitest";
import "../src/components/ot-checkout";
import "../src/components/ot-due-page";
import "../src/components/ot-field-input";
import "../src/components/ot-stepper";
import type { OtCheckout } from "../src/components/ot-checkout";
import type { OtDuePage } from "../src/components/ot-due-page";
import type { OtFieldInput } from "../src/components/ot-field-input";
import type { OtStepper } from "../src/components/ot-stepper";
import { daysBetween, today } from "../src/lib/format";
import { parseRoute, routeToPath } from "../src/lib/router";
import { rowFromBrief } from "../src/lib/rows";
import type { Brief, DueItem } from "../src/types";
import { fakeCtx, tick } from "./helpers";

const brief = (over: Partial<Brief> = {}): Brief => ({
  id: "a", name: "Batterien", kind: "ding", kind_name: "Ding", class: "item", icon: "", number: null,
  quantity: 2, unit: "Stück", min_quantity: 8, condition: "ok", checked_out: false, archived: false,
  hints: [], children: 0, descendants: 0, ...over,
});

async function mount<T extends HTMLElement>(el: T): Promise<T> {
  document.body.appendChild(el);
  await (el as unknown as { updateComplete: Promise<boolean> }).updateComplete;
  return el;
}

describe("routes and rows", () => {
  it("round-trips the new views", () => {
    for (const page of ["out", "restock"] as const) expect(parseRoute(routeToPath({ page }))).toEqual({ page });
  });

  it("gives items with an amount a stepper instead of a text amount", () => {
    const row = rowFromBrief(brief());
    expect(row.stepper).toEqual({ quantity: 2, unit: "Stück" });
    expect(row.subtitle).not.toContain("Stück");
    expect(rowFromBrief(brief({ class: "container" })).stepper).toBeUndefined();
    expect(rowFromBrief(brief({ quantity: null })).stepper).toBeUndefined();
  });

  it("computes day differences and today", () => {
    expect(daysBetween("2026-10-10", "2026-10-15")).toBe(5);
    expect(daysBetween("2026-10-10", "2026-10-01")).toBe(-9);
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("ot-stepper", () => {
  it("changes the amount through the server and shows the answer", async () => {
    const api = { quantityStep: vi.fn(async (_id: string, delta: number) => ({ quantity: 2 + delta })) };
    const { ctx } = fakeCtx(api);
    const el = document.createElement("ot-stepper") as OtStepper;
    el.ctx = ctx; el.nodeId = "a"; el.itemName = "Batterien"; el.quantity = 2; el.unit = "Stück";
    await mount(el);
    const [less, more] = [...(el.shadowRoot?.querySelectorAll("button") ?? [])];
    more.click();
    await tick(10);
    await el.updateComplete;
    expect(api.quantityStep).toHaveBeenCalledWith("a", 1);
    expect(el.shadowRoot?.textContent).toContain("3 Stück");
    less.click();
    await tick(10);
    expect(api.quantityStep).toHaveBeenLastCalledWith("a", -1);
    el.remove();
  });

  it("does not offer minus at zero and shows server errors", async () => {
    const api = { quantityStep: vi.fn(async () => { throw new Error("Zu wenig"); }) };
    const { ctx, toasts } = fakeCtx(api);
    const el = document.createElement("ot-stepper") as OtStepper;
    el.ctx = ctx; el.nodeId = "a"; el.quantity = 0;
    await mount(el);
    const [less, more] = [...(el.shadowRoot?.querySelectorAll("button") ?? [])];
    expect(less.disabled).toBe(true);
    more.click();
    await tick(10);
    expect(toasts).toEqual(["Zu wenig"]);
    el.remove();
  });
});

describe("ot-checkout", () => {
  // The dialog template is not rendered here: happy-dom cannot parse it (browser check in docs/PRUEFLISTEN.md).
  type Internals = { _to: string; _error: string; _save(): Promise<void> };
  const make = (api: Record<string, unknown>, kind: "lent" | "out") => {
    const { ctx } = fakeCtx(api);
    const el = document.createElement("ot-checkout") as OtCheckout;
    el.ctx = ctx;
    el.nodeId = "a";
    el.itemName = "Leiter";
    el.kind = kind;
    return { el, inner: el as unknown as Internals };
  };

  it("asks for the recipient before it calls the server", async () => {
    const api = { checkout: vi.fn(async () => brief()) };
    const { el, inner } = make(api, "lent");
    await inner._save();
    expect(api.checkout).not.toHaveBeenCalled();
    expect(inner._error).toContain("an wen es ausgeliehen ist");

    inner._to = "  Nachbar Huber ";
    const saved = vi.fn();
    el.addEventListener("saved", saved);
    await inner._save();
    expect(api.checkout).toHaveBeenCalledWith("a", { checkout_type: "lent", to: "Nachbar Huber", since: today() });
    expect(saved).toHaveBeenCalled();
  });

  it("sends the optional details and shows server errors", async () => {
    const api = { checkout: vi.fn(async () => { throw new Error("Schon entnommen"); }) };
    const { el, inner } = make(api, "out");
    const priv = el as unknown as { _until: string; _note: string; _noReminder: boolean };
    inner._to = "Garage";
    priv._until = "2027-01-01";
    priv._note = " bis Frühling ";
    priv._noReminder = true; // only meaningful for loans
    await inner._save();
    expect(api.checkout).toHaveBeenCalledWith("a", { checkout_type: "out", to: "Garage", since: today(), until: "2027-01-01", note: "bis Frühling" });
    expect(inner._error).toBe("Schon entnommen");
  });
});

describe("ot-field-input", () => {
  async function emitted(type: string, setup: (root: ShadowRoot) => void, field: Record<string, unknown> = {}) {
    const { ctx } = fakeCtx({});
    const el = document.createElement("ot-field-input") as OtFieldInput;
    el.ctx = ctx;
    el.field = { id: "f", name: "Feld", type, ...field } as never;
    el.value = null;
    const seen: unknown[] = [];
    el.addEventListener("value-changed", (e) => seen.push((e as CustomEvent).detail.value));
    await mount(el);
    setup(el.shadowRoot as ShadowRoot);
    el.remove();
    return seen;
  }
  const typeInto = (root: ShadowRoot, value: string, sel = "input") => {
    const input = root.querySelector<HTMLInputElement>(sel);
    if (!input) throw new Error(`${sel} missing`);
    input.value = value;
    input.dispatchEvent(new Event("input"));
  };

  it("turns numbers with a comma into numbers and keeps invalid text for the server to explain", async () => {
    expect(await emitted("number", (r) => typeInto(r, "1,5"))).toEqual([1.5]);
    expect(await emitted("number", (r) => typeInto(r, "abc"))).toEqual(["abc"]);
    expect(await emitted("number", (r) => typeInto(r, ""))).toEqual([null]);
  });

  it("maps empty text to null and bool to true/false", async () => {
    expect(await emitted("text", (r) => typeInto(r, ""))).toEqual([null]);
    expect(await emitted("date", (r) => typeInto(r, "2027-01-02"))).toEqual(["2027-01-02"]);
    const bool = await emitted("bool", (r) => {
      const s = r.querySelector("select") as HTMLSelectElement;
      s.value = "no";
      s.dispatchEvent(new Event("change"));
    });
    expect(bool).toEqual([false]);
  });
});

describe("ot-due-page", () => {
  const item = (over: Partial<DueItem>): DueItem => ({
    category: "x", node_id: "n1", name: "Ding", path: "Keller", detail: "", due: null, days: null, overdue: false, key: "k", ...over,
  });
  const data = {
    categories: {
      expiring: [item({ node_id: "e", name: "Nudeln", due: "2026-10-22" })],
      checkout_overdue: [item({ node_id: "c", name: "Leiter", overdue: true })],
      below_min: [item({ node_id: "b", name: "Batterien", quantity: 2, min_quantity: 8, unit: "Stück" })],
      maintenance_due: [item({ node_id: "m", name: "Heizung", detail: "Entlüften", key: "maintenance_due|m|task-7|2026-10-01" })],
      missing: [],
    },
    counts: {},
  };

  it("shows the five rubrics and acts with one tap", async () => {
    const api = {
      due: vi.fn(async () => data),
      returnNode: vi.fn(async () => brief()),
      maintenanceDone: vi.fn(async () => ({})),
    };
    const { ctx, toasts } = fakeCtx(api);
    const el = document.createElement("ot-due-page") as OtDuePage;
    el.ctx = ctx;
    await mount(el);
    await tick(10);
    await el.updateComplete;
    const text = el.shadowRoot?.textContent ?? "";
    for (const name of ["Nudeln", "Leiter", "Batterien", "Heizung"]) expect(text).toContain(name);
    expect(el.shadowRoot?.querySelectorAll("ot-stepper").length).toBe(1);

    const buttons = [...(el.shadowRoot?.querySelectorAll<HTMLButtonElement>("button.btn") ?? [])];
    buttons.find((b) => b.textContent?.includes("Zurücklegen"))?.click();
    buttons.find((b) => b.textContent?.includes("Erledigt"))?.click();
    await tick(10);
    expect(api.returnNode).toHaveBeenCalledWith("c");
    expect(api.maintenanceDone).toHaveBeenCalledWith("m", "task-7");
    expect(toasts.length).toBe(2);
    el.remove();
  });

  it("shows only restock items in the restock view and explains a missing to-do list", async () => {
    const { ctx } = fakeCtx({ due: async () => data });
    const el = document.createElement("ot-due-page") as OtDuePage;
    el.ctx = ctx;
    el.only = "below_min";
    await mount(el);
    await tick(10);
    await el.updateComplete;
    const text = el.shadowRoot?.textContent ?? "";
    expect(text).toContain("Batterien");
    expect(text).not.toContain("Nudeln");
    expect(text).toContain("keine To-do-Liste gewählt");
    el.remove();
  });

  it("transfers to the to-do list when one is chosen", async () => {
    const api = { due: async () => data, todoTransfer: vi.fn(async () => ({ entity_id: "todo.e", added: 1, skipped: 0 })) };
    const { ctx, toasts } = fakeCtx(api, { status: { todo_entity: "todo.e", todo_auto: false } });
    const el = document.createElement("ot-due-page") as OtDuePage;
    el.ctx = ctx;
    el.only = "below_min";
    await mount(el);
    await tick(10);
    await el.updateComplete;
    const btn = [...(el.shadowRoot?.querySelectorAll<HTMLButtonElement>("button.btn") ?? [])].find((b) => b.textContent?.includes("To-do"));
    btn?.click();
    await tick(10);
    expect(api.todoTransfer).toHaveBeenCalled();
    expect(toasts[0]).toContain("1 auf die To-do-Liste");
    el.remove();
  });
});
