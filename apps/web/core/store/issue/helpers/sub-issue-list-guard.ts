/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Returns true when `issueId` is already present in any grouped / sub-grouped
 * issue id list. Used to distinguish "newly appearing" work items from ones
 * that are already visible as primary results (e.g. epic children in an
 * epic-filtered view).
 */
export const isIssueIdInGroupedIssueIds = (
  groupedIssueIds: Record<string, string[] | Record<string, string[]>> | undefined,
  issueId: string
): boolean => {
  if (!groupedIssueIds) return false;

  for (const group of Object.values(groupedIssueIds)) {
    if (Array.isArray(group)) {
      if (group.includes(issueId)) return true;
      continue;
    }

    if (group && typeof group === "object") {
      for (const subGroup of Object.values(group)) {
        if (Array.isArray(subGroup) && subGroup.includes(issueId)) return true;
      }
    }
  }

  return false;
};

/**
 * When "Show sub-issues" is off, hide sub-issues that would newly appear in the
 * main grouped list. Do not suppress ADD for issues already in that list —
 * they are primary content (e.g. epic-filtered kanban) and must still move on
 * optimistic drag/drop updates. See makeplane/plane#9049.
 */
export const shouldSkipHiddenSubIssueAdd = ({
  isSubIssue,
  isShowSubIssuesEnabled,
  isAlreadyInGroupedList,
}: {
  isSubIssue: boolean;
  isShowSubIssuesEnabled: boolean;
  isAlreadyInGroupedList: boolean;
}): boolean => isSubIssue && !isShowSubIssuesEnabled && !isAlreadyInGroupedList;
