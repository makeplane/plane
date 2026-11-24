/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import {
  WORK_ITEM_PROPERTY_HIDE_ORDER,
  getWorkItemPropertyHidePriority,
  partitionWorkItemProperties,
} from "./partition";
import type { PropertyPartitionItem } from "./partition";

const GAP = 8;
const TRIGGER = 30;
const triggerWidth = () => TRIGGER;

const item = (key: string, hidePriority: number, ...tierWidths: number[]): PropertyPartitionItem => ({
  key,
  hidePriority,
  tierWidths,
});

const partition = (items: PropertyPartitionItem[], budget: number | null) =>
  partitionWorkItemProperties({ items, budget, gap: GAP, triggerWidth });

describe("getWorkItemPropertyHidePriority", () => {
  it("ranks keys by their position in the hide order", () => {
    expect(getWorkItemPropertyHidePriority("state")).toBe(0);
    expect(getWorkItemPropertyHidePriority("labels")).toBeLessThan(getWorkItemPropertyHidePriority("due_date"));
    expect(getWorkItemPropertyHidePriority("link")).toBe(WORK_ITEM_PROPERTY_HIDE_ORDER.length - 1);
  });

  it("collapses unknown keys after every known one", () => {
    expect(getWorkItemPropertyHidePriority("something_else")).toBe(WORK_ITEM_PROPERTY_HIDE_ORDER.length);
  });
});

describe("partitionWorkItemProperties", () => {
  it("shows everything at the richest rendering when there is no budget", () => {
    const result = partition([item("state", 0, 80), item("labels", 3, 200, 120, 60)], null);
    expect(result.visibleKeys).toEqual(["state", "labels"]);
    expect(result.hiddenKeys).toEqual([]);
    expect(result.tierByKey.get("labels")).toBe(0);
  });

  it("shows everything without a trigger when the row fits exactly", () => {
    const result = partition([item("state", 0, 100), item("priority", 1, 100)], 208);
    expect(result.visibleKeys).toEqual(["state", "priority"]);
    expect(result.hiddenKeys).toEqual([]);
  });

  it("keeps room for the +N trigger while anything is collapsed", () => {
    // state (100) + gap + priority (100) = 208 fits 230 on its own, but the trigger for the
    // collapsed due date needs another gap + 30.
    const result = partition([item("state", 0, 100), item("priority", 1, 100), item("due_date", 5, 100)], 230);
    expect(result.visibleKeys).toEqual(["state"]);
    expect(result.hiddenKeys).toEqual(["priority", "due_date"]);
  });

  it("collapses the highest hide priority first and keeps row order in both lists", () => {
    const items = [item("link", 12, 50), item("state", 0, 50), item("estimate", 9, 50), item("priority", 1, 50)];
    // Room for two chips plus the trigger: 50 + 8 + 50 + 8 + 30 = 146.
    const result = partition(items, 146);
    expect(result.visibleKeys).toEqual(["state", "priority"]);
    expect(result.hiddenKeys).toEqual(["link", "estimate"]);
  });

  it("keeps row order between items that share a hide priority", () => {
    const result = partition([item("a", 1, 50), item("b", 1, 50), item("c", 1, 50)], 146);
    expect(result.visibleKeys).toEqual(["a", "b"]);
    expect(result.hiddenKeys).toEqual(["c"]);
  });

  it("stops at the first item that does not fit instead of skipping ahead to smaller ones", () => {
    // "assignee" (200) does not fit after state; the smaller, less important "link" must not jump it.
    const result = partition([item("state", 0, 50), item("assignee", 2, 200), item("link", 12, 20)], 150);
    expect(result.visibleKeys).toEqual(["state"]);
    expect(result.hiddenKeys).toEqual(["assignee", "link"]);
  });

  it("collapses everything behind the trigger when even one chip does not fit", () => {
    const result = partition([item("state", 0, 120), item("priority", 1, 60)], 100);
    expect(result.visibleKeys).toEqual([]);
    expect(result.hiddenKeys).toEqual(["state", "priority"]);
    expect(result.tierByKey.size).toBe(0);
  });

  it("steps a shrinkable chip down before collapsing anything", () => {
    const labels = item("labels", 3, 240, 160, 70);
    const state = item("state", 0, 80);
    // Richest fits.
    expect(partition([state, labels], 400).tierByKey.get("labels")).toBe(0);
    // 80 + 8 + 160 = 248: the middle tier.
    expect(partition([state, labels], 250).tierByKey.get("labels")).toBe(1);
    // Only the smallest tier fits, but labels stay visible.
    const tight = partition([state, labels], 160);
    expect(tight.visibleKeys).toEqual(["state", "labels"]);
    expect(tight.tierByKey.get("labels")).toBe(2);
  });

  it("never hides a chip so that another can render richer", () => {
    const items = [item("state", 0, 80), item("labels", 3, 300, 60), item("cycle", 7, 80)];
    // At the smallest label tier all three fit (80 + 8 + 60 + 8 + 80 = 236); the richer label tier
    // would need the cycle's room, so labels stay small and the cycle stays visible.
    const result = partition(items, 240);
    expect(result.visibleKeys).toEqual(["state", "labels", "cycle"]);
    expect(result.tierByKey.get("labels")).toBe(1);
  });

  it("only adds chips as the budget grows", () => {
    const items = [
      item("state", 0, 90),
      item("priority", 1, 70),
      item("assignee", 2, 40),
      item("labels", 3, 260, 180, 90),
      item("due_date", 5, 100),
      item("link", 12, 40),
    ];
    let previous: string[] = [];
    for (let budget = 0; budget <= 900; budget += 5) {
      const { visibleKeys } = partition(items, budget);
      expect(previous.every((key) => visibleKeys.includes(key))).toBe(true);
      previous = visibleKeys;
    }
    expect(previous).toHaveLength(items.length);
  });

  it("sizes the trigger reservation from the collapsed count", () => {
    const widths: number[] = [];
    partitionWorkItemProperties({
      items: [item("state", 0, 50), item("priority", 1, 50), item("link", 12, 50)],
      budget: 60,
      gap: GAP,
      triggerWidth: (hiddenCount) => {
        widths.push(hiddenCount);
        return hiddenCount >= 10 ? 40 : 30;
      },
    });
    expect(widths).toContain(2);
  });
});
