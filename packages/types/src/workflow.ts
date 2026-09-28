/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Workflow admin + runtime types — spec §17.1, §17.2, §17.3, §24.
 *
 * Two id spaces coexist and must not be conflated (see §7.5):
 *
 * - `IWorkflowState.id` is a `WorkflowState` row PK and is what the
 *   flow write API (`POST .../flows/`) expects for
 *   `source_state_id` / `target_state_id` / `reject_state_id`.
 * - `IWorkflowState.state_id` is the underlying `plane.db.State` UUID.
 *   The flow *read* API returns this one in `source_state_id` etc.
 */

export type TWorkflowRevisionStatus = "draft" | "published" | "retired";

export type TWorkflowFlowType = "transition" | "approval";

/** §12 — actor resolver registry. Mirrors `WorkflowFlowActorType`. */
export type TWorkflowFlowActorType =
  | "ALL_PROJECT_MEMBERS"
  | "STATIC_USERS"
  | "PROJECT_ROLE"
  | "REQUESTER_MANAGER"
  | "DEPARTMENT_HEAD"
  | "PORTAL_ROLE"
  | "PROPERTY_MEMBER";

/** §17.1 `WorkflowLiteSerializer` — list rows carry no revisions. */
export interface IWorkflow {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** §17.1 `WorkflowReadSerializer` — detail nests the full revision tree. */
export interface IWorkflowDetail extends IWorkflow {
  created_by: string | null;
  updated_by: string | null;
  revisions: IWorkflowRevision[];
}

/** §17.2 `WorkflowStateReadSerializer`. */
export interface IWorkflowState {
  /** `WorkflowState` PK — the id the flow write API expects. */
  id: string;
  /** `plane.db.State` UUID. */
  state_id: string;
  state_name: string;
  state_group: string;
  sequence: number;
  allow_new_work_items: boolean;
}

/** §17.2 `WorkflowFlowReadSerializer`. State UUIDs, *not* WorkflowState PKs. */
export interface IWorkflowFlow {
  id: string;
  flow_type: TWorkflowFlowType;
  source_state_id: string;
  source_state_name: string;
  target_state_id: string;
  target_state_name: string;
  reject_state_id: string | null;
  sequence: number;
  is_active: boolean;
}

/** §17.2 `WorkflowFlowActorReadSerializer`. */
export interface IWorkflowFlowActor {
  id: string;
  actor_type: TWorkflowFlowActorType;
  config: Record<string, unknown>;
  sequence: number;
}

/** §17.1 `WorkflowRevisionReadSerializer`. */
export interface IWorkflowRevision {
  id: string;
  workflow: string;
  version: number;
  status: TWorkflowRevisionStatus;
  published_at: string | null;
  published_by: string | null;
  created_at: string;
  updated_at: string;
  states: IWorkflowState[];
  flows: IWorkflowFlow[];
}

/** §7.3 `WorkflowTypeAssignmentReadSerializer`. */
export interface IWorkflowTypeAssignment {
  id: string;
  workflow: string;
  workflow_name: string;
  issue_type: string;
  issue_type_name: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Write payloads — §17.1, §17.2
// ---------------------------------------------------------------------------

export type TWorkflowCreatePayload = {
  name: string;
  description?: string;
  is_active?: boolean;
};

/** `is_default` is writable here but bootstrap-only in practice — see §7.1. */
export type TWorkflowUpdatePayload = Partial<TWorkflowCreatePayload> & {
  is_default?: boolean;
};

export type TWorkflowStateCreatePayload = {
  /** `plane.db.State` UUID. */
  state_id: string;
  sequence?: number;
  allow_new_work_items?: boolean;
};

export type TWorkflowStateUpdatePayload = Partial<TWorkflowStateCreatePayload>;

export type TWorkflowFlowCreatePayload = {
  /** `WorkflowState` PK. */
  source_state_id: string;
  /** `WorkflowState` PK. */
  target_state_id: string;
  /** `WorkflowState` PK; required for `approval` flows, forbidden for `transition`. */
  reject_state_id?: string | null;
  flow_type?: TWorkflowFlowType;
  sequence?: number;
  is_active?: boolean;
};

export type TWorkflowFlowUpdatePayload = Partial<TWorkflowFlowCreatePayload>;

export type TWorkflowFlowActorCreatePayload = {
  actor_type: TWorkflowFlowActorType;
  config?: Record<string, unknown>;
  sequence?: number;
};

export type TWorkflowTypeAssignmentCreatePayload = {
  workflow_id: string;
  issue_type_id: string;
};

// ---------------------------------------------------------------------------
// Runtime — §17.3
// ---------------------------------------------------------------------------

export interface IIssueWorkflowBinding {
  id: string;
  issue_id: string;
  bound_at: string;
}

export interface IIssueWorkflowSnapshot {
  id: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
  is_type_specific: boolean;
}

/** `GET /issues/:id/workflow/` — 200 with nulls when no workflow is bound. */
export interface IIssueWorkflowResponse {
  workflow: IIssueWorkflowSnapshot | null;
  revision: { id: string; version: number; status: TWorkflowRevisionStatus } | null;
  binding: IIssueWorkflowBinding | null;
  reason?: string;
}

/** `GET /issues/:id/workflow/actions/` — `workflow` is null when off/unbound. */
export interface IIssueWorkflowActionsResponse {
  workflow: { id: string; revision_id: string; version: number } | null;
  state: { id: string; name: string } | null;
  transitions: IIssueWorkflowTransition[];
  approval: IIssueWorkflowPendingApproval | null;
}

export interface IIssueWorkflowTransition {
  flow_id: string;
  target_state_id: string;
  target_state_name: string;
  flow_type: TWorkflowFlowType;
  allowed: boolean;
}

// ---------------------------------------------------------------------------
// Approval runtime — §7.8–§7.10, §11, §17.3
// ---------------------------------------------------------------------------

/** §7.8 `WorkflowApprovalStatus`. */
export type TWorkflowApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";

/** §7.10 `WorkflowApprovalDecisionType`. */
export type TWorkflowApprovalDecisionType = "approve" | "reject";

/**
 * The `approval` block of `GET /issues/:id/workflow/actions/`.
 *
 * Eligibility is the server's call (§11.2, §18.2): `can_decide` is true only
 * when the requesting user is on the approval's snapshotted approver list, so
 * the UI renders the approve/reject controls from this flag and never decides
 * eligibility itself.
 */
export interface IIssueWorkflowPendingApproval {
  id: string;
  status: TWorkflowApprovalStatus;
  source_state_id: string;
  source_state_name: string | null;
  target_state_id: string;
  target_state_name: string | null;
  reject_state_id: string | null;
  can_decide: boolean;
  approver_user_ids: string[];
}

/** §7.10 audit row, as returned by the approval read endpoint. */
export interface IWorkflowApprovalDecision {
  id: string;
  decision: TWorkflowApprovalDecisionType;
  actor_id: string | null;
  comment: string;
  idempotency_key: string | null;
  created_at: string | null;
}

/** `GET /issues/:id/approvals/:approval_id/` — the pending approval in full. */
export interface IWorkflowApprovalDetail extends IIssueWorkflowPendingApproval {
  issue_id: string;
  flow_id: string;
  requested_at: string | null;
  requested_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_comment: string;
  decisions: IWorkflowApprovalDecision[];
}

/** `ApprovalSummary.to_dict()` — the chained next approval after a decision. */
export interface IWorkflowApprovalNextSummary {
  approval_id: string;
  approver_user_ids: string[];
  source_type_summary: Record<string, number>;
}

/**
 * `POST .../approve/` and `.../reject/` result — §11 `DecisionResult`.
 *
 * `next_approval` is a chained approval summary, or `{ error, detail }` when
 * the next step had no resolvable approver (§12.8) — the decision itself still
 * succeeded, so the UI reports it as a warning rather than a failure.
 */
export interface IWorkflowApprovalDecisionResult {
  approval_id: string;
  decision: TWorkflowApprovalDecisionType;
  decision_id: string;
  new_state_id: string;
  new_state_name: string | null;
  next_approval?: IWorkflowApprovalNextSummary | IWorkflowErrorPayload;
}

// ---------------------------------------------------------------------------
// Structured errors — §10, §23.5
// ---------------------------------------------------------------------------

export const WORKFLOW_ERROR_CODES = {
  WORKFLOW_DISABLED: "WORKFLOW_DISABLED",
  WORKFLOW_NO_EFFECTIVE_WORKFLOW: "WORKFLOW_NO_EFFECTIVE_WORKFLOW",
  WORKFLOW_NO_CREATION_STATE: "WORKFLOW_NO_CREATION_STATE",
  WORKFLOW_STATE_NOT_INCLUDED: "WORKFLOW_STATE_NOT_INCLUDED",
  WORKFLOW_TRANSITION_NOT_ALLOWED: "WORKFLOW_TRANSITION_NOT_ALLOWED",
  WORKFLOW_APPROVAL_BLOCKS_TRANSITION: "WORKFLOW_APPROVAL_BLOCKS_TRANSITION",
  WORKFLOW_ACTOR_NOT_AUTHORIZED: "WORKFLOW_ACTOR_NOT_AUTHORIZED",
  WORKFLOW_APPROVER_NOT_RESOLVED: "WORKFLOW_APPROVER_NOT_RESOLVED",
  WORKFLOW_APPROVAL_ALREADY_RESOLVED: "WORKFLOW_APPROVAL_ALREADY_RESOLVED",
  WORKFLOW_PRECONDITION_FAILED: "WORKFLOW_PRECONDITION_FAILED",
  WORKFLOW_BYPASS_REASON_REQUIRED: "WORKFLOW_BYPASS_REASON_REQUIRED",
  WORKFLOW_REVISION_NOT_DRAFT: "WORKFLOW_REVISION_NOT_DRAFT",
  WORKFLOW_REVISION_PUBLISH_INVALID: "WORKFLOW_REVISION_PUBLISH_INVALID",
  WORKFLOW_FLOW_VALIDATION: "WORKFLOW_FLOW_VALIDATION",
  WORKFLOW_NOT_FOUND: "WORKFLOW_NOT_FOUND",
  WORKFLOW_DEFAULT_IMMUTABLE: "WORKFLOW_DEFAULT_IMMUTABLE",
} as const;

export type TWorkflowErrorCode = (typeof WORKFLOW_ERROR_CODES)[keyof typeof WORKFLOW_ERROR_CODES];

/** A single entry of `WorkflowRevisionPublishInvalid.extra.issues`. */
export interface IWorkflowValidationIssue {
  code?: string;
  detail: string;
  flow_id?: string;
  source_state_id?: string;
}

/**
 * `WorkflowError.to_payload()` — the §17.3 / §23.5 error envelope.
 *
 * `extra` fields vary by code (`state_id`, `source_state_id`,
 * `target_state_id`, `allowed_target_ids`, `approval_id`, `issues`), so
 * they are modelled as optional rather than discriminated to keep the
 * call sites that only read `detail` ergonomic.
 */
export interface IWorkflowErrorPayload {
  code: TWorkflowErrorCode;
  detail: string;
  state_id?: string;
  source_state_id?: string;
  target_state_id?: string;
  allowed_target_ids?: string[];
  approval_id?: string | null;
  issues?: IWorkflowValidationIssue[];
}
