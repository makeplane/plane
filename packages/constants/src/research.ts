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

/** Research navigation tree - rendered only when the workspace switch is on. */
export const RESEARCH_NAVIGATION_ITEMS = [
  { key: "reports", labelKey: "research.nav.reports", path: "reports", section: "reports" },
  { key: "summary", labelKey: "research.nav.summary", path: "reports/summary", section: "reports" },
  { key: "projects", labelKey: "research.nav.projects", path: "projects", section: "reports" },
  { key: "approvals", labelKey: "research.nav.approvals", path: "approvals", section: "approvals" },
] as const;

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
} as const;
