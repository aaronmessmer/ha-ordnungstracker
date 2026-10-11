import { describe, expect, it } from "vitest";
import { asNumberQuery, formatDate, parseList, parseNumber, pathText, quantityText } from "../src/lib/format";
import { makeT, pickLanguage } from "../src/lib/i18n";

describe("format", () => {
  it("recognizes number queries", () => {
    expect(asNumberQuery("14")).toBe(14);
    expect(asNumberQuery(" # 14 ")).toBe(14);
    expect(asNumberQuery("14a")).toBeNull();
    expect(asNumberQuery("")).toBeNull();
  });

  it("parses numbers with comma or point", () => {
    expect(parseNumber("1,5")).toBe(1.5);
    expect(parseNumber(" 2 ")).toBe(2);
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeUndefined();
  });

  it("splits lists", () => {
    expect(parseList("a, b\n c,,")).toEqual(["a", "b", "c"]);
  });

  it("formats dates and keeps garbage", () => {
    expect(formatDate("", "de")).toBe("");
    expect(formatDate("nonsense", "de")).toBe("nonsense");
    expect(formatDate("2026-03-05", "de")).toContain("2026");
  });

  it("builds paths and quantities", () => {
    const parts = [{ id: "1", name: "Keller" }, { id: "2", name: "Regal" }] as never;
    expect(pathText(parts)).toBe("Keller › Regal");
    expect(pathText(parts, false)).toBe("Keller");
    expect(quantityText({ quantity: 3, unit: "Stk" } as never)).toContain("3");
  });
});

describe("i18n", () => {
  it("picks German for de variants, English otherwise", () => {
    expect(pickLanguage("de-AT")).toBe("de");
    expect(pickLanguage(undefined)).toBe("de");
    expect(pickLanguage("fr")).toBe("en");
  });

  it("replaces parameters", () => {
    expect(makeT("de")("quick.preview", { n: 3 })).toContain("3");
  });
});
