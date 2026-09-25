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
 * main grouped list.
 *
 * Allow ADD only when the issue is already visible AND either:
 * - it was already a sub-issue (e.g. epic child moving between columns — #9049), or
 * - this is an explicit ADD action (preserve prior add-to-list behavior).
 *
 * Do not allow ADD solely because the id is still in a source group during a
 * root→sub-issue transition that also changes group key (e.g. state) — the
 * snapshot would otherwise keep a newly hidden sub-issue in the destination.
 */
export const shouldSkipHiddenSubIssueAdd = ({
  isSubIssue,
  isShowSubIssuesEnabled,
  isAlreadyInGroupedList,
  wasAlreadySubIssue,
  isExplicitAdd,
}: {
  isSubIssue: boolean;
  isShowSubIssuesEnabled: boolean;
  isAlreadyInGroupedList: boolean;
  wasAlreadySubIssue: boolean;
  isExplicitAdd: boolean;
}): boolean => {
  if (!isSubIssue || isShowSubIssuesEnabled) return false;

  const canMoveAsVisibleSubIssue = isAlreadyInGroupedList && (wasAlreadySubIssue || isExplicitAdd);

  return !canMoveAsVisibleSubIssue;
};
