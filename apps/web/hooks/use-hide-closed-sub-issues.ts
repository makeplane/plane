/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";

/**
 * d2m-plane: sub-work items rendered under an expanded parent come from the sub-issues endpoint,
 * which doesn't apply the layout's `show_closed` display filter. This hook returns a helper that
 * drops sub-work items in the "Closed" state unless "Show closed" is enabled.
 * Must be used inside an observer component so it re-renders when states / filters change.
 */
export const useHideClosedSubIssues = () => {
  const { issuesFilter } = useIssuesStore();
  const { getStateById } = useProjectState();
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const showClosed = issuesFilter?.issueFilters?.displayFilters?.show_closed ?? false;

  return (subIssueIds: string[] | undefined): string[] | undefined => {
    if (showClosed || !subIssueIds) return subIssueIds;
    return subIssueIds.filter((id) => !getStateById(getIssueById(id)?.state_id)?.is_closed);
  };
};
