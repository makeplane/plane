/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, test } from "vitest";
import type {
  IIssueWorkflowActionsResponse,
  IWorkflowApprovalDecisionResult,
  IWorkflowApprovalDetail,
} from "@plane/types";
import { getWorkflowErrorCode, getWorkflowErrorMessage } from "@/utils/workflow-error";
import {
  buildApprovalActivityEntries,
  canDecideApproval,
  getNextApprovalWarning,
  getPendingApproval,
  getWorkflowAllowedStateIds,
} from "@/utils/workflow-approval";

// -- fixtures ---------------------------------------------------------------

const approval = (over: Partial<IIssueWorkflowActionsResponse["approval"]> = {}) => ({
  id: "ap-1",
  status: "pending" as const,
  source_state_id: "s-submitted",
  source_state_name: "Submitted",
  target_state_id: "s-manager",
  target_state_name: "Manager Approval",
  reject_state_id: "s-rejected",
  can_decide: true,
  approver_user_ids: ["u-1"],
  ...over,
});

const actions = (over: Partial<IIssueWorkflowActionsResponse> = {}): IIssueWorkflowActionsResponse => ({
  workflow: { id: "w-1", revision_id: "rev-1", version: 1 },
  state: { id: "s-submitted", name: "Submitted" },
  transitions: [],
  approval: approval(),
  ...over,
});

const approvalDetail = (over: Partial<IWorkflowApprovalDetail> = {}): IWorkflowApprovalDetail => ({
  ...approval(),
  issue_id: "i-1",
  flow_id: "f-1",
  requested_at: "2026-09-26T09:10:00Z",
  requested_by: "u-request",
  resolved_at: null,
  resolved_by: null,
  resolution_comment: "",
  decisions: [],
  ...over,
});

describe("getPendingApproval", () => {
  test("returns the pending approval block", () => {
    expect(getPendingApproval(actions())?.id).toBe("ap-1");
  });

  test("returns undefined when workflows are off or nothing is pending", () => {
    expect(getPendingApproval(actions({ workflow: null, approval: null }))).toBeUndefined();
    expect(getPendingApproval(undefined)).toBeUndefined();
  });
});

describe("canDecideApproval", () => {
  test("is true only for a server-confirmed approver on a pending approval", () => {
    expect(canDecideApproval(approval({ can_decide: true }))).toBe(true);
  });

  test("is false for a non-approver even while the approval is pending", () => {
    expect(canDecideApproval(approval({ can_decide: false }))).toBe(false);
  });

  test("is false once the approval is resolved", () => {
    expect(canDecideApproval(approval({ status: "approved" }))).toBe(false);
  });

  test("is false without an approval", () => {
    expect(canDecideApproval(undefined)).toBe(false);
  });
});

describe("getWorkflowAllowedStateIds", () => {
  test("returns undefined when no workflow is bound, so the picker is unchanged", () => {
    expect(getWorkflowAllowedStateIds(actions({ workflow: null }), "s-submitted")).toBeUndefined();
    expect(getWorkflowAllowedStateIds(undefined, "s-submitted")).toBeUndefined();
  });

  test("keeps the current state and adds only the transitions the server allows", () => {
    const result = getWorkflowAllowedStateIds(
      actions({
        transitions: [
          {
            flow_id: "f-1",
            target_state_id: "s-done",
            target_state_name: "Done",
            flow_type: "transition",
            allowed: true,
          },
          {
            flow_id: "f-2",
            target_state_id: "s-cancel",
            target_state_name: "Cancelled",
            flow_type: "transition",
            allowed: false,
          },
        ],
      }),
      "s-submitted"
    );
    expect(result).toEqual(["s-submitted", "s-done"]);
  });

  test("offers only the current state while an approval blocks every transition", () => {
    // An approval flow is not a transition flow, so the source state exposes
    // none — the item can then only move through Approve / Reject (§10.2).
    expect(getWorkflowAllowedStateIds(actions({ transitions: [] }), "s-manager")).toEqual(["s-manager"]);
  });

  test("does not duplicate the current state when it is also an allowed target", () => {
    const result = getWorkflowAllowedStateIds(
      actions({
        transitions: [
          {
            flow_id: "f-1",
            target_state_id: "s-submitted",
            target_state_name: "Submitted",
            flow_type: "transition",
            allowed: true,
          },
        ],
      }),
      "s-submitted"
    );
    expect(result).toEqual(["s-submitted"]);
  });
});

describe("buildApprovalActivityEntries", () => {
  test("is empty without an approval", () => {
    expect(buildApprovalActivityEntries(undefined)).toEqual([]);
  });

  test("renders the request followed by every decision in order", () => {
    const entries = buildApprovalActivityEntries(
      approvalDetail({
        decisions: [
          {
            id: "d-1",
            decision: "approve",
            actor_id: "u-approver",
            comment: "Looks good",
            idempotency_key: null,
            created_at: "2026-09-26T10:02:00Z",
          },
        ],
      })
    );

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      kind: "requested",
      actorId: "u-request",
      fromStateName: "Submitted",
      toStateName: "Manager Approval",
      createdAt: "2026-09-26T09:10:00Z",
    });
    expect(entries[1]).toMatchObject({
      kind: "approved",
      actorId: "u-approver",
      comment: "Looks good",
      createdAt: "2026-09-26T10:02:00Z",
    });
  });

  test("marks a rejection and keeps the source state as the origin", () => {
    const entries = buildApprovalActivityEntries(
      approvalDetail({
        status: "rejected",
        decisions: [
          {
            id: "d-2",
            decision: "reject",
            actor_id: "u-approver",
            comment: "Needs more context",
            idempotency_key: null,
            created_at: "2026-09-26T10:05:00Z",
          },
        ],
      })
    );
    expect(entries[1]).toMatchObject({ kind: "rejected", toStateName: null, comment: "Needs more context" });
  });
});

describe("getNextApprovalWarning", () => {
  const result = (nextApproval: IWorkflowApprovalDecisionResult["next_approval"]) =>
    ({
      approval_id: "ap-1",
      decision: "approve",
      decision_id: "d-1",
      new_state_id: "s-hr",
      new_state_name: "HR Approval",
      next_approval: nextApproval,
    }) as IWorkflowApprovalDecisionResult;

  test("is undefined when the chain opened cleanly", () => {
    expect(
      getNextApprovalWarning(result({ approval_id: "ap-2", approver_user_ids: [], source_type_summary: {} }))
    ).toBeUndefined();
    expect(getNextApprovalWarning(undefined)).toBeUndefined();
  });

  test("surfaces the server's reason when the next approver could not be resolved", () => {
    expect(
      getNextApprovalWarning(
        result({ code: "WORKFLOW_APPROVER_NOT_RESOLVED", detail: "Next approval could not be opened." })
      )
    ).toBe("Next approval could not be opened.");
  });
});

describe("losing a concurrent approval decision (§11.4)", () => {
  // The decide endpoints answer a second decision with the §17.3 envelope, so
  // the UI must show the server's conflict string rather than a generic error
  // or a state the API never accepted.
  const conflict = { code: "WORKFLOW_APPROVAL_ALREADY_RESOLVED", detail: "This approval has already been resolved." };

  test("renders the backend message verbatim", () => {
    expect(getWorkflowErrorMessage(conflict, "The decision could not be recorded.")).toBe(
      "This approval has already been resolved."
    );
    expect(getWorkflowErrorCode(conflict)).toBe("WORKFLOW_APPROVAL_ALREADY_RESOLVED");
  });
});
