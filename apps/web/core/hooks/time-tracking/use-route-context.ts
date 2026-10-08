/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

/**
 * The project and work item the user is looking at (peek view, work item page or project page),
 * used to pre-fill the timer and the Log time modal.
 */
export const useTimeTrackingRouteContext = () => {
  const params = useParams();
  const {
    peekIssue,
    issue: { getIssueById, getIssueIdByIdentifier },
  } = useIssueDetail();

  if (peekIssue) return { projectId: peekIssue.projectId, issueId: peekIssue.issueId };

  const workItem = params.workItem?.toString();
  const browseIssueId = workItem ? getIssueIdByIdentifier(workItem) : undefined;
  if (browseIssueId) {
    const issue = getIssueById(browseIssueId);
    return { projectId: issue?.project_id ?? null, issueId: browseIssueId };
  }

  return { projectId: params.projectId?.toString() ?? null, issueId: params.issueId?.toString() ?? null };
};
