/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// helpers
import { getWorkflowAllowedStateIds } from "@/utils/workflow-approval";

/**
 * §23.3 / §23.4 — the state ids the Work Item state selector is allowed to
 * offer, read from the §17.3 runtime actions.
 *
 * `undefined` means "no workflow is bound", which the dropdown takes as
 * "offer every project state" — the workflows-off path is unchanged. While an
 * approval is pending the source state exposes no transition flows, so the
 * result is just the current state: the item can then only move through
 * Approve / Reject.
 *
 * The actions payload is loaded by `IssueApprovalRoot`, which every Work Item
 * detail surface renders.
 */
export const useIssueWorkflowStateIds = (issueId: string | null | undefined): string[] | undefined => {
  const {
    issue: { getIssueById },
    approval: { getActionsByIssueId },
  } = useIssueDetail();

  const currentStateId = issueId ? getIssueById(issueId)?.state_id : undefined;
  return getWorkflowAllowedStateIds(getActionsByIssueId(issueId), currentStateId);
};
