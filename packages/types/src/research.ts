/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TOrgUnitType = "ROOT" | "INSTITUTE" | "LAB" | "GROUP" | "TEAM";
export type TOrgRole = "OWNER" | "PI" | "ADVISOR" | "REVIEWER" | "UNIT_ADMIN";
export type TReportType = "WEEKLY" | "MONTHLY";
export type TReportStatus = "DRAFT" | "SUBMITTED" | "NEEDS_REVISION" | "ACCEPTED";
export type TReportVisibility = "PRIVATE" | "DIRECT_ADVISOR" | "UNIT" | "ANCESTRY" | "WORKSPACE" | "CUSTOM";
export type TResearchProjectType = "PHD" | "MASTER" | "POSTDOC" | "RESEARCH_PROJECT";
export type TResearchProjectStatus = "ACTIVE" | "ARCHIVED" | "COMPLETED";
export type TApprovalType = "TASK" | "PURCHASE" | "CUSTOM";
export type TApprovalRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN" | "CANCELLED";
export type TStageType = "PRE_OPENING" | "OPENING" | "MIDTERM" | "FINAL";
export type TStageStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "NEEDS_REVISION" | "PASSED";
export type TStageGateResult = "PASS" | "BLOCKED" | "WAIVED";
export type TStageTransitionAction = "ENTER" | "SUBMIT" | "RETURN" | "PASS" | "REOPEN" | "OVERRIDE";
export type TStageMaterialStatus = "DRAFT" | "SUBMITTED" | "ACCEPTED" | "REJECTED";
export type TStageMaterialChangeSource = "MANUAL" | "ADMIN_OVERRIDE" | "STAGE_REOPEN";
export type TStageRequirementType =
  | "MANUAL"
  | "LITERATURE_COUNT"
  | "EXPERIMENT_LINKED"
  | "CODE_REPO"
  | "OUTCOME_COUNT"
  | "MATERIAL_SET"
  | "REVIEW_RULE";
export type TStageGatePhase = "submit" | "pass";

export type TResearchUserLite = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar: string;
  avatar_url: string | null;
  is_active: boolean;
};

export type TOrgUnit = {
  id: string;
  name: string;
  parent: string | null;
  path: string;
  depth: number;
  unit_type: TOrgUnitType;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member_count?: number;
  children_count?: number;
};

export type TOrgUnitMember = {
  id: string;
  org_unit: string;
  user: string;
  member_detail?: TResearchUserLite;
  org_role: TOrgRole;
  is_primary: boolean;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
};

export type TMentorBinding = {
  id: string;
  mentee: string;
  mentor: string;
  mentee_detail?: TResearchUserLite;
  mentor_detail?: TResearchUserLite;
  org_unit: string | null;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
};

export type TWorkspaceResearchSetting = {
  id?: string;
  workspace?: string;
  module_enabled: boolean;
  org_enabled: boolean;
  report_enabled: boolean;
  approval_enabled: boolean;
  allow_multiple_projects: boolean;
  default_report_visibility: TReportVisibility;
  weekly_default_visibility?: TReportVisibility | null;
  monthly_default_visibility?: TReportVisibility | null;
  image_max_mb: number;
  pdf_max_mb: number;
  markdown_max_mb: number;
  timezone: string | null;
  audit_retention_days: number;
};

export type TResearchProjectProfile = {
  id: string;
  project: string;
  owner: string;
  org_unit: string | null;
  research_type: string;
  workflow_status: string;
  started_at: string | null;
  expected_end_at: string | null;
  completed_at: string | null;
  is_active: boolean;
};

export type TPeriodicReport = {
  id: string;
  workspace: string;
  project: string;
  owner: string;
  owner_detail?: TResearchUserLite;
  org_unit: string | null;
  org_unit_detail?: Pick<TOrgUnit, "id" | "name" | "unit_type"> | null;
  page: string;
  report_type: TReportType;
  period_key: string;
  period_start: string;
  period_end: string;
  timezone: string;
  status: TReportStatus;
  visibility: TReportVisibility;
  is_backfill: boolean;
  submitted_at: string | null;
  accepted_at: string | null;
  reviewer: string | null;
  created_at: string;
  updated_at: string;
  can_edit?: boolean;
  can_review?: boolean;
  attachment_count?: number;
};

export type TReportReviewLog = {
  id: string;
  report: string;
  actor: string;
  actor_detail?: TResearchUserLite;
  action: "SUBMIT" | "RETURN" | "ACCEPT" | "REOPEN";
  from_status: TReportStatus;
  to_status: TReportStatus;
  comment: string;
  snapshot_version: string | null;
  created_at: string;
};

export type TReportAttachment = {
  id: string;
  report: string;
  asset: string;
  asset_url?: string;
  file_name: string;
  file_size: number;
  content_type: string;
  kind: "IMAGE" | "PDF" | "MARKDOWN" | "OTHER";
  uploaded_by: string;
  created_at: string;
};

export type TReportSummaryCounts = {
  not_submitted: number;
  draft: number;
  submitted: number;
  needs_revision: number;
  accepted: number;
};

export type TReportSummary = {
  period_key: string;
  period_start: string;
  period_end: string;
  report_type?: TReportType;
  org_unit: string | null;
  org_unit_name: string | null;
  counts: TReportSummaryCounts;
  pending_members: TResearchUserLite[];
  by_unit?: {
    org_unit: string;
    org_unit_name: string;
    org_unit_type?: string;
    counts: TReportSummaryCounts;
    pending_members: Pick<TResearchUserLite, "id" | "email" | "display_name">[];
  }[];
};

export type TReportTemplate = {
  id: string;
  report_type: TReportType;
  name: string;
  content_json: Record<string, unknown>;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TIdentityMapping = {
  id: string;
  user: string;
  user_detail?: TResearchUserLite;
  provider: string;
  subject: string;
  email_snapshot: string | null;
  employee_id: string | null;
  status: string;
  last_login_at: string | null;
  last_login_ip: string | null;
};

export type TResearchIdentity = {
  module_enabled: boolean;
  workspace_enabled: boolean;
  sections: {
    org: boolean;
    reports: boolean;
    approvals: boolean;
    stages?: boolean;
    experiments?: boolean;
    code?: boolean;
    integrations?: boolean;
  };
  user: {
    id: string;
    is_workspace_admin: boolean;
    is_research_owner: boolean;
    org_units: {
      org_unit: string;
      org_unit_name: string;
      org_role: TOrgRole;
      is_primary: boolean;
    }[];
    mentor_ids: string[];
    mentee_ids: string[];
  };
  identity: {
    provider: string | null;
    subject: string | null;
    employee_id: string | null;
    configured: boolean;
  };
};

export type TApprovalFlowStep = {
  id: string;
  flow: string;
  order: number;
  approver_mode: "ANY" | "ALL";
  approver_org_role: TOrgRole | null;
  approver_user: string | null;
  approver_user_detail?: TResearchUserLite | null;
  is_required: boolean;
};

export type TApprovalFlow = {
  id: string;
  name: string;
  org_unit: string | null;
  approval_type: "TASK" | "PURCHASE" | "CUSTOM";
  is_active: boolean;
  version: number;
  steps: TApprovalFlowStep[];
  created_at: string;
  updated_at: string;
};

export type TApprovalAction = {
  id: string;
  request: string;
  step: string | null;
  actor: string;
  actor_detail?: TResearchUserLite;
  action: "APPROVE" | "REJECT" | "WITHDRAW" | "CANCEL";
  comment: string;
  created_at: string;
};

export type TApprovalRequest = {
  id: string;
  issue: string;
  issue_detail?: { id: string; name: string; sequence_id?: number };
  flow: string;
  flow_name?: string;
  flow_version: number;
  approval_type: "TASK" | "PURCHASE" | "CUSTOM";
  status: "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN" | "CANCELLED";
  current_step_order: number;
  requested_by: string;
  requested_by_detail?: TResearchUserLite;
  org_unit: string | null;
  research_project: string | null;
  report: string | null;
  created_at: string;
  updated_at: string;
  can_act?: boolean;
};

export type TResearchAuditEvent = {
  id: string;
  workspace: string;
  actor: string | null;
  actor_detail?: TResearchUserLite | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  org_unit: string | null;
  org_unit_detail?: Pick<TOrgUnit, "id" | "name"> | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type TResearchError = {
  error_code: string;
  message: string;
};

export type TStageGateItem = {
  code: string;
  label: string;
  label_key: string;
  passed: boolean;
  available: boolean;
  blocking: boolean;
  required: number;
  actual: number | null;
  applies_to: TStageGatePhase[];
  threshold_source?: string;
  hint?: string;
  missing?: string[];
  unannotated?: string[];
  unexplained?: { sequence_no: number; title: string }[];
  pending_required_roles?: string[];
};

export type TStageGate = {
  stage: TStageType;
  stage_id: string;
  project: string;
  phase: TStageGatePhase;
  result: "PASS" | "BLOCKED";
  rule_version: string;
  evaluated_at: string;
  items: TStageGateItem[];
  blockers: TStageGateItem[];
};

export type TStageMaterial = {
  id: string;
  stage_instance: string;
  material_type: string;
  page: string | null;
  page_detail?: {
    id: string;
    name: string;
    description_json: Record<string, unknown>;
    description_html: string;
  } | null;
  status: TStageMaterialStatus;
  visibility: TReportVisibility;
  is_required: boolean;
  submitted_at: string | null;
  last_version_no: number;
  owner: string;
  owner_detail?: TResearchUserLite;
  can_edit?: boolean;
  created_at: string;
  updated_at: string;
};

export type TStageMaterialVersion = {
  id: string;
  material: string;
  version_no: number;
  snapshot: Record<string, unknown>;
  change_source: TStageMaterialChangeSource;
  reason: string;
  diff_summary: Record<string, unknown>;
  created_by: string | null;
  created_by_detail?: TResearchUserLite | null;
  created_at: string;
};

export type TStageTransition = {
  id: string;
  stage_instance: string;
  actor: string | null;
  actor_detail?: TResearchUserLite | null;
  action: TStageTransitionAction;
  from_status: TStageStatus;
  to_status: TStageStatus;
  reason: string;
  gate_snapshot: TStageGate | Record<string, never>;
  review_snapshot: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type TStageInstance = {
  id: string;
  workspace: string;
  project: string;
  stage: TStageType;
  status: TStageStatus;
  sort_order: number;
  entered_at: string | null;
  submitted_at: string | null;
  passed_at: string | null;
  gate_result: TStageGateResult | null;
  attempt_count: number;
  org_unit: string | null;
  created_at: string;
  updated_at: string;
  is_editable?: boolean;
  materials?: TStageMaterial[];
  gate?: TStageGate;
  gate_pass?: TStageGate;
  transitions?: TStageTransition[];
  required_materials?: string[];
  review?: {
    reviewers: unknown[];
    reviews: unknown[];
    summary: Record<string, unknown>;
  };
};

export type TStageRequirement = {
  stage: TStageType;
  code: string;
  requirement_type: TStageRequirementType;
  threshold: number | null;
  is_blocking: boolean;
  is_active: boolean;
  direction: "min" | "max";
  source: string;
  label_key: string;
  applies_to: TStageGatePhase[];
  material_types: string[];
};

export type TReviewRecommendation = "PASS" | "REJECT" | "REVISE";
export type TReviewerRole = "DIRECT_ADVISOR" | "PI" | "REVIEWER" | "UNIT_ADMIN";
export type TAssignmentKind = "AUTO" | "MANUAL" | "DELEGATED";

export type TStageReviewerAssignment = {
  id: string;
  stage_instance: string;
  reviewer: string;
  reviewer_detail?: TResearchUserLite;
  reviewer_role: TReviewerRole;
  is_required: boolean;
  assignment_kind: TAssignmentKind;
  assigned_by: string | null;
  assigned_by_detail?: TResearchUserLite | null;
  is_active: boolean;
  superseded_at: string | null;
  valid_until: string | null;
  reviewed?: boolean;
  recommendation?: TReviewRecommendation | null;
  review_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type TStageReview = {
  id: string;
  stage_instance: string;
  reviewer: string;
  reviewer_detail?: TResearchUserLite;
  reviewer_role: TReviewerRole;
  recommendation: TReviewRecommendation;
  score: string | number | null;
  comment: string;
  revision_no: number;
  is_superseded: boolean;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  revisions?: TStageReviewRevision[];
};

export type TStageReviewRevision = {
  id: string;
  review: string;
  revision_no: number;
  recommendation: TReviewRecommendation;
  score: string | number | null;
  comment: string;
  reason: string;
  created_by: string | null;
  created_by_detail?: TResearchUserLite | null;
  created_at: string;
};

export type TReviewRules = {
  min_reviewers: number;
  pass_ratio: number;
  advisor_required: boolean;
  pi_branch_required: boolean;
  advisor_veto: boolean;
};

export type TReviewDecision = {
  passed: boolean;
  actual: number;
  required: number;
  detail: {
    min_reviewers: number;
    pass_ratio: number;
    pass_count: number;
    review_count: number;
    distribution: Record<TReviewRecommendation, number>;
    assignment_count: number;
    pending_required_roles: string[];
    rule_version: string;
    vetoed_by?: string;
  };
};

export type TReviewSummary = {
  stage: TStageType;
  stage_id: string;
  rules: TReviewRules;
  rule_sources: Record<string, string>;
  rule_version: string;
  decision: TReviewDecision;
  summary: Record<string, unknown>;
};

export type TToMeReview = {
  assignment_id: string;
  stage_id: string;
  stage: TStageType;
  project: string;
  project_name: string;
  reviewer_role: TReviewerRole;
  is_required: boolean;
  assignment_kind: TAssignmentKind;
  valid_until: string | null;
  submitted_at: string | null;
};
