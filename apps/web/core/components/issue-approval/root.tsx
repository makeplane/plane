/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { v4 as uuidv4 } from "uuid";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TWorkflowApprovalDecisionType } from "@plane/types";
import { WorkflowApprovalBar } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProjectState } from "@/hooks/store/use-project-state";
// helpers
import { getWorkflowErrorMessage } from "@/utils/workflow-error";
import { canDecideApproval, getNextApprovalWarning } from "@/utils/workflow-approval";

type TIssueApprovalRootProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

/**
 * §23.3 — the Work Item approval surface.
 *
 * The pending approval — and with it the badge — comes from the §17.3 actions
 * payload. The server decides both whether an approval exists and whether the
 * viewer may act on it, so the controls are rendered straight off
 * `approval.can_decide`; a viewer who is not on the approval's snapshotted
 * approver list still sees that the item is waiting, without the membership
 * data behind it (§11.2, §18.2).
 *
 * Nothing is flipped optimistically: the store re-reads the item, its actions
 * and the approval after the POST resolves, so a second decision that lost the
 * §11.4 race renders the server's conflict message over the real state rather
 * than a state the API never accepted.
 */
export const IssueApprovalRoot = observer(function IssueApprovalRoot(props: TIssueApprovalRootProps) {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  const { t } = useTranslation();
  // states
  const [comment, setComment] = useState("");
  // refs — §11.5. One key per decision attempt, reused across retries of that
  // attempt so a replayed request returns the original outcome instead of
  // applying the decision twice. Cleared once the attempt resolves.
  const idempotencyKeyRef = useRef<Record<string, string>>({});
  // hooks
  const {
    approval: { getPendingApprovalByIssueId, isDeciding },
    fetchApprovalState,
    decideApproval,
  } = useIssueDetail();
  const { getUserDetails } = useMember();
  const { getStateById } = useProjectState();
  // derived values
  const approval = getPendingApprovalByIssueId(issueId);
  const isEligible = canDecideApproval(approval);
  // The actions block reports the reject destination as an id only, so the
  // name is resolved from the project states the picker already holds.
  const rejectStateName = approval?.reject_state_id ? (getStateById(approval.reject_state_id)?.name ?? null) : null;
  // §23.3 — approver membership is only resolved for an eligible approver.
  const approverNames = useMemo(
    () =>
      isEligible
        ? (approval?.approver_user_ids ?? []).map((userId) => getUserDetails(userId)?.display_name ?? userId)
        : [],
    [approval?.approver_user_ids, isEligible, getUserDetails]
  );

  useSWR(
    workspaceSlug && projectId && issueId ? `ISSUE_WORKFLOW_ACTIONS_${workspaceSlug}_${projectId}_${issueId}` : null,
    workspaceSlug && projectId && issueId
      ? () => fetchApprovalState(workspaceSlug, projectId, issueId).then(() => true)
      : null,
    {
      revalidateIfStale: false,
      onError: (error: unknown) => {
        // A workflows-off item answers 200 with `workflow: null`; anything that
        // reaches here is a real read failure worth surfacing (§23.5).
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error.label"),
          message: getWorkflowErrorMessage(error, t("issue.workflow_approval.toast.load_failed")),
        });
      },
    }
  );

  const labels = useMemo(
    () => ({
      pending: t("issue.workflow_approval.badge.pending"),
      waitingFor: t("issue.workflow_approval.waiting_for"),
      approvers: t("issue.workflow_approval.approvers"),
      addComment: t("issue.workflow_approval.add_comment"),
      commentPlaceholder: t("issue.workflow_approval.comment_placeholder"),
      approve: t("issue.workflow_approval.approve"),
      reject: t("issue.workflow_approval.reject"),
      approveTo: (stateName: string) => t("issue.workflow_approval.approve_to", { state: stateName }),
      rejectTo: (stateName: string) => t("issue.workflow_approval.reject_to", { state: stateName }),
    }),
    [t]
  );

  const handleDecision = useCallback(
    async (decision: TWorkflowApprovalDecisionType) => {
      if (!approval || disabled) return;
      const attemptKey = `${approval.id}:${decision}`;
      const idempotencyKey = idempotencyKeyRef.current[attemptKey] ?? uuidv4();
      idempotencyKeyRef.current[attemptKey] = idempotencyKey;

      try {
        const result = await decideApproval(
          workspaceSlug,
          projectId,
          issueId,
          approval.id,
          decision,
          comment,
          idempotencyKey
        );
        delete idempotencyKeyRef.current[attemptKey];
        setComment("");
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("common.success"),
          message: t("issue.workflow_approval.toast.decision.success", { state: result.new_state_name ?? "" }),
        });
        // §12.8 — the decision stands even when the chained approval could not
        // resolve an approver, so the server's reason is a warning, not a
        // failure of the decision the user just made.
        const warning = getNextApprovalWarning(result);
        if (warning) {
          setToast({ type: TOAST_TYPE.WARNING, title: t("common.warning"), message: warning });
        }
      } catch (error) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error.label"),
          // §11.4 — a losing concurrent decision arrives as 409
          // WORKFLOW_APPROVAL_ALREADY_RESOLVED and the backend's message is
          // shown verbatim instead of a generic failure.
          message: getWorkflowErrorMessage(error, t("issue.workflow_approval.toast.decision.error")),
        });
      }
    },
    [approval, comment, decideApproval, disabled, issueId, projectId, t, workspaceSlug]
  );

  if (!approval) return null;

  return (
    <WorkflowApprovalBar
      sourceStateName={approval.source_state_name}
      targetStateName={approval.target_state_name}
      rejectStateName={rejectStateName}
      approverNames={approverNames}
      canDecide={isEligible}
      disabled={disabled}
      isDeciding={isDeciding(approval.id)}
      comment={comment}
      onCommentChange={setComment}
      onApprove={() => void handleDecision("approve")}
      onReject={() => void handleDecision("reject")}
      labels={labels}
    />
  );
});
