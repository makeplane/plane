/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { TIssue, TGroupedIssues } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";

export const isWorkspaceLevel = (type: EIssuesStoreType) =>
  [
    EIssuesStoreType.PROFILE,
    EIssuesStoreType.GLOBAL,
    EIssuesStoreType.TEAM,
    EIssuesStoreType.TEAM_VIEW,
    EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS,
    EIssuesStoreType.WORKSPACE_DRAFT,
  ].includes(type)
    ? true
    : false;

export const getWorkItemBlockId = (issueId: string | undefined, groupId: string | undefined, subGroupId?: string) =>
  `issue_${issueId}_${groupId}_${subGroupId}`;

/**
 * This Method returns if the the grouped values are subGrouped
 * @param groupedIssueIds
 * @returns
 */
export const isSubGrouped = (groupedIssueIds: TGroupedIssues) => {
  if (!groupedIssueIds || Array.isArray(groupedIssueIds)) {
    return false;
  }

  if (Array.isArray(groupedIssueIds[Object.keys(groupedIssueIds)[0]])) {
    return false;
  }

  return true;
};

/**
 * This Method returns if the work-item is new or not
 * @param issue
 * @returns
 */
export const isWorkItemNew = (issue: TIssue) => {
  const createdDate = new Date(issue.created_at);
  const currentDate = new Date();
  const diff = currentDate.getTime() - createdDate.getTime();
  return diff < 30000;
};

/**
 * Calculates the minimum width needed for work-item identifiers in list layouts
 * @param projectIdentifierLength - Length of the project identifier (e.g., "PROJ" = 4)
 * @param maxSequenceId - Maximum sequence ID in the project (e.g., 1234)
 * @returns Width in pixels needed to display the identifier
 *
 * @example
 * // For "PROJ-1234"
 * calculateIdentifierWidth(4, 1234) // Returns width for "PROJ" + "-" + "1234"
 */
export const calculateIdentifierWidth = (projectIdentifierLength: number, maxSequenceId: number): number => {
  const sequenceDigits = Math.max(1, Math.floor(Math.log10(maxSequenceId)) + 1);
  return projectIdentifierLength * 7 + 7 + sequenceDigits * 7; // project identifier chars + dash + sequence digits
};
