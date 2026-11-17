/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Work item property keys from the one kept longest to the one collapsed first. A key's index is
 * its hide priority; keys not listed collapse after all of these.
 */
export const WORK_ITEM_PROPERTY_HIDE_ORDER = [
  "state",
  "priority",
  "assignee",
  "labels",
  "date_range",
  "due_date",
  "start_date",
  "cycle",
  "modules",
  "estimate",
  "sub_issue_count",
  "attachment_count",
  "link",
] as const;

export type WorkItemPropertyHideKey = (typeof WORK_ITEM_PROPERTY_HIDE_ORDER)[number];

/** Hide priority for a property key: its position in {@link WORK_ITEM_PROPERTY_HIDE_ORDER}. */
export function getWorkItemPropertyHidePriority(key: string): number {
  const index = (WORK_ITEM_PROPERTY_HIDE_ORDER as readonly string[]).indexOf(key);
  return index === -1 ? WORK_ITEM_PROPERTY_HIDE_ORDER.length : index;
}

export type PropertyPartitionItem = {
  key: string;
  hidePriority: number;
  /** Width in px of each rendering the item offers, richest first. A plain chip has exactly one. */
  tierWidths: readonly number[];
};

export type PropertyPartitionOptions = {
  /** Items in row order. */
  items: readonly PropertyPartitionItem[];
  /** Room for the chips in px. `null` means no limit: everything shows at its richest rendering. */
  budget: number | null;
  /** Horizontal gap between chips in px. */
  gap: number;
  /** Width in px of the "+N" trigger when `hiddenCount` items are collapsed. */
  triggerWidth: (hiddenCount: number) => number;
};

export type PropertyPartition = {
  /** Keys shown as chips, in row order. */
  visibleKeys: string[];
  /** Keys collapsed into the menu, in row order. */
  hiddenKeys: string[];
  /** Index into `tierWidths` chosen for each visible key. */
  tierByKey: Map<string, number>;
};

const smallestTier = (item: PropertyPartitionItem) => Math.max(0, item.tierWidths.length - 1);
const widthAt = (item: PropertyPartitionItem, tier: number) => item.tierWidths[tier] ?? 0;

/**
 * Splits a row of property chips into the ones that fit `budget` and the ones that collapse into
 * the "+N" menu.
 *
 * 1. Membership: walk the items from most to least important (lowest `hidePriority` first, ties in
 *    row order) at their smallest rendering, keeping room for the "+N" trigger while anything is
 *    still left over, and stop at the first item that does not fit. Because every width used here
 *    is fixed, a wider budget can only ever add items, never drop one.
 * 2. Richness: hand the room that is left over to the visible items that can grow, most important
 *    first, each taking its richest rendering that still fits. This never touches room already
 *    promised to another visible item, so a richer rendering cannot push a sibling out.
 */
export function partitionWorkItemProperties(options: PropertyPartitionOptions): PropertyPartition {
  const { items, budget, gap, triggerWidth } = options;

  if (budget === null) {
    return {
      visibleKeys: items.map((item) => item.key),
      hiddenKeys: [],
      tierByKey: new Map(items.map((item) => [item.key, 0])),
    };
  }

  const ranked = items
    .map((item, order) => ({ item, order }))
    .toSorted((a, b) => a.item.hidePriority - b.item.hidePriority || a.order - b.order)
    .map(({ item }) => item);

  const fitted: PropertyPartitionItem[] = [];
  let used = 0;
  for (const item of ranked) {
    const leadingGap = fitted.length > 0 ? gap : 0;
    const leftOver = ranked.length - fitted.length - 1;
    const triggerRoom = leftOver > 0 ? gap + triggerWidth(leftOver) : 0;
    const width = widthAt(item, smallestTier(item));
    if (used + leadingGap + width + triggerRoom > budget) break;
    used += leadingGap + width;
    fitted.push(item);
  }

  const hiddenCount = items.length - fitted.length;
  let slack = budget - used - (hiddenCount > 0 ? gap + triggerWidth(hiddenCount) : 0);
  const tierByKey = new Map<string, number>();
  for (const item of fitted) {
    const baseTier = smallestTier(item);
    const baseWidth = widthAt(item, baseTier);
    let chosen = baseTier;
    for (let tier = 0; tier < baseTier; tier++) {
      if (widthAt(item, tier) - baseWidth <= slack) {
        chosen = tier;
        break;
      }
    }
    slack -= widthAt(item, chosen) - baseWidth;
    tierByKey.set(item.key, chosen);
  }

  const fittedKeys = new Set(fitted.map((item) => item.key));
  return {
    visibleKeys: items.filter((item) => fittedKeys.has(item.key)).map((item) => item.key),
    hiddenKeys: items.filter((item) => !fittedKeys.has(item.key)).map((item) => item.key),
    tierByKey,
  };
}
