import { describe, expect, it } from "vitest";
import { chunkContent } from "../lib/chunk";
import type { ContentItem } from "../types";

function item(path: string, size: number): ContentItem {
  return { path, content: "x".repeat(size) };
}

describe("chunkContent", () => {
  it("returns an empty array for no items", () => {
    expect(chunkContent([], 100)).toEqual([]);
  });

  it("groups multiple small items into a single chunk when they fit under the cap", () => {
    const items = [item("a.py", 10), item("b.py", 10), item("c.py", 10)];

    const chunks = chunkContent(items, 100);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.overCap).toBe(false);
    expect(chunks[0]?.items).toEqual(items);
  });

  it("splits items across multiple chunks once the cap is exceeded", () => {
    const items = [item("a.py", 40), item("b.py", 40), item("c.py", 40)];

    const chunks = chunkContent(items, 50);

    expect(chunks).toHaveLength(3);
    expect(chunks.every((chunk) => chunk.overCap === false)).toBe(true);
    expect(chunks.flatMap((chunk) => chunk.items)).toEqual(items);
  });

  it("gives a single item that already exceeds the cap its own over-cap chunk", () => {
    const items = [item("huge.py", 500)];

    const chunks = chunkContent(items, 100);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.overCap).toBe(true);
    expect(chunks[0]?.items).toEqual(items);
  });

  it("flushes the current batch before an over-cap item, then resumes batching after it", () => {
    const items = [item("small-1.py", 10), item("huge.py", 500), item("small-2.py", 10)];

    const chunks = chunkContent(items, 100);

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toEqual({ items: [items[0]], overCap: false });
    expect(chunks[1]).toEqual({ items: [items[1]], overCap: true });
    expect(chunks[2]).toEqual({ items: [items[2]], overCap: false });
  });

  it("uses the exported default cap when none is provided", () => {
    const items = [item("a.py", 10)];

    const chunks = chunkContent(items);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.overCap).toBe(false);
  });
});
