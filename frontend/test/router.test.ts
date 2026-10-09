import { describe, expect, it, vi } from "vitest";
import { BASE, Navigator, parseRoute, routeToPath, sameRoute, type Route } from "../src/lib/router";

describe("router", () => {
  const routes: Route[] = [
    { page: "overview" },
    { page: "node", id: null },
    { page: "node", id: "abc 1" },
    { page: "number", number: 14 },
    { page: "trash" },
    { page: "due" },
    { page: "settings", section: "kinds" },
    {
      page: "search",
      query: "heißkleber & mehr",
      filters: { kinds: ["kiste", "regal"], classes: ["item"], checked_out: false, has_number: true, empty: true },
    },
  ];

  it.each(routes)("round-trips %j", (route) => {
    expect(parseRoute(routeToPath(route))).toEqual(route);
  });

  it("falls back to the overview for unknown or broken addresses", () => {
    expect(parseRoute(`${BASE}/gibtsnicht`)).toEqual({ page: "overview" });
    expect(parseRoute(`${BASE}/nr/abc`)).toEqual({ page: "overview" });
    expect(parseRoute(`${BASE}/nr/0`)).toEqual({ page: "overview" });
    expect(parseRoute("/")).toEqual({ page: "overview" });
  });

  it("ignores unknown classes in the address", () => {
    const r = parseRoute(`${BASE}/search?class=item,bogus`);
    expect(r).toMatchObject({ page: "search", filters: { classes: ["item"] } });
  });

  it("compares routes by address", () => {
    expect(sameRoute({ page: "trash" }, { page: "trash" })).toBe(true);
    expect(sameRoute({ page: "trash" }, { page: "due" })).toBe(false);
  });
});

describe("Navigator", () => {
  it("pushes entries, ignores the same address and follows the back button", () => {
    window.history.replaceState(null, "", BASE);
    const nav = new Navigator(window);
    const seen: Route[] = [];
    nav.subscribe((r) => seen.push(r));
    nav.start();
    nav.navigate({ page: "trash" });
    nav.navigate({ page: "trash" });
    nav.navigate({ page: "node", id: "x" });
    expect(seen.map((r) => r.page)).toEqual(["trash", "node"]);
    expect(nav.current()).toEqual({ page: "node", id: "x" });

    nav.navigate({ page: "due" }, { replace: true });
    expect(nav.current()).toEqual({ page: "due" });

    const popped = vi.fn();
    nav.subscribe(popped);
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(popped).toHaveBeenCalledWith({ page: "due" });
    nav.stop();
  });
});
