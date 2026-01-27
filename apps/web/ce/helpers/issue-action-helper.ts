/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IssueActions } from "@/hooks/use-issues-actions";

export const useTeamIssueActions: () => IssueActions = () => ({
  fetchIssues: () => Promise.resolve(undefined),
  fetchNextIssues: () => Promise.resolve(undefined),
  removeIssue: () => Promise.resolve(undefined),
  updateFilters: () => Promise.resolve(undefined),
});

export const useTeamViewIssueActions: () => IssueActions = () => ({
  fetchIssues: () => Promise.resolve(undefined),
  fetchNextIssues: () => Promise.resolve(undefined),
  removeIssue: () => Promise.resolve(undefined),
  updateFilters: () => Promise.resolve(undefined),
});

export const useTeamProjectWorkItemsActions: () => IssueActions = () => ({
  fetchIssues: () => Promise.resolve(undefined),
  fetchNextIssues: () => Promise.resolve(undefined),
  removeIssue: () => Promise.resolve(undefined),
  updateFilters: () => Promise.resolve(undefined),
});
