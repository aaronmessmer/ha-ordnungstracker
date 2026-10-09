import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { de } from "../src/locales/de";
import { en } from "../src/locales/en";

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sources(join(dir, e.name)) : e.name.endsWith(".ts") && !dir.endsWith("locales") ? [join(dir, e.name)] : [],
  );
}

describe("locales", () => {
  it("has the same keys in German and English", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
  });

  it("has no empty texts", () => {
    for (const [k, v] of Object.entries({ ...de })) expect(v, k).not.toBe("");
    for (const [k, v] of Object.entries({ ...en })) expect(v, k).not.toBe("");
  });

  it("uses the same placeholders in both languages", () => {
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const k of Object.keys(de) as (keyof typeof de)[]) expect(ph(en[k]), k).toEqual(ph(de[k]));
  });

  it("defines every literal key used in the sources", () => {
    const keys = new Set(Object.keys(de));
    const missing: string[] = [];
    for (const file of sources(join(__dirname, "../src"))) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/\bt\(\s*"([\w.]+)"/g)) if (!keys.has(m[1])) missing.push(`${file}: ${m[1]}`);
    }
    expect(missing).toEqual([]);
  });

  it("defines the dynamic key families", () => {
    for (const cls of ["place", "furniture", "container", "group", "item"]) {
      expect(de, cls).toHaveProperty(`class.${cls}`);
      expect(de, cls).toHaveProperty(`classHelp.${cls}`);
    }
  });
});
