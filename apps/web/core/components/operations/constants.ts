/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Display vocabulary for the Engineering Operations screens.
 *
 * The machine values live on the Django side; these are only the human labels
 * and the colours. Kept out of the components so a status rendered in a list,
 * a detail header and a dashboard tile cannot drift into three different words
 * for the same state.
 */

import type {
  TDeploymentEnvironment,
  TDeploymentStatus,
  TOperationsRecordType,
  TOperationsTicketPriority,
  TOperationsTicketSource,
  TOperationsTicketStatus,
  TReportType,
} from "@/services/operations";

export const TICKET_STATUS_LABEL: Record<TOperationsTicketStatus, string> = {
  new: "New",
  pm_review: "PM review",
  need_info: "Need more information",
  approved: "Approved",
  converted: "Converted",
  rejected: "Rejected",
  closed: "Closed",
};

/** Tailwind classes rather than raw colours, so both themes are handled. */
export const TICKET_STATUS_CLASS: Record<TOperationsTicketStatus, string> = {
  new: "bg-layer-3 text-secondary",
  pm_review: "bg-accent-primary/10 text-accent-primary",
  need_info: "bg-warning-primary/10 text-warning-primary",
  approved: "bg-success-primary/10 text-success-primary",
  converted: "bg-success-primary/15 text-success-primary",
  rejected: "bg-danger-primary/10 text-danger-primary",
  closed: "bg-layer-3 text-placeholder",
};

/**
 * The lifecycle graph, mirrored from `ALLOWED_TRANSITIONS` in
 * `workspaces/app/views/operations/ticket.py`.
 *
 * Used only to decide which buttons to draw. The API is still the authority --
 * it refuses an illegal move whatever this table says, which is what keeps a
 * stale tab from corrupting a ticket.
 */
export const TICKET_TRANSITIONS: Record<TOperationsTicketStatus, TOperationsTicketStatus[]> = {
  new: ["pm_review", "need_info", "rejected"],
  pm_review: ["need_info", "approved", "rejected"],
  need_info: ["pm_review", "approved", "rejected"],
  approved: ["need_info", "rejected"],
  converted: ["closed"],
  rejected: ["closed"],
  closed: [],
};

export const TICKET_SOURCE_LABEL: Record<TOperationsTicketSource, string> = {
  sales: "Sales",
  operations: "Operations",
  qa: "QA",
  management: "Management",
  customer: "Customer",
  internal: "Internal",
};

export const PRIORITY_LABEL: Record<TOperationsTicketPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
};

export const PRIORITY_CLASS: Record<TOperationsTicketPriority, string> = {
  urgent: "bg-danger-primary/15 text-danger-primary",
  high: "bg-warning-primary/15 text-warning-primary",
  medium: "bg-accent-primary/10 text-accent-primary",
  low: "bg-layer-3 text-secondary",
  none: "bg-layer-3 text-placeholder",
};

export const RECORD_TYPE_LABEL: Record<TOperationsRecordType, string> = {
  incident: "Incident report",
  outage: "Production outage",
  adr: "Architecture decision",
  meeting_notes: "Meeting notes",
  rca: "RCA document",
  vendor_meeting: "Vendor meeting",
  client_meeting: "Client meeting",
  deployment_record: "Deployment record",
  infra_change: "Infrastructure change",
  security_finding: "Security finding",
  research_note: "Research note",
};

export const RECORD_TYPES = Object.keys(RECORD_TYPE_LABEL) as TOperationsRecordType[];

export const DEPLOYMENT_STATUS_LABEL: Record<TDeploymentStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  deployed: "Deployed",
  failed: "Failed",
  rolled_back: "Rolled back",
};

export const DEPLOYMENT_STATUS_CLASS: Record<TDeploymentStatus, string> = {
  pending: "bg-layer-3 text-secondary",
  in_progress: "bg-accent-primary/10 text-accent-primary",
  deployed: "bg-success-primary/15 text-success-primary",
  failed: "bg-danger-primary/15 text-danger-primary",
  rolled_back: "bg-warning-primary/15 text-warning-primary",
};

export const DEPLOYMENT_ENVIRONMENT_LABEL: Record<TDeploymentEnvironment, string> = {
  development: "Development",
  test: "Test",
  staging: "Staging",
  production: "Production",
};

export const REPORT_LABEL: Record<TReportType, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  sprint: "Sprint",
  executive: "Executive",
  team: "Team",
};

export const REPORT_TYPES = Object.keys(REPORT_LABEL) as TReportType[];

/** The tabs across the top of every operations screen. */
export const OPERATIONS_TABS = [
  { key: "", label: "Dashboard" },
  { key: "work-logs", label: "Work logs" },
  { key: "attendance", label: "Attendance" },
  { key: "tickets", label: "Requests" },
  { key: "deployments", label: "Deployments" },
  { key: "records", label: "Records" },
  { key: "analytics", label: "Analytics" },
  { key: "reports", label: "Reports" },
  { key: "settings", label: "Settings" },
] as const;

export const DASHBOARD_ROLES = [
  { key: "developer", label: "My work" },
  { key: "pm", label: "Project manager" },
  { key: "qa", label: "QA" },
  { key: "devops", label: "DevOps" },
] as const;

export type TDashboardRole = (typeof DASHBOARD_ROLES)[number]["key"];

/** Local-storage key for the dashboard a person last looked at. */
export const DASHBOARD_ROLE_STORAGE_KEY = "operations_dashboard_role";
