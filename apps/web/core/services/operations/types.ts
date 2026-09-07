/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Wire types for the Engineering Operations API.
 *
 * These mirror `workspaces/app/serializers/operations.py` and the dashboard,
 * analytics and report endpoints. Kept in one file next to the services so
 * that a change on the Django side has exactly one place to land here.
 */

export type TOperationsMember = {
  member_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

// --------------------------------------------------------------------- Work logs

export type TWorkLogIssue = {
  id: string;
  name: string;
  sequence_id: number;
  project_id: string;
  state_id: string | null;
};

export type TWorkLog = {
  id: string;
  workspace: string;
  project: string | null;
  owner: string;
  date: string;
  summary: string;
  worked_on: string;
  meetings: string;
  research: string;
  production_support: string;
  deployment: string;
  blockers: string;
  tomorrow_plan: string;
  /** Serialised by DRF as a decimal string. */
  time_spent: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  issues: TWorkLogIssue[];
};

export type TWorkLogPayload = Partial<
  Omit<TWorkLog, "id" | "workspace" | "owner" | "submitted_at" | "created_at" | "updated_at" | "issues">
> & { issue_ids?: string[] };

export type TMissingWorkLogDay = {
  date: string;
  missing: TOperationsMember[];
};

export type TMissingWorkLogs = {
  start_date: string;
  end_date: string;
  member_count: number;
  days: TMissingWorkLogDay[];
};

// -------------------------------------------------------------- Operations tickets

export type TOperationsTicketStatus =
  | "new"
  | "pm_review"
  | "need_info"
  | "approved"
  | "converted"
  | "rejected"
  | "closed";

export type TOperationsTicketSource = "sales" | "operations" | "qa" | "management" | "customer" | "internal";

export type TOperationsTicketPriority = "urgent" | "high" | "medium" | "low" | "none";

export type TOperationsTicket = {
  id: string;
  workspace: string;
  sequence_id: number;
  name: string;
  description_json: Record<string, unknown>;
  description_html: string;
  description_stripped: string | null;
  status: TOperationsTicketStatus;
  source: TOperationsTicketSource;
  priority: TOperationsTicketPriority;
  requested_by: string | null;
  requester_name: string;
  requester_email: string;
  assignee: string | null;
  project: string | null;
  module: string | null;
  converted_issue: string | null;
  converted_at: string | null;
  reviewed_at: string | null;
  closed_at: string | null;
  target_date: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
};

export type TOperationsTicketPayload = Partial<
  Pick<
    TOperationsTicket,
    | "name"
    | "description_html"
    | "description_json"
    | "source"
    | "priority"
    | "requester_name"
    | "requester_email"
    | "assignee"
    | "project"
    | "module"
    | "target_date"
  >
>;

export type TOperationsTicketComment = {
  id: string;
  ticket: string;
  actor: string | null;
  comment_html: string;
  comment_stripped: string | null;
  created_at: string;
  updated_at: string;
};

export type TOperationsTicketActivity = {
  id: string;
  ticket: string;
  actor: string | null;
  verb: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  comment: string;
  created_at: string;
};

export type TOperationsTicketConversion = {
  ticket: TOperationsTicket;
  issue: {
    id: string;
    name: string;
    sequence_id: number;
    project_id: string;
    project_identifier: string;
  };
};

// ----------------------------------------------------------------------- Records

export type TOperationsRecordType =
  | "incident"
  | "outage"
  | "adr"
  | "meeting_notes"
  | "rca"
  | "vendor_meeting"
  | "client_meeting"
  | "deployment_record"
  | "infra_change"
  | "security_finding"
  | "research_note";

export type TOperationsRecord = {
  id: string;
  workspace: string;
  project: string | null;
  record_type: TOperationsRecordType;
  name: string;
  description_json: Record<string, unknown>;
  description_html: string;
  description_stripped: string | null;
  occurred_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  participants: string[];
  issues: Pick<TWorkLogIssue, "id" | "name" | "sequence_id" | "project_id">[];
};

export type TOperationsRecordPayload = Partial<
  Pick<
    TOperationsRecord,
    "project" | "record_type" | "name" | "description_html" | "description_json" | "occurred_at" | "metadata"
  >
> & { participant_ids?: string[]; issue_ids?: string[] };

// ------------------------------------------------------------------- Deployments

export type TDeploymentEnvironment = "development" | "test" | "staging" | "production";

export type TDeploymentStatus = "pending" | "in_progress" | "deployed" | "failed" | "rolled_back";

export type TDeployment = {
  id: string;
  workspace: string;
  project: string;
  version: string;
  environment: TDeploymentEnvironment;
  status: TDeploymentStatus;
  deployed_by: string | null;
  scheduled_for: string | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string;
  release_notes_html: string;
  rolled_back_from: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  issues: Pick<TWorkLogIssue, "id" | "name" | "sequence_id" | "project_id">[];
};

export type TDeploymentPayload = Partial<
  Pick<
    TDeployment,
    | "version"
    | "environment"
    | "status"
    | "deployed_by"
    | "scheduled_for"
    | "notes"
    | "release_notes_html"
    | "rolled_back_from"
  >
> & { issue_ids?: string[] };

// -------------------------------------------------------------------- Dashboards

export type TBurndownPoint = { date: string; remaining: number | null };

export type TPMDashboard = {
  project_ids: string[];
  sprint: {
    active_cycles: { id: string; name: string; project_id: string; start_date: string; end_date: string }[];
    total: number;
    completed: number;
    remaining: number;
    velocity: number;
    carry_over: number;
    burndown?: TBurndownPoint[];
  };
  team: {
    total: number;
    work_logs_filed: number;
    missing_work_logs: TOperationsMember[];
  };
  delivery: {
    in_progress: number;
    waiting_qa: number;
    waiting_deployment: number;
    blocked: number;
    overdue: number;
    deployed: number;
  };
  quality: {
    bugs: number;
    hotfixes: number;
    quality_items: number;
    open_bugs: number;
    qa_failures_30d: number;
    reopened_30d: number;
  };
  capacity: {
    wip_total: number;
    workload: (TOperationsMember & { wip: number })[];
    unassigned: number;
    bottlenecks: { stage: string; count: number }[];
  };
  operations: {
    pending: number;
    waiting_pm_review: number;
    need_information: number;
    waiting_conversion: number;
    converted: number;
    by_status: Record<string, number>;
    by_source: Record<string, number>;
  };
};

export type TDeveloperDashboardIssue = {
  id: string;
  name: string;
  sequence_id: number;
  project_id: string;
  state_id?: string | null;
  priority?: string;
  target_date?: string | null;
  completed_at?: string | null;
};

export type TDeveloperDashboard = {
  member_id: string;
  assigned: {
    total: number;
    by_state_group: Record<string, number>;
    by_priority: Record<string, number>;
  };
  current_sprint: {
    total: number;
    completed: number;
    cycles: { issue_cycle__cycle__id: string; issue_cycle__cycle__name: string; count: number }[];
  };
  modules: { issue_module__module__id: string; issue_module__module__name: string; count: number }[];
  in_progress: TDeveloperDashboardIssue[];
  blocked: TDeveloperDashboardIssue[];
  overdue: number;
  recently_completed: TDeveloperDashboardIssue[];
  work_log: {
    today_filed: boolean;
    today_id: string | null;
    week_filed: number;
    week_hours: number;
  };
  weekly: { completed: number; week_start: string };
};

export type TQADashboard = {
  ready_for_testing: { count: number; items: TDeveloperDashboardIssue[] };
  in_testing: { count: number; items: TDeveloperDashboardIssue[] };
  passed_30d: number;
  failed_30d: number;
  reopened_bugs: number;
  average_qa_hours: number | null;
  waiting_release: number;
};

export type TDevOpsDashboard = {
  release_queue: { count: number; items: TDeveloperDashboardIssue[] };
  pending_deployments: number;
  production_releases_30d: number;
  failed_30d: number;
  rollbacks_30d: number;
  deployment_frequency_per_week: number;
  history: Pick<
    TDeployment,
    "id" | "version" | "environment" | "status" | "project" | "started_at" | "completed_at" | "created_at"
  >[];
  by_status: Record<string, number>;
  by_environment: Record<string, number>;
};

// --------------------------------------------------------------------- Analytics

export type TAnalyticsPeriod = { start_date: string; end_date: string };

export type TDeliveryAnalytics = {
  period: TAnalyticsPeriod;
  lead_time_days: number | null;
  cycle_time_days: number | null;
  throughput: { total: number; per_week: number; series: { date: string; count: number }[] };
  velocity: {
    cycles: {
      cycle_id: string;
      name: string;
      project_id: string;
      end_date: string;
      completed: number;
      total: number;
    }[];
    average: number | null;
  };
  deployment_frequency: { total: number; per_week: number; by_environment: Record<string, number> };
  definitions: Record<string, string>;
};

export type TQualityAnalytics = {
  period: TAnalyticsPeriod;
  created_total: number;
  bug_count: number;
  bug_rate: number | null;
  hotfix_count: number;
  reopened_count: number;
  reopened_rate: number | null;
  reached_qa: number;
  escaped_bugs: number;
  by_type: Record<string, number>;
  definitions: Record<string, string>;
};

export type TProductivityAnalytics = {
  period: TAnalyticsPeriod;
  completed_total: number;
  average_completion_days: number | null;
  wip_total: number;
  expected_work_log_days: number;
  members: (TOperationsMember & {
    completed: number;
    wip: number;
    work_logs_filed: number;
    work_log_completion: number | null;
  })[];
  definitions: Record<string, string>;
};

export type TTeamAnalytics = {
  period: TAnalyticsPeriod;
  member_count: number;
  members: (TOperationsMember & { role: number; open_assigned: number; logged_hours: number })[];
  unassigned_open: number;
  attendance: { available: boolean; reason?: string };
};

// ----------------------------------------------------------------------- Reports

export type TReportType = "weekly" | "monthly" | "sprint" | "executive" | "team";

export type TOperationsReport = {
  report_type: TReportType;
  generated_at: string;
  period: TAnalyticsPeriod;
  workspace: { id: string; slug: string; name: string };
  project_ids: string[];
  headline?: string;
  delivery?: Record<string, unknown>;
  quality?: Record<string, unknown>;
  operations?: Record<string, unknown>;
  records?: Record<string, unknown>;
  sprint?: Record<string, unknown>;
  team?: Record<string, unknown>;
};

// ---------------------------------------------------------------------- Settings

export type TOperationsConfig = {
  state_mapping: Record<string, string[]>;
  work_log: { required_weekdays: number[]; reminder_hour: number; enabled: boolean };
  attendance: { enabled: boolean; check_in_reminder_hour: number; check_out_reminder_hour: number };
  notifications: Record<string, boolean>;
  velocity_issue_types: string[];
  quality_issue_types: string[];
};

export type TOperationsSettings = {
  config: TOperationsConfig;
  overrides: Partial<TOperationsConfig>;
  defaults: TOperationsConfig;
  workflow: {
    states: { name: string; group: string; color: string; sequence: number; owner: string; default?: boolean }[];
    transitions: { from: string; to: string; owner: string }[];
    labels: { name: string; color: string; category: string }[];
    issue_types: { name: string; icon: string; color: string; velocity: boolean; quality: boolean }[];
    module_suggestions: string[];
  };
};

export type TBootstrapResult = {
  workspace: string;
  projects: {
    id: string;
    name: string;
    states: { created: string[]; renamed: { from: string; to: string }[] };
    labels: { created: string[] };
  }[];
  issue_types?: { created: string[]; enabled: number };
};

// ------------------------------------------------------------ Team availability

export type TTeamAvailability =
  | { available: false; reason?: string }
  | {
      available: true;
      source: "team" | "fanout";
      counted: number;
      checked_in: number;
      not_checked_in: number;
      unlinked: number;
      members: (TOperationsMember & {
        linked: boolean;
        checked_in: boolean | null;
        check_in: string | null;
        worked_hours_today: number | null;
      })[];
    };

/** the Workspaces cursor pagination envelope, as the operations list endpoints return it. */
export type TPaginated<T> = {
  grouped_by: string | null;
  sub_grouped_by: string | null;
  total_count: number;
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
  count: number;
  total_pages: number;
  total_results: number;
  extra_stats: unknown;
  results: T[];
};
