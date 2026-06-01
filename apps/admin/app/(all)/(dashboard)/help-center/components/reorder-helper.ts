/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

const STEP = 10000;

/**
 * Compute the new sort_order for an item moved one slot up (-1) or down (+1)
 * within a list already sorted by sort_order. Reuses the partial-update path
 * (no bespoke reorder endpoint): place the item at the midpoint between its
 * new neighbours, or one STEP past the edge. Returns null when the move is a no-op.
 */
export const computeReorderedSortValue = <T extends { sort_order: number }>(
  ordered: T[],
  index: number,
  direction: -1 | 1
): number | null => {
  const target = index + direction;
  if (target < 0 || target >= ordered.length) return null;

  if (direction === -1) {
    // moving up: land between item[index-2] and item[index-1]
    const upper = ordered[index - 1].sort_order;
    if (index - 2 < 0) return upper - STEP;
    return (ordered[index - 2].sort_order + upper) / 2;
  }
  // moving down: land between item[index+1] and item[index+2]
  const lower = ordered[index + 1].sort_order;
  if (index + 2 >= ordered.length) return lower + STEP;
  return (lower + ordered[index + 2].sort_order) / 2;
};
