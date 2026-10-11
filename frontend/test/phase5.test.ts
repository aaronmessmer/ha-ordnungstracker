import { describe, expect, it, vi } from "vitest";
import "../src/components/ot-journal";
import "../src/components/ot-lists-page";
import "../src/components/ot-stocktake-page";
import { describeDetails } from "../src/components/ot-journal";
import type { OtListsPage } from "../src/components/ot-lists-page";
import type { OtStocktakePage } from "../src/components/ot-stocktake-page";
import { canAdmin, openPrint } from "../src/lib/print";
import { parseRoute, routeToPath, type Route } from "../src/lib/router";
import { countTemplateNodes, parseTemplateLines, templateLines } from "../src/lib/templates";
import { fakeCtx, tick } from "./helpers";

async function mount<T extends HTMLElement>(el: T): Promise<T> {
  document.body.appendChild(el);
  await (el as unknown as { updateComplete: Promise<boolean> }).updateComplete;
  return el;
}

describe("routes", () => {
  it("round-trips lists, stocktake and journal", () => {
    const routes: Route[] = [
      { page: "lists" },
      { page: "list", id: "abc" },
      { page: "stocktake", id: "k 1" },
      { page: "journal", node: null },
      { page: "journal", node: "n1" },
    ];
    for (const r of routes) expect(parseRoute(routeToPath(r))).toEqual(r);
    expect(parseRoute("/ordnungstracker/list")).toEqual({ page: "lists" });
    expect(parseRoute("/ordnungstracker/stocktake")).toEqual({ page: "overview" });
  });
});

describe("templates", () => {
  it("builds the tree from indented lines with amounts", () => {
    const nodes = parseTemplateLines("Bohrer\n  Metallbohrer\n  3x Holzbohrer\n\n2,5 x Schrauben\n\tTorx", "gruppe", "ding");
    expect(nodes).toEqual([
      { name: "Bohrer", kind: "gruppe", children: [{ name: "Metallbohrer", kind: "ding" }, { name: "Holzbohrer", kind: "ding", quantity: 3 }] },
      { name: "Schrauben", kind: "gruppe", quantity: 2.5, children: [{ name: "Torx", kind: "ding" }] },
    ]);
    expect(countTemplateNodes(nodes)).toBe(5);
  });

  it("never nests more than one level below the previous line", () => {
    const nodes = parseTemplateLines("A\n        zu tief", "g", "d");
    expect(nodes[0].children?.[0]).toMatchObject({ name: "zu tief", kind: "d" });
  });

  it("round-trips for display and copes with empty text", () => {
    expect(parseTemplateLines("  \n", "g", "d")).toEqual([]);
    const lines = templateLines(parseTemplateLines("Bohrer\n  3x Metallbohrer", "g", "d"));
    expect(lines).toEqual(["Bohrer", "  3x Metallbohrer"]);
  });
});

describe("journal texts", () => {
  it("shows moves with both paths and updates with old and new values", () => {
    expect(describeDetails({ time: "", user: "", action: "move", details: { from: ["Keller", "Kiste"], to: ["Garage"] } })).toBe("Keller › Kiste → Garage");
    expect(describeDetails({ time: "", user: "", action: "update", details: { changes: { name: "Neu", tags: ["a", "b"] }, old: { name: "Alt", tags: [] } } })).toBe("name: Alt → Neu; tags: – → a, b");
    expect(describeDetails({ time: "", user: "", action: "create" })).toBe("");
  });
});

describe("print and permissions", () => {
  it("opens the signed address in a new window and falls back to the same window", async () => {
    const api = { printUrl: vi.fn(async () => ({ url: "/api/ordnungstracker/print/sheet?authSig=x", expires_in: 300 })) };
    const { ctx } = fakeCtx(api);
    const open = vi.spyOn(window, "open").mockReturnValue({} as Window);
    await openPrint(ctx, "sheet", { node: "n1" });
    expect(api.printUrl).toHaveBeenCalledWith("sheet", { node: "n1" });
    expect(open).toHaveBeenCalledWith("/api/ordnungstracker/print/sheet?authSig=x", "_blank", "noopener");
    open.mockReturnValue(null); // pop-up blocked (e.g. companion app)
    const href = vi.fn();
    Object.defineProperty(window, "location", { value: { set href(v: string) { href(v); } }, configurable: true });
    await openPrint(ctx, "tree");
    expect(href).toHaveBeenCalledWith("/api/ordnungstracker/print/sheet?authSig=x");
    open.mockRestore();
  });

  it("reports server errors instead of throwing", async () => {
    const { ctx, toasts } = fakeCtx({ printUrl: async () => { throw new Error("Nicht angemeldet"); } });
    await openPrint(ctx, "tree");
    expect(toasts).toEqual(["Nicht angemeldet"]);
  });

  it("treats a missing status as allowed and honours can_admin", () => {
    expect(canAdmin(fakeCtx({}, { status: null }).ctx)).toBe(true);
    expect(canAdmin(fakeCtx({}, { status: { can_admin: true } }).ctx)).toBe(true);
    expect(canAdmin(fakeCtx({}, { status: { can_admin: false } }).ctx)).toBe(false);
  });
});

describe("ot-lists-page", () => {
  const view = (checked = false) => ({
    id: "l1",
    name: "Camping",
    groups: [{ place_id: "p", place_name: "Garage", entries: [{ id: "e1", node: "n1", name: "Leiter", path: ["Garage"], checked }] }],
  });

  it("ticks an entry at once and restores the old state when the server says no", async () => {
    const api = {
      list: vi.fn(async () => view()),
      listEntryUpdate: vi.fn().mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("Weg")),
    };
    const { ctx, toasts } = fakeCtx(api);
    const el = document.createElement("ot-lists-page") as OtListsPage;
    el.ctx = ctx;
    el.listId = "l1";
    await mount(el);
    await tick(10);
    await el.updateComplete;
    const box = el.shadowRoot?.querySelector<HTMLButtonElement>(".box");
    expect(box?.getAttribute("aria-checked")).toBe("false");
    box?.click();
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector(".box")?.getAttribute("aria-checked")).toBe("true");
    expect(api.listEntryUpdate).toHaveBeenCalledWith("l1", "e1", { checked: true });
    await tick(10);
    el.shadowRoot?.querySelector<HTMLButtonElement>(".box")?.click();
    await tick(20);
    await el.updateComplete;
    expect(toasts).toEqual(["Weg"]);
    expect(el.shadowRoot?.querySelector(".box")?.getAttribute("aria-checked")).toBe("true"); // back to the confirmed state
    expect(el.shadowRoot?.textContent).toContain("1 von 1 abgehakt");
    el.remove();
  });

  it("shows the lists with their counts when no list is open", async () => {
    const { ctx } = fakeCtx({}, { catalog: { lists: [{ id: "l1", name: "Camping", entries: 3 }, { id: "l2", name: "Ski", entries: 1 }], persons: [], kinds: [], fields: [], templates: [], synonyms: [], settings: {} } });
    const el = document.createElement("ot-lists-page") as OtListsPage;
    el.ctx = ctx;
    el.listId = "";
    await mount(el);
    const text = el.shadowRoot?.textContent ?? "";
    expect(text).toContain("Camping");
    expect(text).toContain("3 Einträge");
    el.remove();
  });
});

describe("ot-stocktake-page", () => {
  const node = {
    id: "k1", name: "Kiste", class: "container", path: [{ id: "k1", name: "Kiste" }], parent: null, number: 1,
    contents: [
      { id: "a", name: "Schere", kind_name: "Ding", class: "item", icon: "", number: null, quantity: null, unit: "", hints: [], children: 0, descendants: 0 },
      { id: "b", name: "Kleber", kind_name: "Ding", class: "item", icon: "", number: null, quantity: null, unit: "", hints: [], children: 0, descendants: 0 },
      { id: "c", name: "Tacker", kind_name: "Ding", class: "item", icon: "", number: null, quantity: null, unit: "", hints: [], children: 0, descendants: 0 },
    ],
  };
  type Inner = { _verdicts: Record<string, string>; _mark(id: string, v: string): void; _allPresent(): void; _finish(): Promise<void> };

  async function setup(saved: unknown = null) {
    const api = {
      node: vi.fn(async () => node),
      stocktakeGet: vi.fn(async () => saved),
      stocktakeSet: vi.fn(async () => ({})),
      stocktakeApply: vi.fn(async () => ({ verified: 2, missing: 1 })),
    };
    const fake = fakeCtx(api);
    const el = document.createElement("ot-stocktake-page") as OtStocktakePage;
    el.ctx = fake.ctx;
    el.nodeId = "k1";
    await mount(el);
    await tick(20);
    await el.updateComplete;
    return { api, el, inner: el as unknown as Inner, ...fake };
  }

  it("restores the saved progress and remembers changes on the server", async () => {
    const { api, el, inner } = await setup({ present: ["a"], missing: ["b"] });
    expect(inner._verdicts).toEqual({ a: "present", b: "missing" });
    expect(el.shadowRoot?.textContent).toContain("2 von 3 geprüft");
    inner._mark("c", "present");
    inner._mark("c", "present"); // a second tap takes it back
    expect(inner._verdicts.c).toBeUndefined();
    inner._mark("c", "missing");
    await tick(450);
    expect(api.stocktakeSet).toHaveBeenLastCalledWith("k1", { present: ["a"], missing: ["b", "c"] });
    el.remove();
  });

  it("applies the verdicts and clears the saved progress at the end", async () => {
    const { api, el, inner, raw } = await setup();
    inner._allPresent();
    inner._mark("b", "missing");
    await inner._finish();
    expect(api.stocktakeApply).toHaveBeenCalledWith({ a: "present", b: "missing", c: "present" });
    expect(api.stocktakeSet).toHaveBeenLastCalledWith("k1", null);
    expect(raw.went).toEqual({ page: "node", id: "k1" });
    el.remove();
  });

  it("drops entries that left the container from the progress", async () => {
    const { el, inner } = await setup({ present: ["a", "gone"] });
    expect(inner._verdicts).toEqual({ a: "present" });
    el.remove();
  });
});
