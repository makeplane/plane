/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Typed contracts for the Team Operations Dashboard endpoints
 * (`/api/workspaces/{slug}/dashboard/{overview,attention,items}/`).
 *
 * The shape mirrors `apps/api/plane/analytics/dashboard/{contracts,service,items}.py`
 * and `apps/api/plane/app/views/dashboard.py`. The frontend must never invent
 * a field the backend does not return; unknown sections surface as
 * `status: "unavailable"` (never as a silent 0).
 */

// ----- Allowlists (mirror backend contracts.py) ------------------------

/** Snapshot rule keys returned by the overview KPI strip. */
export type TSnapshotRule =
  | "total"
  | "open"
  | "not_started"
  | "started"
  | "completed"
  | "cancelled"
  | "overdue"
  | "due_today"
  | "due_soon"
  | "blocked"
  | "unassigned_urgent_high";
// `no_update` is allowlisted server-side but gated on a coverage
// audit (spec §13). We intentionally omit it from the public type
// until the backend lifts the gate.

/** Attention rule keys used for the attention union + reasons. */
export type TAttentionRule = "overdue" | "blocked" | "due_soon" | "unassigned_urgent_high";

/** Date bucket for the delivery trend section. */
export type TDateBucket = "day" | "week" | "month";

/** Delivery basis for the delivery trend (created vs completed). */
export type TDeliveryBasis = "created_at" | "completed_at";

/** Dimensions used by Insights drilldown. */
export type TDashboardDimension = "assignee" | "project" | "state_group" | "label";

/** Period preset keys accepted by the scope payload. */
export type TPeriodPreset = "this_month" | "last_30_days" | "last_7_days" | "none" | "custom";

// ----- Business filters -------------------------------------------------

/** Allowlisted business-filter keys (mirror of `VALID_BUSINESS_FILTERS`). */
export type TBusinessFilterKey =
  | "state_id"
  | "state_group"
  | "priority"
  | "assignee_id"
  | "label_id"
  | "cycle_id"
  | "module_id"
  | "created_by"
  | "work_item_type";

export type TBusinessFilters = Partial<Record<TBusinessFilterKey, string[]>>;

// ----- Request payloads -------------------------------------------------

export interface TDashboardScopePayload {
  /** Optional project IDs to limit the operational scope. */
  project_ids?: string[];
  /** Period preset OR a custom half-open range. */
  period_preset?: TPeriodPreset;
  start?: string | null;
  end?: string | null;
  /** Allowlisted business filters only. */
  business_filters?: TBusinessFilters;
  /** Day/week/month bucket for the delivery trend. */
  date_bucket?: TDateBucket;
}

export interface TDashboardItemsPayload extends TDashboardScopePayload {
  /** Top-level metric, kept for backwards compatibility. */
  metric?: TSnapshotRule | "all";
  /**
   * Agreed selection contract. When the payload carries both `metric`
   * and `selection.metric`, the latter wins because it includes the
   * actual dimension values + date bounds the backend must apply.
   */
  selection?: TDashboardSelection;
  /** Pagination. */
  page?: number;
  page_size?: number;
}

export interface TDashboardAttentionPayload extends TDashboardScopePayload {
  page?: number;
  page_size?: number;
}

/**
 * Extended scope payload for the standalone read-model endpoints
 * (workload / projects / timeline). Each one accepts the canonical
 * scope fields plus its own pagination cursors. The shell and the
 * deep-tab pages compose this payload from `buildScopePayload`.
 */
export interface TDashboardStandalonePayload extends TDashboardScopePayload {
  /** Workload / Projects pagination. */
  page?: number;
  page_size?: number;
  /** Workload-only: rule-based WIP threshold. */
  wip_threshold?: number;
  /** Workload-only: ask the backend to sort the FULL roster by risk
   *  and return the top N. Without `preview: true` the backend
   *  paginates by display_name, which can hide Z-named overloaded
   *  members on page 2+. The overview workload preview always
   *  sends `preview: true`. */
  preview?: boolean;
  /** Timeline's three independent paging cursors. */
  cycles_page?: number;
  deadlines_page?: number;
  unscheduled_page?: number;
}

// ----- Response envelope + sections -------------------------------------

export interface TDashboardResolvedScope {
  workspace_id: string;
  principal_id: string;
  project_ids: string[];
  business_filters: TBusinessFilters;
}

export interface TDashboardResolvedPeriod {
  start: string | null;
  end: string | null;
  /** Calendar date in the workspace timezone (YYYY-MM-DD). */
  today: string;
}

export interface TDashboardEnvelopeBase {
  version: 1;
  generated_at: string;
  scope_key: string;
  resolved_scope: TDashboardResolvedScope;
  resolved_period: TDashboardResolvedPeriod;
  timezone: string;
}

export type TSectionStatus = "ok" | "error" | "unavailable";

export interface TDashboardSection<TData> {
  section_id: string;
  status: TSectionStatus;
  data?: TData;
  reason?: string;
}

export interface TDashboardEnvelope<TData> extends TDashboardEnvelopeBase {
  sections: TDashboardSection<TData>[];
}

// ----- KPI / Progress / Delivery / Top projects / Attention preview -----

export interface TKpiCounts {
  total: number;
  open: number;
  not_started: number;
  started: number;
  completed: number;
  cancelled: number;
  overdue: number;
  due_today: number;
  due_soon: number;
  blocked: number;
}

export interface TProgressStateGroup {
  group: "backlog" | "unstarted" | "started" | "completed" | "cancelled";
  count: number;
}

export interface TProgressData {
  state_groups: TProgressStateGroup[];
  completion_rate: number | null;
  denominator: number;
}

export interface TDeliveryTrendPoint {
  bucket: string;
  count: number;
}

export interface TDeliveryTrendData {
  bucket: TDateBucket;
  series_created: TDeliveryTrendPoint[];
  series_completed: TDeliveryTrendPoint[];
  created_total: number;
  completed_total: number;
  delta: number;
}

export interface TTopProjectRow {
  project_id: string;
  name: string;
  open: number;
  overdue: number;
  blocked: number;
}

export interface TTopProjectsData {
  top: TTopProjectRow[];
  total_projects_in_scope: number;
  shown: number;
}

// ----- Issue row (used by items, attention preview, drawer) -------------

export type TStateGroup = "backlog" | "unstarted" | "started" | "completed" | "cancelled";

export interface TIssueRow {
  id: string;
  name: string;
  sequence_id: number;
  priority: string | null;
  target_date: string | null;
  completed_at: string | null;
  created_at: string;
  project_id: string;
  project_name: string | null;
  state_id: string | null;
  state_name: string | null;
  state_group: TStateGroup | null;
  /** Present only on attention rows. */
  reasons?: TAttentionRule[];
}

export interface TAttentionPreviewData {
  preview: TIssueRow[];
  reason_counts: Record<TAttentionRule, number>;
  union_total: number;
  total: number;
}

export interface TAttentionPayloadData {
  rows: TIssueRow[];
  total: number;
  reason_counts: Record<TAttentionRule, number>;
  union_total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  scope_key: string;
}

export interface TItemsPayloadData {
  rows: TIssueRow[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  scope_key: string;
}

export interface TRequestMetaData {
  date_bucket: TDateBucket;
}

// ----- Typed overview envelope -----------------------------------------

export type TKpiSection = TDashboardSection<TKpiCounts>;
export type TProgressSection = TDashboardSection<TProgressData>;
export type TDeliverySection = TDashboardSection<TDeliveryTrendData>;
export type TTopProjectsSection = TDashboardSection<TTopProjectsData>;
export type TAttentionPreviewSection = TDashboardSection<TAttentionPreviewData>;
export interface TWorkloadPreviewUnavailable {
  status: "unavailable";
  section_id: "workload_preview";
  reason: string;
}
export type TRequestMetaSection = TDashboardSection<TRequestMetaData>;

export interface TDashboardOverviewResponse extends TDashboardEnvelopeBase {
  sections: (
    | TKpiSection
    | TProgressSection
    | TDeliverySection
    | TTopProjectsSection
    | TAttentionPreviewSection
    | TWorkloadPreviewUnavailable
    | TRequestMetaSection
  )[];
}

// ----- Attention / Items envelopes -------------------------------------

export interface TDashboardAttentionResponse extends TDashboardEnvelopeBase {
  sections: (TDashboardSection<TAttentionPayloadData> | TRequestMetaSection)[];
}

export interface TDashboardItemsResponse extends TDashboardEnvelopeBase {
  sections: (TDashboardSection<TItemsPayloadData> | TRequestMetaSection)[];
}

// ----- Standalone /workload /projects /timeline contracts ---------------
//
// These endpoints are owned by backend Task 3 (workload.py, projects.py,
// timeline.py) which is not yet shipped. We declare the typed shape the
// frontend expects so the store/renderers can compile; at runtime a
// 404 / "endpoint_pending_task_3" reason flows through the same
// `status: "unavailable"` path as the workload_preview section above.
// Per the agreed contract direction (msg_d1c96d343658), the shape is
// refined below: workload rows carry member_id/display_name/avatar_url/
// is_active + open/started/overdue/blocked/due_soon/completed_in_period;
// projects rows carry the five state-group counts + total + cancelled +
// completion_rate; timeline exposes cycle_lanes + deadline_issues +
// unscheduled_cycles with independent paging metadata.

// ----- Items selection (drilldown) ------------------------------------

/**
 * `values` is the allowlisted subset of dimensions that may scope the
 * drilldown. The key is present in the object even when its value is
 * `null` (e.g. `{assignee_id: null}` to request unassigned rows); an
 * absent key means "do not constrain this dimension". `assignee_id`
 * uses `null` (not `[]`) to mean unassigned; an empty `[]` is reserved
 * for "no member selected" semantics and is intentionally not used.
 */
export interface TDashboardSelectionValues {
  project_id?: string[];
  assignee_id?: string[] | null;
  state_group?: string[];
  priority?: string[];
  label_id?: string[];
  cycle_id?: string[];
  module_id?: string[];
}

export interface TDashboardSelection {
  metric: TSnapshotRule | "all";
  values?: TDashboardSelectionValues;
  /** Inclusive lower bound (ISO datetime in workspace timezone). */
  date_start?: string;
  /** Exclusive upper bound (ISO datetime in workspace timezone). */
  date_end?: string;
  delivery_base?: TDeliveryBasis;
  /** Day/week/month granularity for date buckets. NOT a replacement
   *  for the actual date bounds above. */
  date_bucket?: TDateBucket;
}

// ----- Workload (Task 3) ---------------------------------------------

/**
 * A single roster row.
 * - `member_id: null` → the synthetic Unassigned bucket (also reported
 *   via the `unassigned` counter block below).
 * - `is_active: false` → roster member with valid assignment but
 *   inactive user; counted via the `inactive` block, NOT excluded
 *   from `rows` (the active rows may include zero-work members).
 * - `wip_high: true` → started count exceeds the per-view WIP
 *   threshold; the threshold lives on the section, not on each row.
 */
export interface TWorkloadMemberRow {
  member_id: string | null;
  display_name: string;
  avatar_url: string | null;
  is_active: boolean;
  open: number;
  started: number;
  overdue: number;
  blocked: number;
  due_soon: number;
  completed_in_period: number;
  /** Rule-based warning, never a productivity inference. */
  wip_high?: boolean;
}

/** Workspace-distinct totals for the workload section. Counts each
 *  issue exactly once; the frontend never derives these from row sums
 *  (full credit is computed per cell, not per workspace). */
export interface TWorkloadDistinctTotals {
  total: number;
  open: number;
  started: number;
  overdue: number;
  blocked: number;
  due_soon: number;
  completed_in_period: number;
}

/** The synthetic Unassigned bucket — distinct issue union where the
 *  active assignee relation is absent. */
export interface TWorkloadUnassignedCounters {
  open: number;
  started: number;
  overdue: number;
  blocked: number;
  due_soon: number;
  completed_in_period: number;
}

/** Distinct issue union assigned to inactive former members. Per
 *  the contract guide, this is NOT a member count: it is the
 *  issue-side union. `member_count` is the size of the inactive
 *  roster slice. */
export interface TWorkloadInactiveCounters {
  member_count: number;
  open: number;
  started: number;
  overdue: number;
  blocked: number;
  due_soon: number;
  completed_in_period: number;
}

export interface TWorkloadData {
  rows: TWorkloadMemberRow[];
  total_members: number;
  distinct_totals: TWorkloadDistinctTotals;
  unassigned: TWorkloadUnassignedCounters;
  inactive: TWorkloadInactiveCounters;
  pagination: TDashboardPagination;
  wip_threshold: number | null;
  wip_warning_reason: string | null;
  /** Member ids on the current page whose started count exceeds the
   *  WIP threshold. The frontend uses this to surface the rule-based
   *  warning badge on individual rows, not to compute productivity
   *  scores. */
  wip_warning_member_ids: string[];
  /** Backend-computed scope_key — used by the panel to detect
   *  cross-scope response leakage. */
  scope_key: string;
}

/** Generic pagination block returned by the standalone endpoints. */
export interface TDashboardPagination {
  page: number;
  page_size: number;
  has_more: boolean;
}

// ----- Projects (Task 3) ----------------------------------------------

/** All five state-group counts so the breakdown table can render
 *  the same 5-segment stacked bar as Overview §6.2. */
export interface TProjectBreakdownStateGroups {
  backlog: number;
  unstarted: number;
  started: number;
  completed: number;
  cancelled: number;
}

export interface TProjectBreakdownRow {
  project_id: string;
  name: string;
  state_groups: TProjectBreakdownStateGroups;
  total: number;
  cancelled: number;
  open: number;
  started: number;
  completed: number;
  completed_in_period: number;
  overdue: number;
  blocked: number;
  completion_rate: number | null;
  /** Nearest upcoming open dated issue; overdue tracked separately. */
  next_deadline: string | null;
}

export interface TProjectsDistinctTotals {
  total: number;
  open: number;
  started: number;
  overdue: number;
  blocked: number;
  completed_in_period: number;
  completion_rate: number | null;
}

export interface TProjectsData {
  rows: TProjectBreakdownRow[];
  total_count: number;
  distinct_totals: TProjectsDistinctTotals;
  pagination: TDashboardPagination;
  /** Backend-computed scope_key for cross-scope response detection. */
  scope_key: string;
}

// ----- Timeline (Task 3) ---------------------------------------------

export type TCycleStatus = "upcoming" | "active" | "completed";

export interface TCycleLaneRow {
  cycle_id: string;
  cycle_name: string;
  project_id: string;
  project_name: string;
  start: string | null;
  end: string | null;
  /** Schedule status, never invented history. */
  status: TCycleStatus;
  progress: number | null;
  /** Count of overdue issues; never a heuristic. */
  overdue_badge: number;
  issue_count: number;
}

export interface TTimelineCycleLanesData {
  rows: TCycleLaneRow[];
  total: number;
  pagination: TDashboardPagination;
}

export interface TTimelineDeadlineRow {
  issue_id: string;
  sequence_id: number;
  name: string;
  project_id: string;
  project_name: string;
  target_date: string;
  days_until_due: number;
  priority: string;
  owner_ids: string[];
}

export interface TTimelineDeadlinesData {
  rows: TTimelineDeadlineRow[];
  total: number;
  pagination: TDashboardPagination;
}

export type TUnscheduledCycleReason = "missing_start_or_end";

export interface TUnscheduledCycleRow {
  cycle_id: string;
  cycle_name: string;
  project_id: string;
  reason: TUnscheduledCycleReason;
}

export interface TUnscheduledCyclesData {
  rows: TUnscheduledCycleRow[];
  total: number;
  pagination: TDashboardPagination;
}

export interface TTimelineData {
  cycle_lanes: TTimelineCycleLanesData;
  deadlines: TTimelineDeadlinesData;
  unscheduled_cycles: TUnscheduledCyclesData;
  total_cycles_in_scope: number;
  /** Backend-computed scope_key for cross-scope response detection. */
  scope_key: string;
}

// ----- Timeline request extras (per contract guide) -------------------

/**
 * Timeline accepts three independent paging cursors. `page_size`
 * applies to all three unless overridden per slot.
 */
export interface TTimelineRequestExtras {
  cycles_page?: number;
  deadlines_page?: number;
  unscheduled_page?: number;
  page_size?: number;
}

// ----- Standalone envelope ---------------------------------------------

export interface TStandaloneEnvelope<TData> extends TDashboardEnvelopeBase {
  sections: (TDashboardSection<TData> | TRequestMetaSection)[];
}
