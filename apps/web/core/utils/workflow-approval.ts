/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type {
  IIssueWorkflowActionsResponse,
  IIssueWorkflowPendingApproval,
  IWorkflowApprovalDetail,
  IWorkflowApprovalDecisionResult,
} from "@plane/types";

/** The pending `approval` block, or nothing when no approval is open (§11.1). */
export const getPendingApproval = (
  actions: IIssueWorkflowActionsResponse | undefined | null
): IIssueWorkflowPendingApproval | undefined => actions?.approval ?? undefined;

/**
 * §11.2 / §18.2 — only a server-confirmed approver sees the decision controls.
 * The UI never re-derives eligibility from project membership; the snapshot
 * taken when the approval opened is the authority.
 */
export const canDecideApproval = (approval: IIssueWorkflowPendingApproval | undefined | null): boolean =>
  Boolean(approval?.can_decide) && approval?.status === "pending";

/**
 * §23.3 / §23.4 — the state selector must not offer illegal destinations.
 *
 * Returns the ids the picker is allowed to list, or `undefined` when no
 * workflow is bound to the item, which the caller passes straight through to
 * the dropdown so the workflows-off path is byte-for-byte the old behaviour.
 *
 * While an approval is pending the source state exposes no transition flows
 * (approval flows live in the `approval` block), so the result is just the
 * current state — the item can only move via Approve / Reject.
 */
export const getWorkflowAllowedStateIds = (
  actions: IIssueWorkflowActionsResponse | undefined | null,
  currentStateId: string | null | undefined
): string[] | undefined => {
  if (!actions?.workflow) return undefined;
  const allowed = (actions.transitions ?? []).filter((transition) => transition.allowed).map((t) => t.target_state_id);
  return currentStateId ? [currentStateId, ...allowed.filter((id) => id !== currentStateId)] : allowed;
};

export type TWorkflowApprovalActivityKind = "requested" | "approved" | "rejected";

/**
 * §21 — one row of the approval record rendered in Work Item activity:
 * the request, then every §7.10 decision in order.
 */
export interface TWorkflowApprovalActivityEntry {
  id: string;
  kind: TWorkflowApprovalActivityKind;
  createdAt: string | null;
  actorId: string | null;
  fromStateName: string | null;
  toStateName: string | null;
  comment: string;
}

/**
 * §21 — flatten an approval into activity rows.
 *
 * The backend records approvals in `WorkflowApprovalDecision` (§7.10) and
 * notifies through the existing Plane notification path (§22); it does not
 * write `IssueActivity` rows for them, so the activity surface builds these
 * from the approval read endpoint rather than growing a second feed.
 */
export const buildApprovalActivityEntries = (
  approval: IWorkflowApprovalDetail | undefined | null
): TWorkflowApprovalActivityEntry[] => {
  if (!approval) return [];

  const entries: TWorkflowApprovalActivityEntry[] = [
    {
      id: `approval-request-${approval.id}`,
      kind: "requested",
      createdAt: approval.requested_at,
      actorId: approval.requested_by,
      fromStateName: approval.source_state_name,
      toStateName: approval.target_state_name,
      comment: "",
    },
  ];

  for (const decision of approval.decisions ?? []) {
    entries.push({
      id: `approval-decision-${decision.id}`,
      kind: decision.decision === "approve" ? "approved" : "rejected",
      createdAt: decision.created_at,
      actorId: decision.actor_id,
      fromStateName: approval.source_state_name,
      toStateName: decision.decision === "approve" ? approval.target_state_name : null,
      comment: decision.comment ?? "",
    });
  }

  return entries;
};

/**
 * §11.2 step 4 + §12.8 — a successful decision can still be followed by a
 * `next_approval` that carries an error payload because no approver could be
 * resolved for the next step. The decision stands, so this is a warning the UI
 * shows, not a failure.
 */
export const getNextApprovalWarning = (
  result: IWorkflowApprovalDecisionResult | undefined | null
): string | undefined => {
  const nextApproval = result?.next_approval;
  if (!nextApproval) return undefined;
  if ("detail" in nextApproval && typeof nextApproval.detail === "string") return nextApproval.detail;
  return undefined;
};
