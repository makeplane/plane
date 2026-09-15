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
  org_unit: string | null;
  org_unit_name: string | null;
  counts: TReportSummaryCounts;
  pending_members: TResearchUserLite[];
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
