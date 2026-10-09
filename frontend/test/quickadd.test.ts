import { describe, expect, it, vi } from "vitest";
import { OtQuickAdd, PREVIEW_DELAY_MS } from "../src/components/ot-quickadd";
import { makeT } from "../src/lib/i18n";

const tick = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("ot-quickadd", () => {
  it("asks the server for a preview and shows only the latest answer", async () => {
    const calls: string[] = [];
    const api = {
      quickPreview: vi.fn(async (text: string) => {
        calls.push(text);
        if (text === "a") await tick(150);
        return { count: 1, preview: [`>> ${text}`], errors: [] };
      }),
    };
    const el = document.createElement("ot-quickadd") as OtQuickAdd;
    el.ctx = { api, t: makeT("de"), hass: { language: "de" } } as never;
    el.parentId = "p1";
    document.body.appendChild(el);
    await el.updateComplete;
    const ta = el.shadowRoot?.querySelector("textarea");
    if (!ta) throw new Error("textarea missing");

    ta.value = "a";
    ta.dispatchEvent(new Event("input"));
    await tick(PREVIEW_DELAY_MS + 30); // request for "a" is now in flight
    ta.value = "3x Batterien";
    ta.dispatchEvent(new Event("input"));
    await tick(PREVIEW_DELAY_MS + 250);
    await el.updateComplete;

    expect(calls).toEqual(["a", "3x Batterien"]);
    const text = el.shadowRoot?.textContent ?? "";
    expect(text).toContain(">> 3x Batterien");
    expect(text).not.toContain(">> a");
    el.remove();
  });

  it("debounces fast typing into one request", async () => {
    const api = { quickPreview: vi.fn(async () => ({ count: 0, preview: [], errors: [] })) };
    const el = document.createElement("ot-quickadd") as OtQuickAdd;
    el.ctx = { api, t: makeT("de"), hass: { language: "de" } } as never;
    document.body.appendChild(el);
    await el.updateComplete;
    const ta = el.shadowRoot?.querySelector("textarea");
    if (!ta) throw new Error("textarea missing");
    for (const v of ["x", "xy", "xyz"]) {
      ta.value = v;
      ta.dispatchEvent(new Event("input"));
      await tick(30);
    }
    await tick(PREVIEW_DELAY_MS + 50);
    expect(api.quickPreview).toHaveBeenCalledTimes(1);
    el.remove();
  });
});
