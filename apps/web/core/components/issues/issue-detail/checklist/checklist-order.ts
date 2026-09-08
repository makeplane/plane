/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssueChecklistItem } from "@plane/types";

const SORT_ORDER_STEP = 65535;

/**
 * Float-midpoint ordering, same algorithm as handleSortOrder in
 * issue-layouts/utils.tsx (which is module-private and not exported): drop
 * above the first item subtracts a step, drop below the last item adds a
 * step, and a drop between two items takes their midpoint. Checklist items
 * have no groups, so this is a flat-list simplification of that function.
 */
export function computeChecklistItemSortOrder(
  orderedItems: TIssueChecklistItem[],
  targetId: string,
  edge: "top" | "bottom"
): number {
  const targetIndex = orderedItems.findIndex((item) => item.id === targetId);
  if (targetIndex === -1) return SORT_ORDER_STEP;

  const target = orderedItems[targetIndex];
  const prev = orderedItems[targetIndex - 1];
  const next = orderedItems[targetIndex + 1];

  if (edge === "top") {
    if (!prev) return target.sort_order - SORT_ORDER_STEP;
    return (prev.sort_order + target.sort_order) / 2;
  }
  // edge === "bottom"
  if (!next) return target.sort_order + SORT_ORDER_STEP;
  return (target.sort_order + next.sort_order) / 2;
}
