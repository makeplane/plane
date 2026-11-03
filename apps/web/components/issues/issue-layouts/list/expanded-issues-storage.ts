/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { getValueFromLocalStorage, setValueIntoLocalStorage } from "@plane/hooks";

// ids of work items whose sub-work items are expanded in the list layout
const EXPANDED_ISSUES_STORAGE_KEY = "list_layout_expanded_issue_ids";

const getExpandedIssueIds = (): string[] => {
  const ids = getValueFromLocalStorage(EXPANDED_ISSUES_STORAGE_KEY, []);
  return Array.isArray(ids) ? ids : [];
};

export const isIssueExpanded = (issueId: string): boolean => getExpandedIssueIds().includes(issueId);

export const persistIssueExpandedState = (issueId: string, isExpanded: boolean) => {
  const ids = getExpandedIssueIds().filter((id) => id !== issueId);
  if (isExpanded) ids.push(issueId);
  setValueIntoLocalStorage(EXPANDED_ISSUES_STORAGE_KEY, ids);
};
