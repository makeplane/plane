/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { getValueFromLocalStorage, setValueIntoLocalStorage } from "@plane/hooks";

// ids of the list rows (see `getIssueBlockId`) whose sub-work items are expanded in the list layout
const EXPANDED_BLOCKS_STORAGE_KEY = "list_layout_expanded_issue_blocks";
// keeps the stored value bounded; the least recently expanded rows are dropped first
const MAX_PERSISTED_BLOCKS = 100;

// read once per page load and kept in sync by `persistIssueBlockExpandedState`, since every row asks on mount
let expandedBlockIds: string[] | undefined;

const readExpandedBlockIds = (): string[] => {
  try {
    const ids = getValueFromLocalStorage(EXPANDED_BLOCKS_STORAGE_KEY, []);
    return Array.isArray(ids) ? ids : [];
  } catch {
    // local storage can be unavailable (blocked site data, private mode): behave as if nothing was persisted
    return [];
  }
};

export const isIssueBlockExpanded = (blockId: string): boolean => {
  if (!expandedBlockIds) expandedBlockIds = readExpandedBlockIds();
  return expandedBlockIds.includes(blockId);
};

export const persistIssueBlockExpandedState = (blockId: string, isExpanded: boolean) => {
  // re-read so that changes made from another tab are not overwritten
  const ids = readExpandedBlockIds().filter((id) => id !== blockId);
  if (isExpanded) ids.push(blockId);
  expandedBlockIds = ids.slice(-MAX_PERSISTED_BLOCKS);
  setValueIntoLocalStorage(EXPANDED_BLOCKS_STORAGE_KEY, expandedBlockIds);
};
