/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type {
  TApprovalRequestStatus,
  TApprovalType,
  TOrgRole,
  TOrgUnitType,
  TReportStatus,
  TReportType,
  TReportVisibility,
  TResearchProjectStatus,
  TResearchProjectType,
  TStageGateResult,
  TStageMaterialChangeSource,
  TStageMaterialStatus,
  TStageRequirementType,
  TStageStatus,
  TStageTransitionAction,
  TStageType,
} from "@plane/types";

export type {
  TApprovalRequestStatus,
  TApprovalType,
  TOrgRole,
  TOrgUnitType,
  TReportStatus,
  TReportType,
  TReportVisibility,
  TResearchProjectStatus,
  TResearchProjectType,
  TStageGate,
  TStageGateItem,
  TStageGatePhase,
  TStageGateResult,
  TStageInstance,
  TStageMaterial,
  TStageMaterialStatus,
  TStageMaterialVersion,
  TStageReview,
  TStageReviewerAssignment,
  TStageReviewRevision,
  TStageRequirement,
  TStageRequirementType,
  TStageStatus,
  TStageTransition,
  TStageTransitionAction,
  TStageType,
  TReviewDecision,
  TReviewRecommendation,
  TReviewRules,
  TReviewSummary,
  TReviewerRole,
  TToMeReview,
  TLiteratureCounters,
  TLiteratureEntry,
  TLiteratureStatus,
  TLiteratureThreshold,
  TAmendmentStatus,
  TExperimentAmendment,
  TExperimentAssetLink,
  TExperimentRecord,
  TExperimentSource,
  TExperimentStatus,
  TExperimentVersion,
  TCodeArtifact,
  TCodeProvider,
  TCodeRefType,
  TCodeRepository,
  TCodeRepositoryStatus,
  TCodeSummary,
} from "@plane/types";

export const ORG_UNIT_TYPES = ["ROOT", "INSTITUTE", "LAB", "GROUP", "TEAM"] as const satisfies readonly TOrgUnitType[];

export const ORG_UNIT_CHILD_TYPES = ["INSTITUTE", "LAB", "GROUP", "TEAM"] as const;

export const ORG_ROLES = ["OWNER", "PI", "ADVISOR", "REVIEWER", "UNIT_ADMIN"] as const satisfies readonly TOrgRole[];

export const REPORT_TYPES = ["WEEKLY", "MONTHLY"] as const satisfies readonly TReportType[];

export const REPORT_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "NEEDS_REVISION",
  "ACCEPTED",
] as const satisfies readonly TReportStatus[];

export const REPORT_VISIBILITIES = [
  "PRIVATE",
  "DIRECT_ADVISOR",
  "UNIT",
  "ANCESTRY",
  "WORKSPACE",
  "CUSTOM",
] as const satisfies readonly TReportVisibility[];

/**
 * Visibility breadth, from the narrowest to the widest scope. Authors may only
 * narrow the workspace default (P0-ACL-04), so the index doubles as the
 * comparison key in the UI.
 */
export const REPORT_VISIBILITY_ORDER: Record<TReportVisibility, number> = {
  PRIVATE: 0,
  DIRECT_ADVISOR: 1,
  UNIT: 2,
  ANCESTRY: 3,
  WORKSPACE: 4,
  CUSTOM: 5,
};

export const ORGANISATION_ROLE_LABELS: Record<TOrgRole, string> = {
  OWNER: "research.roles.owner",
  PI: "research.roles.pi",
  ADVISOR: "research.roles.advisor",
  REVIEWER: "research.roles.reviewer",
  UNIT_ADMIN: "research.roles.unit_admin",
};

export const ORG_UNIT_TYPE_LABELS: Record<TOrgUnitType, string> = {
  ROOT: "research.org_types.root",
  INSTITUTE: "research.org_types.institute",
  LAB: "research.org_types.lab",
  GROUP: "research.org_types.group",
  TEAM: "research.org_types.team",
};

export const REPORT_TYPE_LABELS: Record<TReportType, string> = {
  WEEKLY: "research.report_types.weekly",
  MONTHLY: "research.report_types.monthly",
};

export const REPORT_STATUS_LABELS: Record<TReportStatus, string> = {
  DRAFT: "research.report_status.draft",
  SUBMITTED: "research.report_status.submitted",
  NEEDS_REVISION: "research.report_status.needs_revision",
  ACCEPTED: "research.report_status.accepted",
};

export const REPORT_VISIBILITY_LABELS: Record<TReportVisibility, string> = {
  PRIVATE: "research.report_visibility.private",
  DIRECT_ADVISOR: "research.report_visibility.direct_advisor",
  UNIT: "research.report_visibility.unit",
  ANCESTRY: "research.report_visibility.ancestry",
  WORKSPACE: "research.report_visibility.workspace",
  CUSTOM: "research.report_visibility.custom",
};

export const RESEARCH_PROJECT_TYPES = [
  "PHD",
  "MASTER",
  "POSTDOC",
  "RESEARCH_PROJECT",
] as const satisfies readonly TResearchProjectType[];

export const RESEARCH_PROJECT_TYPE_LABELS: Record<TResearchProjectType, string> = {
  PHD: "research.project_types.phd",
  MASTER: "research.project_types.master",
  POSTDOC: "research.project_types.postdoc",
  RESEARCH_PROJECT: "research.project_types.research_project",
};

export const RESEARCH_PROJECT_STATUSES = [
  "ACTIVE",
  "ARCHIVED",
  "COMPLETED",
] as const satisfies readonly TResearchProjectStatus[];

export const RESEARCH_PROJECT_STATUS_LABELS: Record<TResearchProjectStatus, string> = {
  ACTIVE: "research.project_status.active",
  ARCHIVED: "research.project_status.archived",
  COMPLETED: "research.project_status.completed",
};

export const APPROVAL_TYPES = ["TASK", "PURCHASE", "CUSTOM"] as const satisfies readonly TApprovalType[];

export const APPROVAL_TYPE_LABELS: Record<TApprovalType, string> = {
  TASK: "research.approval_types.task",
  PURCHASE: "research.approval_types.purchase",
  CUSTOM: "research.approval_types.custom",
};

export const APPROVAL_REQUEST_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
  "CANCELLED",
] as const satisfies readonly TApprovalRequestStatus[];

export const APPROVAL_REQUEST_STATUS_LABELS: Record<TApprovalRequestStatus, string> = {
  PENDING: "research.approval_status.pending",
  APPROVED: "research.approval_status.approved",
  REJECTED: "research.approval_status.rejected",
  WITHDRAWN: "research.approval_status.withdrawn",
  CANCELLED: "research.approval_status.cancelled",
};

/** Organisation roles that may be used as an approval step approver. */
export const APPROVAL_FLOW_STEP_ROLES = ["PI", "OWNER", "UNIT_ADMIN", "ADVISOR", "REVIEWER"] as const;

/** Research navigation tree - rendered only when the workspace switch is on. */
export const RESEARCH_NAVIGATION_ITEMS = [
  { key: "reports", labelKey: "research.nav.reports", path: "reports", section: "reports" },
  { key: "summary", labelKey: "research.nav.summary", path: "reports/summary", section: "reports" },
  { key: "projects", labelKey: "research.nav.projects", path: "projects", section: "reports" },
  { key: "reviews", labelKey: "research.nav.reviews", path: "reviews", section: "stages" },
  { key: "approvals", labelKey: "research.nav.approvals", path: "approvals", section: "approvals" },
] as const;

// ---------------------------------------------------------------------------
// P1 stage workflow (§3.1, §4.2)
// ---------------------------------------------------------------------------

export const STAGE_TYPES = ["PRE_OPENING", "OPENING", "MIDTERM", "FINAL"] as const satisfies readonly TStageType[];

export const STAGE_TYPE_LABELS: Record<TStageType, string> = {
  PRE_OPENING: "research.stages.type.pre_opening",
  OPENING: "research.stages.type.opening",
  MIDTERM: "research.stages.type.midterm",
  FINAL: "research.stages.type.final",
};

export const STAGE_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "SUBMITTED",
  "NEEDS_REVISION",
  "PASSED",
] as const satisfies readonly TStageStatus[];

export const STAGE_STATUS_LABELS: Record<TStageStatus, string> = {
  NOT_STARTED: "research.stages.status.not_started",
  IN_PROGRESS: "research.stages.status.in_progress",
  SUBMITTED: "research.stages.status.submitted",
  NEEDS_REVISION: "research.stages.status.needs_revision",
  PASSED: "research.stages.status.passed",
};

export const STAGE_GATE_RESULTS = ["PASS", "BLOCKED", "WAIVED"] as const satisfies readonly TStageGateResult[];

export const STAGE_GATE_RESULT_LABELS: Record<TStageGateResult, string> = {
  PASS: "research.stages.gate_result.pass",
  BLOCKED: "research.stages.gate_result.blocked",
  WAIVED: "research.stages.gate_result.waived",
};

export const STAGE_TRANSITION_ACTIONS = [
  "ENTER",
  "SUBMIT",
  "RETURN",
  "PASS",
  "REOPEN",
  "OVERRIDE",
] as const satisfies readonly TStageTransitionAction[];

export const STAGE_TRANSITION_ACTION_LABELS: Record<TStageTransitionAction, string> = {
  ENTER: "research.stages.action.enter",
  SUBMIT: "research.stages.action.submit",
  RETURN: "research.stages.action.return",
  PASS: "research.stages.action.pass",
  REOPEN: "research.stages.action.reopen",
  OVERRIDE: "research.stages.action.override",
};

export const STAGE_MATERIAL_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "ACCEPTED",
  "REJECTED",
] as const satisfies readonly TStageMaterialStatus[];

export const STAGE_MATERIAL_STATUS_LABELS: Record<TStageMaterialStatus, string> = {
  DRAFT: "research.stages.material_status.draft",
  SUBMITTED: "research.stages.material_status.submitted",
  ACCEPTED: "research.stages.material_status.accepted",
  REJECTED: "research.stages.material_status.rejected",
};

export const STAGE_MATERIAL_CHANGE_SOURCE_LABELS: Record<TStageMaterialChangeSource, string> = {
  MANUAL: "research.stages.change_source.manual",
  ADMIN_OVERRIDE: "research.stages.change_source.admin_override",
  STAGE_REOPEN: "research.stages.change_source.stage_reopen",
};

export const STAGE_REQUIREMENT_TYPES = [
  "MANUAL",
  "LITERATURE_COUNT",
  "EXPERIMENT_LINKED",
  "CODE_REPO",
  "OUTCOME_COUNT",
  "MATERIAL_SET",
  "REVIEW_RULE",
] as const satisfies readonly TStageRequirementType[];

/**
 * Material set per stage (§4.2). The order is the display order of the
 * checklist and the canonical order of the material set.
 */
export const STAGE_MATERIAL_TYPES: Record<TStageType, readonly string[]> = {
  PRE_OPENING: ["TOPIC_DESCRIPTION", "GAP_ANALYSIS"],
  OPENING: [
    "RESEARCH_QUESTION",
    "LITERATURE_REVIEW",
    "HYPOTHESIS",
    "TECHNICAL_ROUTE",
    "EXPERIMENT_DESIGN",
    "DATA_AND_METRICS",
    "TIME_PLAN",
    "RISK_AND_BACKUP",
    "CODE_PLAN",
    "EXPERIMENT_RECORD_PLAN",
  ],
  MIDTERM: [
    "GOAL_COMPLETION",
    "COMPLETED_EXPERIMENTS",
    "FAILED_EXPERIMENTS",
    "DATA_SUMMARY",
    "CODE_PROGRESS",
    "PAPER_PROGRESS",
    "RISK_ADJUSTMENT",
  ],
  FINAL: [
    "FINAL_REPORT",
    "THESIS_OR_OUTPUT",
    "FULL_RESEARCH_CHAIN",
    "EXPERIMENT_SUMMARY",
    "CODE_AND_SNAPSHOT",
    "DATA_AND_ATTACHMENT_LIST",
    "ADVISOR_OPINION",
  ],
};

/** Material labels resolve through i18n: `research.stages.material.<code>`. */
export const stageMaterialLabelKey = (materialType: string) => `research.stages.material.${materialType.toLowerCase()}`;

/** Project scoped research navigation (P1-UI-01). Grows stage by stage. */
export const RESEARCH_PROJECT_NAVIGATION_ITEMS = [
  { key: "stages", labelKey: "research.nav.stages", path: "stages", section: "stages" },
  { key: "literature", labelKey: "research.nav.literature", path: "literature", section: "stages" },
  { key: "experiments", labelKey: "research.nav.experiments", path: "experiments", section: "experiments" },
  { key: "code", labelKey: "research.nav.code", path: "code", section: "code" },
] as const;

// ---------------------------------------------------------------------------
// P1 code registration (§3.8, §4.6)
// ---------------------------------------------------------------------------

export const CODE_PROVIDERS = [
  "GITHUB",
  "GITLAB",
  "GITEA",
  "LOCAL_GIT",
  "OTHER",
] as const satisfies readonly TCodeProvider[];

export const CODE_PROVIDER_LABELS: Record<TCodeProvider, string> = {
  GITHUB: "research.code.provider.github",
  GITLAB: "research.code.provider.gitlab",
  GITEA: "research.code.provider.gitea",
  LOCAL_GIT: "research.code.provider.local_git",
  OTHER: "research.code.provider.other",
};

export const CODE_REPOSITORY_STATUS_LABELS: Record<TCodeRepositoryStatus, string> = {
  ACTIVE: "research.code.status.active",
  ARCHIVED: "research.code.status.archived",
  SYNC_FAILED: "research.code.status.sync_failed",
};

export const CODE_REF_TYPES = ["COMMIT", "BRANCH", "TAG", "SNAPSHOT"] as const satisfies readonly TCodeRefType[];

export const CODE_REF_TYPE_LABELS: Record<TCodeRefType, string> = {
  COMMIT: "research.code.ref_type.commit",
  BRANCH: "research.code.ref_type.branch",
  TAG: "research.code.ref_type.tag",
  SNAPSHOT: "research.code.ref_type.snapshot",
};

// ---------------------------------------------------------------------------
// P1 experiment records (§3.7, §4.5)
// ---------------------------------------------------------------------------

export const EXPERIMENT_STATUSES = [
  "PLANNED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "ARCHIVED",
] as const satisfies readonly TExperimentStatus[];

export const EXPERIMENT_STATUS_LABELS: Record<TExperimentStatus, string> = {
  PLANNED: "research.experiments.status.planned",
  RUNNING: "research.experiments.status.running",
  COMPLETED: "research.experiments.status.completed",
  FAILED: "research.experiments.status.failed",
  CANCELLED: "research.experiments.status.cancelled",
  ARCHIVED: "research.experiments.status.archived",
};

export const EXPERIMENT_SOURCE_LABELS: Record<TExperimentSource, string> = {
  MANUAL: "research.experiments.source.manual",
  AUTOMATED: "research.experiments.source.automated",
};

export const AMENDMENT_STATUS_LABELS: Record<TAmendmentStatus, string> = {
  PENDING: "research.experiments.amendment_status.pending",
  APPROVED: "research.experiments.amendment_status.approved",
  REJECTED: "research.experiments.amendment_status.rejected",
  CANCELLED: "research.experiments.amendment_status.cancelled",
};

export const EXPERIMENT_ASSET_SYSTEM_LABELS: Record<string, string> = {
  PLANE: "research.experiments.asset_system.plane",
  SPECLABOS: "research.experiments.asset_system.speclabos",
  SMARTACCESS: "research.experiments.asset_system.smartaccess",
  RAGPORTAL: "research.experiments.asset_system.ragportal",
  POLY_AGENT: "research.experiments.asset_system.poly_agent",
  SPEC_AGENT: "research.experiments.asset_system.spec_agent",
  OTHER: "research.experiments.asset_system.other",
};

// ---------------------------------------------------------------------------
// P1 literature collection (§3.3, §4.4)
// ---------------------------------------------------------------------------

export const LITERATURE_STATUSES = [
  "COLLECTED",
  "SCREENED",
  "INCLUDED",
  "EXCLUDED",
] as const satisfies readonly TLiteratureStatus[];

export const LITERATURE_STATUS_LABELS: Record<TLiteratureStatus, string> = {
  COLLECTED: "research.literature.status.collected",
  SCREENED: "research.literature.status.screened",
  INCLUDED: "research.literature.status.included",
  EXCLUDED: "research.literature.status.excluded",
};

// ---------------------------------------------------------------------------
// P1 multi reviewer flow (§3.2, §4.3)
// ---------------------------------------------------------------------------

export const REVIEW_RECOMMENDATIONS = ["PASS", "REJECT", "REVISE"] as const satisfies readonly TReviewRecommendation[];

export const REVIEW_RECOMMENDATION_LABELS: Record<TReviewRecommendation, string> = {
  PASS: "research.reviews.recommendation.pass",
  REJECT: "research.reviews.recommendation.reject",
  REVISE: "research.reviews.recommendation.revise",
};

export const REVIEWER_ROLES = [
  "DIRECT_ADVISOR",
  "PI",
  "REVIEWER",
  "UNIT_ADMIN",
] as const satisfies readonly TReviewerRole[];

export const REVIEWER_ROLE_LABELS: Record<TReviewerRole, string> = {
  DIRECT_ADVISOR: "research.reviews.role.direct_advisor",
  PI: "research.reviews.role.pi",
  REVIEWER: "research.reviews.role.reviewer",
  UNIT_ADMIN: "research.reviews.role.unit_admin",
};

export const ASSIGNMENT_KIND_LABELS: Record<string, string> = {
  AUTO: "research.reviews.assignment_kind.auto",
  MANUAL: "research.reviews.assignment_kind.manual",
  DELEGATED: "research.reviews.assignment_kind.delegated",
};

export const RESEARCH_SETTINGS_NAVIGATION_ITEMS = [
  { key: "org", labelKey: "research.nav.org_settings", path: "settings/org", section: "org" },
  { key: "templates", labelKey: "research.nav.templates", path: "settings/templates", section: "reports" },
  { key: "identity", labelKey: "research.nav.identity", path: "settings/identity", section: "org" },
  { key: "platform", labelKey: "research.nav.platform", path: "settings/platform", section: "org" },
  { key: "audit", labelKey: "research.nav.audit", path: "audit", section: "org" },
] as const;

const RESEARCH_API_ROOT = "/api/research/workspaces";

export const researchEndpoints = {
  health: () => "/api/research/health/",
  settings: (slug: string) => `${RESEARCH_API_ROOT}/${slug}/settings/`,
  identityMe: (slug: string) => `${RESEARCH_API_ROOT}/${slug}/identity/me/`,
  identityMappings: (slug: string) => `${RESEARCH_API_ROOT}/${slug}/identity/mappings/`,
  identityMapping: (slug: string, id: string) => `${RESEARCH_API_ROOT}/${slug}/identity/mappings/${id}/`,
  orgUnits: (slug: string) => `${RESEARCH_API_ROOT}/${slug}/org-units/`,
  orgUnit: (slug: string, id: string) => `${RESEARCH_API_ROOT}/${slug}/org-units/${id}/`,
  orgUnitMembers: (slug: string, unitId: string) => `${RESEARCH_API_ROOT}/${slug}/org-units/${unitId}/members/`,
  orgUnitMember: (slug: string, unitId: string, memberId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/org-units/${unitId}/members/${memberId}/`,
  orgUnitPi: (slug: string, unitId: string) => `${RESEARCH_API_ROOT}/${slug}/org-units/${unitId}/pi/`,
  mentors: (slug: string) => `${RESEARCH_API_ROOT}/${slug}/mentors/`,
  mentor: (slug: string, id: string) => `${RESEARCH_API_ROOT}/${slug}/mentors/${id}/`,
  projects: (slug: string) => `${RESEARCH_API_ROOT}/${slug}/projects/`,
  project: (slug: string, projectId: string) => `${RESEARCH_API_ROOT}/${slug}/projects/${projectId}/`,
  projectArchive: (slug: string, projectId: string) => `${RESEARCH_API_ROOT}/${slug}/projects/${projectId}/archive/`,
  projectRestore: (slug: string, projectId: string) => `${RESEARCH_API_ROOT}/${slug}/projects/${projectId}/restore/`,
  reports: (slug: string) => `${RESEARCH_API_ROOT}/${slug}/reports/`,
  report: (slug: string, reportId: string) => `${RESEARCH_API_ROOT}/${slug}/reports/${reportId}/`,
  reportSubmit: (slug: string, reportId: string) => `${RESEARCH_API_ROOT}/${slug}/reports/${reportId}/submit/`,
  reportReturn: (slug: string, reportId: string) => `${RESEARCH_API_ROOT}/${slug}/reports/${reportId}/return/`,
  reportAccept: (slug: string, reportId: string) => `${RESEARCH_API_ROOT}/${slug}/reports/${reportId}/accept/`,
  reportHistory: (slug: string, reportId: string) => `${RESEARCH_API_ROOT}/${slug}/reports/${reportId}/history/`,
  reportAccess: (slug: string, reportId: string) => `${RESEARCH_API_ROOT}/${slug}/reports/${reportId}/access/`,
  reportAttachments: (slug: string, reportId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/reports/${reportId}/attachments/`,
  reportAttachment: (slug: string, reportId: string, attachmentId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/reports/${reportId}/attachments/${attachmentId}/`,
  reportImportMarkdown: (slug: string, reportId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/reports/${reportId}/import-markdown/`,
  reportSummary: (slug: string) => `${RESEARCH_API_ROOT}/${slug}/reports/summary/`,
  reportTemplates: (slug: string) => `${RESEARCH_API_ROOT}/${slug}/report-templates/`,
  reportTemplate: (slug: string, id: string) => `${RESEARCH_API_ROOT}/${slug}/report-templates/${id}/`,
  approvalFlows: (slug: string) => `${RESEARCH_API_ROOT}/${slug}/approval-flows/`,
  approvalFlow: (slug: string, id: string) => `${RESEARCH_API_ROOT}/${slug}/approval-flows/${id}/`,
  approvalRequests: (slug: string) => `${RESEARCH_API_ROOT}/${slug}/approval-requests/`,
  approvalRequest: (slug: string, id: string) => `${RESEARCH_API_ROOT}/${slug}/approval-requests/${id}/`,
  approvalRequestApprove: (slug: string, id: string) => `${RESEARCH_API_ROOT}/${slug}/approval-requests/${id}/approve/`,
  approvalRequestReject: (slug: string, id: string) => `${RESEARCH_API_ROOT}/${slug}/approval-requests/${id}/reject/`,
  approvalRequestWithdraw: (slug: string, id: string) =>
    `${RESEARCH_API_ROOT}/${slug}/approval-requests/${id}/withdraw/`,
  approvalRequestHistory: (slug: string, id: string) => `${RESEARCH_API_ROOT}/${slug}/approval-requests/${id}/history/`,
  auditEvents: (slug: string) => `${RESEARCH_API_ROOT}/${slug}/audit-events/`,
  // ---- P1 stage workflow (§5.2) ----
  projectStages: (slug: string, projectId: string) => `${RESEARCH_API_ROOT}/${slug}/projects/${projectId}/stages/`,
  stage: (slug: string, stageId: string) => `${RESEARCH_API_ROOT}/${slug}/stages/${stageId}/`,
  stageEnter: (slug: string, stageId: string) => `${RESEARCH_API_ROOT}/${slug}/stages/${stageId}/enter/`,
  stageSubmit: (slug: string, stageId: string) => `${RESEARCH_API_ROOT}/${slug}/stages/${stageId}/submit/`,
  stageReturn: (slug: string, stageId: string) => `${RESEARCH_API_ROOT}/${slug}/stages/${stageId}/return/`,
  stagePass: (slug: string, stageId: string) => `${RESEARCH_API_ROOT}/${slug}/stages/${stageId}/pass/`,
  stageReopen: (slug: string, stageId: string) => `${RESEARCH_API_ROOT}/${slug}/stages/${stageId}/reopen/`,
  stageGate: (slug: string, stageId: string) => `${RESEARCH_API_ROOT}/${slug}/stages/${stageId}/gate/`,
  stageTransitions: (slug: string, stageId: string) => `${RESEARCH_API_ROOT}/${slug}/stages/${stageId}/transitions/`,
  stageMaterials: (slug: string, stageId: string) => `${RESEARCH_API_ROOT}/${slug}/stages/${stageId}/materials/`,
  material: (slug: string, materialId: string) => `${RESEARCH_API_ROOT}/${slug}/materials/${materialId}/`,
  materialSubmit: (slug: string, materialId: string) => `${RESEARCH_API_ROOT}/${slug}/materials/${materialId}/submit/`,
  materialVersions: (slug: string, materialId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/materials/${materialId}/versions/`,
  stageRequirements: (slug: string) => `${RESEARCH_API_ROOT}/${slug}/stage-requirements/`,
  stageRequirement: (slug: string, requirementId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/stage-requirements/${requirementId}/`,
  // ---- P1 review flow (§5.3) ----
  stageReviewers: (slug: string, stageId: string) => `${RESEARCH_API_ROOT}/${slug}/stages/${stageId}/reviewers/`,
  reviewer: (slug: string, assignmentId: string) => `${RESEARCH_API_ROOT}/${slug}/reviewers/${assignmentId}/`,
  reviewerRemind: (slug: string, assignmentId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/reviewers/${assignmentId}/remind/`,
  stageReviews: (slug: string, stageId: string) => `${RESEARCH_API_ROOT}/${slug}/stages/${stageId}/reviews/`,
  stageReviewSummary: (slug: string, stageId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/stages/${stageId}/review-summary/`,
  reviews: (slug: string) => `${RESEARCH_API_ROOT}/${slug}/reviews/`,
  review: (slug: string, reviewId: string) => `${RESEARCH_API_ROOT}/${slug}/reviews/${reviewId}/`,
  reviewRevise: (slug: string, reviewId: string) => `${RESEARCH_API_ROOT}/${slug}/reviews/${reviewId}/revise/`,
  reviewRevisions: (slug: string, reviewId: string) => `${RESEARCH_API_ROOT}/${slug}/reviews/${reviewId}/revisions/`,
  // ---- P1 literature (§5.4) ----
  literature: (slug: string, projectId: string) => `${RESEARCH_API_ROOT}/${slug}/projects/${projectId}/literature/`,
  literatureThreshold: (slug: string, projectId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/projects/${projectId}/literature/threshold/`,
  literatureImport: (slug: string, projectId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/projects/${projectId}/literature/import/`,
  literatureEntry: (slug: string, entryId: string) => `${RESEARCH_API_ROOT}/${slug}/literature/${entryId}/`,
  literatureStatus: (slug: string, entryId: string) => `${RESEARCH_API_ROOT}/${slug}/literature/${entryId}/status/`,
  literaturePdf: (slug: string, entryId: string) => `${RESEARCH_API_ROOT}/${slug}/literature/${entryId}/pdf/`,
  // ---- P1 experiment records (§5.5) ----
  experiments: (slug: string, projectId: string) => `${RESEARCH_API_ROOT}/${slug}/projects/${projectId}/experiments/`,
  experiment: (slug: string, recordId: string) => `${RESEARCH_API_ROOT}/${slug}/experiments/${recordId}/`,
  experimentStatus: (slug: string, recordId: string) => `${RESEARCH_API_ROOT}/${slug}/experiments/${recordId}/status/`,
  experimentSubmit: (slug: string, recordId: string) => `${RESEARCH_API_ROOT}/${slug}/experiments/${recordId}/submit/`,
  experimentArchive: (slug: string, recordId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/experiments/${recordId}/archive/`,
  experimentVersions: (slug: string, recordId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/experiments/${recordId}/versions/`,
  experimentAssets: (slug: string, recordId: string) => `${RESEARCH_API_ROOT}/${slug}/experiments/${recordId}/assets/`,
  experimentAsset: (slug: string, linkId: string) => `${RESEARCH_API_ROOT}/${slug}/experiment-assets/${linkId}/`,
  experimentAmendments: (slug: string, recordId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/experiments/${recordId}/amendments/`,
  amendment: (slug: string, amendmentId: string) => `${RESEARCH_API_ROOT}/${slug}/amendments/${amendmentId}/`,
  amendmentAction: (slug: string, amendmentId: string, action: string) =>
    `${RESEARCH_API_ROOT}/${slug}/amendments/${amendmentId}/${action}/`,
  // ---- P1 code registration (§5.6) ----
  codeRepositories: (slug: string, projectId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/projects/${projectId}/code-repositories/`,
  codeSummary: (slug: string, projectId: string) => `${RESEARCH_API_ROOT}/${slug}/projects/${projectId}/code-summary/`,
  codeRepository: (slug: string, repositoryId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/code-repositories/${repositoryId}/`,
  codeRepositorySync: (slug: string, repositoryId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/code-repositories/${repositoryId}/sync/`,
  codeArtifacts: (slug: string, repositoryId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/code-repositories/${repositoryId}/artifacts/`,
  codeSnapshots: (slug: string, repositoryId: string) =>
    `${RESEARCH_API_ROOT}/${slug}/code-repositories/${repositoryId}/snapshots/`,
  codeArtifact: (slug: string, artifactId: string) => `${RESEARCH_API_ROOT}/${slug}/code-artifacts/${artifactId}/`,
} as const;
