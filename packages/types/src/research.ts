/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TOrgUnitType = "ROOT" | "INSTITUTE" | "LAB" | "GROUP" | "TEAM";
export type TOrgBusinessCategory = "BASIC_RESEARCH" | "INDUSTRIALIZATION" | "MENTOR_GROUP";
export type TOrgRole = "OWNER" | "PI" | "ADVISOR" | "REVIEWER" | "UNIT_ADMIN";
export type TAdminRole = "DEV_ADMIN" | "OPS_ADMIN" | "MAIN_PI";
export type TWorkspaceResearchPurpose = "GENERAL" | "PUBLIC_RESEARCH" | "PI_PRIVATE";
export type TInviteCodeStatus = "ACTIVE" | "DISABLED" | "EXPIRED" | "EXHAUSTED";
export type TUserImportRowStatus = "OK" | "PENDING" | "ERROR";
export type TUserImportBatchStatus = "PENDING" | "IMPORTED" | "FAILED";
export type TResearchProfileCategory = "STUDENT" | "POSTDOC" | "ADVISOR" | "PI" | "STAFF" | "OTHER";
export type TResearchProfileDegree = "MS" | "PHD" | "";
/**
 * Research visibility tier derived by the backend from the organisation tree,
 * mentor bindings, reviewer assignments and administrator tags (v2.5.0).
 * `NONE` means the account has no research relation yet: the research menu
 * stays hidden until an administrator assigns one.
 */
export type TResearchLevel = "ADMIN" | "PRINCIPAL" | "MENTOR" | "RESEARCHER" | "NONE";
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
  business_category: TOrgBusinessCategory | null;
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
  is_primary_advisor: boolean;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
};

export type TResearchOrgIncomplete = {
  missing_primary_org: TResearchUserLite[];
  missing_primary_advisor: TResearchUserLite[];
  unclassified_org_units: TOrgUnit[];
  counts: {
    missing_primary_org: number;
    missing_primary_advisor: number;
    unclassified_org_units: number;
  };
};

export type TWorkspaceResearchSetting = {
  id?: string;
  workspace?: string;
  purpose: TWorkspaceResearchPurpose;
  main_pi: string | null;
  required_reporter_categories: TResearchProfileCategory[];
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
  owner_detail?: TResearchUserLite;
  org_unit: string | null;
  research_type: TResearchProjectType;
  workflow_status: TResearchProjectStatus;
  started_at: string | null;
  expected_end_at: string | null;
  completed_at: string | null;
  is_active: boolean;
};

export type TReportOfficialContent = {
  version_no: number;
  description_json: Record<string, unknown>;
  description_html: string;
  description_stripped: string | null;
};

export type TReportDraftContent = Omit<TReportOfficialContent, "version_no">;

export type TPeriodicReport = {
  id: string;
  workspace: string;
  project: string | null;
  team_projects: string[];
  owner: string;
  owner_detail?: TResearchUserLite;
  org_unit: string | null;
  org_unit_detail?: Pick<TOrgUnit, "id" | "name" | "unit_type"> | null;
  page: string;
  /** Project that owns the Plane Page; null when the report is edited only in the research flow. */
  page_project: string | null;
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
  latest_official_version: number | null;
  /** Frozen submitted body returned to readers other than the author. */
  official_content: TReportOfficialContent | null;
  /** Current mutable Page body, returned only on the author's report detail. */
  draft_content: TReportDraftContent | null;
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
  /**
   * Which surfaces this caller may reach (v2.5.0). `nav` is already
   * intersected with `sections` by the backend, so the frontend only has to
   * filter the navigation constants by it. Older payloads may omit the field.
   */
  capabilities?: {
    level: TResearchLevel;
    nav: string[];
    is_mentor: boolean;
    is_main_pi: boolean;
    is_stage_reviewer: boolean;
    management: {
      workspace: boolean;
      organization: boolean;
      integrations: boolean;
      operations: boolean;
    };
  };
  user: {
    id: string;
    is_workspace_admin: boolean;
    /** Configuration rights: workspace administrator or administrator tag. */
    is_research_admin?: boolean;
    is_system_admin?: boolean;
    is_main_pi?: boolean;
    /** Visibility tier of this caller in this workspace (v2.5.0). */
    research_level?: TResearchLevel;
    admin_roles?: TAdminRole[];
    admin_role_catalog?: TAdminRole[];
    workspaces?: string[];
    is_research_owner: boolean;
    profile?: TResearchProfileCategory | null;
    student_no?: string | null;
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

export type TLiteratureStatus = "COLLECTED" | "SCREENED" | "INCLUDED" | "EXCLUDED";

export type TLiteratureEntry = {
  id: string;
  workspace: string;
  project: string;
  owner: string;
  owner_detail?: TResearchUserLite;
  title: string;
  authors: string;
  year: number | null;
  venue: string;
  doi: string;
  url: string;
  pdf_asset: string | null;
  summary: string;
  method_tags: string[];
  system_tags: string[];
  gap_notes: string;
  relevance_score: string | number | null;
  status: TLiteratureStatus;
  visibility: TReportVisibility;
  stage_instance: string | null;
  is_annotated: boolean;
  has_verifiable_source: boolean;
  created_at: string;
  updated_at: string;
};

export type TLiteratureCounters = {
  total: number;
  included: number;
  collected: number;
  screened: number;
  excluded: number;
  unannotated: string[];
  unannotated_count: number;
  unverifiable: string[];
  unverifiable_count: number;
};

export type TLiteratureThreshold = {
  project: string;
  threshold: { min_included: number; max_entries: number };
  counters: TLiteratureCounters;
  remaining: number;
  capacity: number;
};

export type TExperimentStatus = "PLANNED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | "ARCHIVED";
export type TExperimentSource = "MANUAL" | "AUTOMATED";
export type TAmendmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type TExperimentRecord = {
  id: string;
  workspace: string;
  project: string;
  sequence_no: number;
  stage_instance: string | null;
  title: string;
  objective: string;
  hypothesis: string;
  molecular_system: string;
  smiles: string;
  system_composition: string;
  method: string;
  parameters: Record<string, unknown>;
  environment: Record<string, unknown>;
  result: string;
  metrics: Record<string, unknown>;
  conclusion: string;
  failure_reason: string;
  status_note: string;
  status: TExperimentStatus;
  source: TExperimentSource;
  owner: string;
  owner_detail?: TResearchUserLite;
  started_at: string | null;
  completed_at: string | null;
  is_locked: boolean;
  submitted_at: string | null;
  current_version_no: number;
  visibility: TReportVisibility;
  locked_fields?: string[];
  amendable_fields?: string[];
  can_edit?: boolean;
  can_review?: boolean;
  versions?: TExperimentVersion[];
  amendments?: TExperimentAmendment[];
  assets?: TExperimentAssetLink[];
  created_at: string;
  updated_at: string;
};

export type TExperimentVersion = {
  id: string;
  record: string;
  version_no: number;
  snapshot: Record<string, unknown>;
  change_source: "SUBMIT" | "AMENDMENT" | "ADMIN_OVERRIDE";
  reason: string;
  created_at: string;
};

export type TAmendmentChange = { field: string; old?: unknown; new?: unknown };

export type TExperimentAmendment = {
  id: string;
  record: string;
  requested_by: string;
  requested_by_detail?: TResearchUserLite;
  reason: string;
  change_set: TAmendmentChange[];
  evidence_asset: string | null;
  status: TAmendmentStatus;
  reviewed_by: string | null;
  reviewed_by_detail?: TResearchUserLite | null;
  reviewed_at: string | null;
  review_comment: string;
  result_version: string | null;
  created_at: string;
  updated_at: string;
};

export type TExperimentAssetLink = {
  id: string;
  record: string;
  relation: "INPUT" | "OUTPUT" | "REFERENCE";
  source_system: string;
  external_asset_id: string;
  external_file_id: string;
  external_run_id: string;
  display_name: string;
  mime_type: string;
  size_bytes: number | null;
  external_url: string;
  last_verified_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type TCodeProvider = "GITHUB" | "GITLAB" | "GITEA" | "LOCAL_GIT" | "OTHER";
export type TCodeRepositoryStatus = "ACTIVE" | "ARCHIVED" | "SYNC_FAILED";
export type TCodeRefType = "COMMIT" | "BRANCH" | "TAG" | "SNAPSHOT";

export type TCodeRepository = {
  id: string;
  workspace: string;
  project: string;
  provider: TCodeProvider;
  repository_url: string;
  repository_slug: string;
  default_branch: string;
  visibility: "PUBLIC" | "INTERNAL" | "PRIVATE";
  status: TCodeRepositoryStatus;
  credential_ref: string;
  has_credential: boolean;
  last_synced_commit: string;
  last_sync_at: string | null;
  sync_error: string;
  artifact_count?: number;
  created_at: string;
  updated_at: string;
};

export type TCodeArtifact = {
  id: string;
  repository: string;
  ref_type: TCodeRefType;
  ref_value: string;
  commit_message: string;
  author_name: string;
  committed_at: string | null;
  snapshot_asset: string | null;
  linked_experiment: string | null;
  description: string;
  created_at: string;
  updated_at: string;
};

export type TCodeSummary = {
  project: string;
  repository_count: number;
  artifact_count: number;
  snapshot_count: number;
  linked_experiment_count: number;
  sync_failed_count: number;
  last_commit: {
    ref_value: string | null;
    message: string | null;
    author: string | null;
    committed_at: string | null;
  };
  snapshots: { id: string; ref_value: string; created_at: string }[];
};

export type TOutcomeType = "PAPER" | "PATENT" | "SOFTWARE" | "DATASET" | "AWARD" | "OTHER";
export type TOutcomeStatus = "DRAFT" | "SUBMITTED" | "ACCEPTED" | "PUBLISHED";

export type TResearchOutcomeLink = {
  id: string;
  outcome: string;
  target_type: "EXPERIMENT_RECORD" | "CODE_ARTIFACT" | "STAGE_MATERIAL" | "PERIODIC_REPORT";
  target_id: string;
  created_at: string;
};

export type TResearchOutcome = {
  id: string;
  workspace: string;
  project: string;
  output_type: TOutcomeType;
  title: string;
  authors: string[];
  venue: string;
  doi: string;
  external_url: string;
  file_asset: string | null;
  status: TOutcomeStatus;
  published_at: string | null;
  visibility: TReportVisibility;
  links: TResearchOutcomeLink[];
  created_at: string;
  updated_at: string;
};

export type TIntegrationSystem = "RAGPORTAL" | "WEKNORA" | "SPECLABOS" | "SMARTACCESS" | "POLY_AGENT" | "SPEC_AGENT";

export type TIntegrationConnection = {
  id?: string;
  system: TIntegrationSystem;
  display_name: string;
  base_url?: string;
  auth_mode?: "HMAC" | "BEARER" | "OIDC_CLIENT" | "NONE";
  credential_ref?: string;
  has_credential?: boolean;
  configured?: boolean;
  timeout_seconds?: number;
  cache_ttl_seconds?: number;
  degraded_mode?: "LINK_ONLY" | "HIDDEN";
  is_enabled: boolean;
  health_status?: "UNKNOWN" | "OK" | "DEGRADED" | "DOWN";
  last_health_at?: string | null;
  last_success_at?: string | null;
  last_error?: string;
};

export type TIntegrationCallLog = {
  id: string;
  system: TIntegrationSystem;
  operation: string;
  request_id: string;
  outcome: string;
  status_code: number | null;
  latency_ms: number | null;
  error_code: string;
  created_at: string;
};

export type TExternalReferenceLink = {
  id: string;
  reference: string;
  target_type: "PROJECT" | "STAGE_MATERIAL" | "LITERATURE_ENTRY" | "EXPERIMENT_RECORD" | "PERIODIC_REPORT" | "OUTCOME";
  target_id: string;
  created_at: string;
};

export type TExternalReference = {
  id: string;
  workspace: string;
  system: TIntegrationSystem;
  external_type: string;
  external_id: string;
  external_parent_id: string;
  title: string;
  summary: string;
  source_url: string;
  acl_hint: Record<string, unknown>;
  metadata: Record<string, unknown>;
  content_hash: string;
  synced_at: string | null;
  status: "ACTIVE" | "UNAVAILABLE" | "REVOKED" | "DEGRADED";
  links: TExternalReferenceLink[];
  created_at: string;
  updated_at: string;
};

export type TTimelineKind =
  | "literature"
  | "stage_transition"
  | "stage_review"
  | "report"
  | "experiment"
  | "code_artifact"
  | "outcome"
  | "external_reference";

export type TTimelineItem = {
  kind: TTimelineKind;
  at: string | null;
  title: string;
  chains: ("thinking" | "development")[];
  target_id?: string;
  stage?: TStageType;
  action?: string;
  recommendation?: string;
  status?: string;
  source_system?: string;
  external_type?: string;
  source_url?: string;
  degraded?: boolean;
};

export type TResearchTimeline = {
  project: string;
  items: TTimelineItem[];
  count: number;
  degraded_sources: string[];
  stage_sequence: TStageType[];
  generated_at: string;
};

export type TTimelineFilters = {
  chain?: string;
  stage?: string;
  date_from?: string;
  date_to?: string;
  source_system?: string;
};

// ---------------------------------------------------------------------------
// System management (v2.4.0): invite codes, roster import, PI aggregate
// ---------------------------------------------------------------------------

export type TInviteCode = {
  id: string;
  code: string;
  org_role: TOrgRole | "";
  org_unit: string | null;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  status: "ACTIVE" | "DISABLED";
  effective_status: TInviteCodeStatus;
  note: string;
  register_url: string;
  created_by: string | null;
  created_by_detail?: TResearchUserLite | null;
  created_at: string;
  updated_at: string;
};

export type TResearchUserProfile = {
  id: string;
  user: string;
  user_detail?: TResearchUserLite;
  student_no: string;
  grade: string;
  degree: TResearchProfileDegree;
  degree_label?: string;
  phone: string;
  category: TResearchProfileCategory;
  category_label?: string;
  group_label: string;
  source_batch: string | null;
  created_at: string;
  updated_at: string;
};

export type TUserImportRow = {
  id: string;
  batch: string;
  row_number: number;
  status: TUserImportRowStatus;
  message: string;
  display_name: string;
  email: string;
  student_no: string;
  group_label: string;
  advisor_name: string;
  user: string | null;
  user_detail?: TResearchUserLite | null;
  org_unit: string | null;
  raw: Record<string, string>;
  created_at: string;
};

export type TUserImportBatch = {
  id: string;
  source_filename: string;
  dry_run: boolean;
  status: TUserImportBatchStatus;
  rows_total: number;
  rows_ok: number;
  rows_pending: number;
  rows_error: number;
  options: Record<string, unknown>;
  summary: { dry_run?: boolean; groups?: string[]; credentials_issued?: number };
  created_by_detail?: TResearchUserLite | null;
  created_at: string;
  rows?: TUserImportRow[];
};

export type TUserImportBatchSummary = Omit<TUserImportBatch, "rows" | "options" | "created_by_detail">;

export type TPiAggregate = {
  workspace: { slug: string; name: string };
  source_workspace: { slug: string; name: string };
  is_system_admin: boolean;
  scope: { unit_ids: string[]; unit_count: number; owner_ids?: string[]; is_empty: boolean };
  filters: { org_unit?: string; owner?: string; date_from?: string; date_to?: string };
  drilldowns: {
    projects: { org_unit?: string; owner?: string; date_from?: string; date_to?: string };
    reports: { org_unit?: string; owner?: string; date_from?: string; date_to?: string };
  };
  projects: { total: number; by_status: Record<string, number> };
  reports: {
    total: number;
    by_status: Record<string, number>;
    submitted_last_30_days: number;
    not_submitted: number;
  };
  stages: { total: number; by_status: Record<string, number>; blocked_gates: number };
  reviews: { awaiting_stages: number; open_assignments: number; submitted: number };
  approvals: { pending: number };
  members?: { total: number };
  outcomes?: {
    total: number;
    recent: { id: string; title: string; published_at: string | null }[];
  };
  org_units: { id: string; name: string; depth: number; unit_type: TOrgUnitType }[];
  generated_at: string;
};

export type TResearchContextResource = {
  kind: string;
  id: string | null;
  title: string;
  status: string | null;
  owner: string | null;
  project: string;
  source: string;
  updated_at: string | null;
  version: number | null;
  link: string;
};

export type TResearchContext = {
  schema_version: string;
  generated_at: string;
  workspace: { id: string; slug: string; name: string };
  scope: {
    actor: string;
    project_id: string | null;
    business_records_mutated: false;
  };
  pagination: {
    /** Project-level pagination; resources also contain authorised children of each project. */
    page: number;
    page_size: number;
    total: number;
    has_more: boolean;
  };
  resources: TResearchContextResource[];
};
