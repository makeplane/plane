/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type {
  IIssueWorkflowActionsResponse,
  IWorkflowApprovalDecisionResult,
  IWorkflowApprovalDetail,
  TWorkflowApprovalDecisionType,
} from "@plane/types";
// services
import { APIService } from "@/services/api.service";

/**
 * §17.3 — the Work Item-scoped workflow runtime: allowed actions plus the
 * approval read/decide endpoints.
 *
 * Like `ProjectWorkflowService`, every method throws the **response body**
 * (`error.response.data`) so callers receive the §17.3 structured envelope
 * (`{ code, detail, ... }`) verbatim — §23.5 requires the backend's blocker
 * string to reach the user unparaphrased. The decide endpoints also carry the
 * conflict case: a losing concurrent decision answers 409
 * `WORKFLOW_APPROVAL_ALREADY_RESOLVED` (§11.4), which the caller surfaces as
 * the server's message and then re-reads the state from.
 */
export class IssueWorkflowService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  private issueBasePath(workspaceSlug: string, projectId: string, issueId: string) {
    return `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}`;
  }

  /** §17.3 — allowed transitions plus the pending `approval` block. */
  async getIssueWorkflowActions(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<IIssueWorkflowActionsResponse> {
    return this.get(`${this.issueBasePath(workspaceSlug, projectId, issueId)}/workflow/actions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * §17.3 — the pending approval with its approver snapshot and the §7.10
   * decision history. The id comes from the `approval` block of the actions
   * endpoint, so a resolved approval is only reachable while it is the
   * item's current one.
   */
  async getIssueApproval(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    approvalId: string
  ): Promise<IWorkflowApprovalDetail> {
    return this.get(`${this.issueBasePath(workspaceSlug, projectId, issueId)}/approvals/${approvalId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * §11.2 / §11.3 — record an approve/reject decision. The item's state moves
   * in the same transaction, so the response carries the resulting state and
   * any chained `next_approval`.
   *
   * `idempotencyKey` maps to the optional `Idempotency-Key` header (§11.5);
   * replaying the same key returns the original outcome instead of applying
   * the decision twice, so the caller keeps one key per attempt.
   */
  async decideApproval(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    approvalId: string,
    data: { decision: TWorkflowApprovalDecisionType; comment?: string; idempotencyKey?: string }
  ): Promise<IWorkflowApprovalDecisionResult> {
    return this.post(
      `${this.issueBasePath(workspaceSlug, projectId, issueId)}/approvals/${approvalId}/${data.decision}/`,
      { comment: data.comment ?? "", idempotency_key: data.idempotencyKey },
      data.idempotencyKey ? { headers: { "Idempotency-Key": data.idempotencyKey } } : {}
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
