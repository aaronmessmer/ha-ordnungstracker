import { describe, expect, it, vi } from "vitest";
import { Latest, debounce } from "../src/lib/latest";
import { Selection } from "../src/lib/selection";

describe("Selection", () => {
  it("starts on long press, toggles and ends when empty", () => {
    const s = new Selection();
    s.start("a");
    expect(s.active).toBe(true);
    s.toggle("b");
    expect(s.values().sort()).toEqual(["a", "b"]);
    s.toggle("a");
    s.toggle("b");
    expect(s.active).toBe(false);
    expect(s.size).toBe(0);
  });

  it("selects all, retains only existing and clears", () => {
    const s = new Selection();
    s.selectAll(["a", "b", "c"]);
    s.retain(["b", "z"]);
    expect(s.values()).toEqual(["b"]);
    s.retain([]);
    expect(s.active).toBe(false);
    s.selectAll([]);
    expect(s.active).toBe(false);
    s.start("q");
    s.clear();
    expect(s.has("q")).toBe(false);
  });
});

describe("Latest", () => {
  it("drops the answer of an older request", async () => {
    const latest = new Latest();
    let release!: (v: string) => void;
    const slow = latest.run(() => new Promise<string>((r) => (release = r)));
    const fast = await latest.run(async () => "new");
    release("old");
    expect(fast).toBe("new");
    expect(await slow).toBeUndefined();
  });

  it("cancel discards running requests", async () => {
    const latest = new Latest();
    const p = latest.run(async () => 1);
    latest.cancel();
    expect(await p).toBeUndefined();
  });
});

describe("debounce", () => {
  it("restarts the wait, can be cancelled and flushed", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d(1);
    vi.advanceTimersByTime(60);
    d(2);
    vi.advanceTimersByTime(60);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(40);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith(2);
    d(3);
    d.cancel();
    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledOnce();
    d.flush(4);
    expect(fn).toHaveBeenLastCalledWith(4);
    vi.useRealTimers();
  });
});
