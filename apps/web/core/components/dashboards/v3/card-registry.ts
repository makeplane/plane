/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * The built-in Workspace Dashboard card registry (spec §5.1, §7).
 *
 * The composition is product-defined and versioned in source control: there is
 * no `Dashboard` row, no widget CRUD, and no layout persistence (§1, §3.2).
 * What a *user* may change is the query configuration of a card — and only
 * where the card declares the control (§9).
 *
 * Nothing here computes a metric. A card is a default `AnalyticsQueryV2` plus
 * the set of parameters that may be swapped, and the engine stays the only
 * place that aggregates (§10.1). The `letter` field is the §7 A–L label so a
 * card stays traceable to the spec and to RD-480's batch contract fixture.
 */

import type {
  TAnalyticsAllocation,
  TAnalyticsDateBasis,
  TAnalyticsDateGrouping,
  TAnalyticsDimensionKey,
  TAnalyticsDisplay,
  TAnalyticsMetricKey,
  TAnalyticsNormalization,
  TAnalyticsTimePreset,
} from "@plane/types";

/** Renderers the fixed dashboard can mount (spec §9.7). */
export type TCardRenderer = "number" | "gauge" | "bar" | "line" | "pie" | "donut" | "matrix" | "work_item_table";

/** The configurable parameters a card may expose (§9). */
export type TCardControl =
  | "metric"
  | "dimension"
  | "breakdown"
  | "display"
  | "normalization"
  | "allocation"
  | "date_grouping"
  | "renderer";

/** §7.1–§7.5. The KPI band is its own section because it is a different shape. */
export type TCardSection = "kpi" | "delivery" | "workload" | "distribution" | "attention";

export type TCardId =
  | "open_work_items"
  | "in_progress"
  | "completed"
  | "overdue"
  | "blocked"
  | "created_vs_completed_trend"
  | "work_state_distribution"
  | "workload_by_assignee"
  | "workload_allocation_matrix"
  | "all_members_workload"
  | "workload_by_labels"
  | "priority_distribution"
  | "work_by_project"
  | "attention_required";

/**
 * The user-changeable half of a card. This is exactly what a preference
 * persists (§15) — never a result snapshot (§10.2).
 */
export interface TCardPreference {
  metric: TAnalyticsMetricKey;
  dimension: TAnalyticsDimensionKey | null;
  breakdown: TAnalyticsDimensionKey | null;
  display: TAnalyticsDisplay;
  normalization: TAnalyticsNormalization;
  allocation: TAnalyticsAllocation;
  renderer: TCardRenderer;
  dateGrouping?: TAnalyticsDateGrouping;
}

export interface TCardDefinition {
  /** Stable logical id — preferences attach here, never to a layout slot (§5.1). */
  id: TCardId;
  /** §7 A–L label, kept for traceability to the spec and the backend fixture. */
  letter: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N";
  section: TCardSection;
  titleKey: string;
  /** Full-bleed card — matrix and work-item tables need the width (§6). */
  wide: boolean;
  defaults: TCardPreference;
  /** Which parameters this card lets a user change (§9). */
  controls: TCardControl[];
  allowedRenderers: TCardRenderer[];
  allowedMetrics: TAnalyticsMetricKey[];
  allowedDimensions: TAnalyticsDimensionKey[];
  allowedBreakdowns: TAnalyticsDimensionKey[];
  /**
   * §7.1 — a current-state KPI ignores the global time range. Applying
   * "created in this quarter" to "open work items" would silently report a
   * different number, so these cards declare `timeDependent: false` and the
   * composer sends `preset: "none"`.
   */
  timeDependent: boolean;
  /** Product default range, used when the global control is set to this card's own default. */
  defaultTimePreset: TAnalyticsTimePreset;
  /**
   * §8.2 — a card may pin a stronger semantic basis than the global one
   * (Completed counts by completed date). The UI surfaces the override rather
   * than returning a number the global basis would have made meaningless.
   */
  semanticDateBasis?: TAnalyticsDateBasis;
  /** Card-local deterministic filters (§7.5 L). Never user-editable in P0. */
  filters: Record<string, string[]>;
}

/** §7.2 F — bucket auto-resolution from the selected range. */
export function autoDateGrouping(preset: TAnalyticsTimePreset): TAnalyticsDateGrouping {
  switch (preset) {
    case "today":
    case "yesterday":
    case "last_7_days":
    case "this_week":
    case "last_week":
      return "day";
    case "this_month":
    case "last_month":
      return "week";
    case "this_quarter":
    case "last_quarter":
    case "last_90_days":
      return "month";
    default:
      return "week";
  }
}

/** Engine vocabulary, mirroring `METRIC_LABELS` in the analytics namespace. */
export const DASHBOARD_DIMENSION_LABELS: Record<TAnalyticsDimensionKey, string> = {
  state: "State",
  state_group: "State group",
  project: "Project",
  priority: "Priority",
  assignees: "Assignee",
  created_by: "Created by",
  labels: "Label",
  cycle: "Cycle",
  module: "Module",
  work_item_type: "Work item type",
  estimate_point: "Estimate",
  created_date: "Created date",
  completed_date: "Completed date",
  start_date: "Start date",
  due_date: "Due date",
};

export const DASHBOARD_RENDERER_LABELS: Record<TCardRenderer, string> = {
  number: "Number",
  gauge: "Gauge",
  bar: "Bar",
  line: "Line",
  pie: "Pie",
  donut: "Donut",
  matrix: "Matrix",
  work_item_table: "Work-item table",
};

const CATEGORICAL_BREAKDOWNS: TAnalyticsDimensionKey[] = [
  "project",
  "labels",
  "module",
  "cycle",
  "priority",
  "state_group",
];

/** §7.1 — the five current-state / period KPIs. */
const KPI_DEFINITIONS: TCardDefinition[] = [
  {
    id: "open_work_items",
    letter: "A",
    section: "kpi",
    titleKey: "dashboard_v3.card.open_work_items",
    wide: false,
    defaults: {
      metric: "pending_work_items",
      dimension: null,
      breakdown: null,
      display: "value",
      normalization: "none",
      allocation: "full_credit",
      renderer: "number",
    },
    controls: ["metric", "display"],
    allowedRenderers: ["number", "gauge"],
    allowedMetrics: ["pending_work_items", "work_item_count", "estimate_points"],
    allowedDimensions: [],
    allowedBreakdowns: [],
    timeDependent: false,
    defaultTimePreset: "none",
    filters: {},
  },
  {
    id: "in_progress",
    letter: "B",
    section: "kpi",
    titleKey: "dashboard_v3.card.in_progress",
    wide: false,
    defaults: {
      metric: "in_progress_work_items",
      dimension: null,
      breakdown: null,
      display: "value",
      normalization: "none",
      allocation: "full_credit",
      renderer: "number",
    },
    controls: ["metric", "display"],
    allowedRenderers: ["number", "gauge"],
    allowedMetrics: ["in_progress_work_items", "work_item_count", "estimate_points"],
    allowedDimensions: [],
    allowedBreakdowns: [],
    timeDependent: false,
    defaultTimePreset: "none",
    filters: {},
  },
  {
    id: "completed",
    letter: "C",
    section: "kpi",
    titleKey: "dashboard_v3.card.completed",
    wide: false,
    defaults: {
      metric: "completed_work_items",
      dimension: null,
      breakdown: null,
      display: "value",
      normalization: "none",
      allocation: "full_credit",
      renderer: "number",
    },
    controls: ["metric", "display"],
    allowedRenderers: ["number", "gauge"],
    allowedMetrics: ["completed_work_items", "work_item_count", "estimate_points"],
    allowedDimensions: [],
    allowedBreakdowns: [],
    // Completed is the one KPI that counts events inside the selected range.
    timeDependent: true,
    defaultTimePreset: "this_month",
    semanticDateBasis: "completed_at",
    filters: {},
  },
  {
    id: "overdue",
    letter: "D",
    section: "kpi",
    titleKey: "dashboard_v3.card.overdue",
    wide: false,
    defaults: {
      metric: "overdue_work_items",
      dimension: null,
      breakdown: null,
      display: "value",
      normalization: "none",
      allocation: "full_credit",
      renderer: "number",
    },
    controls: ["metric", "display"],
    allowedRenderers: ["number", "gauge"],
    allowedMetrics: ["overdue_work_items", "due_today", "due_this_week", "work_item_count"],
    allowedDimensions: [],
    allowedBreakdowns: [],
    timeDependent: false,
    defaultTimePreset: "none",
    filters: {},
  },
  {
    id: "blocked",
    letter: "E",
    section: "kpi",
    titleKey: "dashboard_v3.card.blocked",
    wide: false,
    defaults: {
      metric: "blocked_work_items",
      dimension: null,
      breakdown: null,
      display: "value",
      normalization: "none",
      allocation: "full_credit",
      renderer: "number",
    },
    controls: ["metric", "display"],
    allowedRenderers: ["number", "gauge"],
    allowedMetrics: ["blocked_work_items", "work_item_count", "estimate_points"],
    allowedDimensions: [],
    allowedBreakdowns: [],
    timeDependent: false,
    defaultTimePreset: "none",
    filters: {},
  },
];

/** §7.2 — delivery. */
const DELIVERY_DEFINITIONS: TCardDefinition[] = [
  {
    id: "created_vs_completed_trend",
    letter: "F",
    section: "delivery",
    titleKey: "dashboard_v3.card.created_vs_completed_trend",
    wide: false,
    defaults: {
      metric: "work_item_count",
      dimension: "created_date",
      breakdown: null,
      display: "value",
      normalization: "none",
      allocation: "full_credit",
      renderer: "line",
      dateGrouping: "week",
    },
    controls: ["metric", "dimension", "date_grouping", "display", "renderer"],
    allowedRenderers: ["line", "bar"],
    allowedMetrics: ["work_item_count", "completed_work_items", "estimate_points"],
    allowedDimensions: ["created_date", "completed_date", "start_date", "due_date"],
    allowedBreakdowns: [],
    timeDependent: true,
    defaultTimePreset: "this_month",
    semanticDateBasis: "created_at",
    filters: {},
  },
  {
    id: "work_state_distribution",
    letter: "G",
    section: "delivery",
    titleKey: "dashboard_v3.card.work_state_distribution",
    wide: false,
    defaults: {
      metric: "work_item_count",
      dimension: "state_group",
      breakdown: null,
      display: "value_and_percentage",
      normalization: "group_total",
      allocation: "full_credit",
      renderer: "donut",
    },
    controls: ["metric", "dimension", "breakdown", "display", "normalization", "renderer"],
    allowedRenderers: ["donut", "pie", "bar", "matrix", "work_item_table"],
    allowedMetrics: ["work_item_count", "estimate_points", "pending_work_items"],
    allowedDimensions: ["state_group", "state", "priority", "work_item_type"],
    allowedBreakdowns: CATEGORICAL_BREAKDOWNS,
    timeDependent: false,
    defaultTimePreset: "none",
    filters: {},
  },
];

/** §7.3 — workload. */
const WORKLOAD_DEFINITIONS: TCardDefinition[] = [
  {
    id: "workload_by_assignee",
    letter: "H",
    section: "workload",
    titleKey: "dashboard_v3.card.workload_by_assignee",
    wide: false,
    defaults: {
      metric: "work_item_count",
      dimension: "assignees",
      breakdown: null,
      display: "value_and_percentage",
      normalization: "group_total",
      allocation: "split_equal",
      renderer: "bar",
    },
    controls: ["metric", "dimension", "breakdown", "display", "normalization", "allocation", "renderer"],
    allowedRenderers: ["bar", "matrix", "work_item_table"],
    allowedMetrics: ["work_item_count", "estimate_points", "allocated_work_item_count", "allocated_estimate_points"],
    allowedDimensions: ["assignees", "created_by", "project", "state_group", "priority"],
    allowedBreakdowns: CATEGORICAL_BREAKDOWNS,
    timeDependent: false,
    defaultTimePreset: "none",
    filters: {},
  },
  {
    id: "workload_allocation_matrix",
    letter: "I",
    section: "workload",
    titleKey: "dashboard_v3.card.workload_allocation_matrix",
    wide: true,
    defaults: {
      metric: "work_item_count",
      dimension: "assignees",
      breakdown: "project",
      display: "value_and_percentage",
      normalization: "grand_total",
      allocation: "split_equal",
      renderer: "matrix",
    },
    controls: ["metric", "dimension", "breakdown", "display", "normalization", "allocation", "renderer"],
    allowedRenderers: ["matrix", "work_item_table"],
    allowedMetrics: ["work_item_count", "estimate_points", "allocated_work_item_count", "allocated_estimate_points"],
    // Rows are people; the column dimension is what a mono-project team swaps
    // to `labels` to read the same matrix as a product split (§7.3).
    allowedDimensions: ["assignees", "created_by", "state_group", "priority"],
    allowedBreakdowns: CATEGORICAL_BREAKDOWNS,
    timeDependent: false,
    defaultTimePreset: "none",
    filters: {},
  },
  {
    id: "workload_by_labels",
    letter: "M",
    section: "workload",
    titleKey: "dashboard_v3.card.workload_by_labels",
    wide: false,
    defaults: {
      metric: "work_item_count",
      dimension: "labels",
      breakdown: null,
      display: "value_and_percentage",
      normalization: "group_total",
      allocation: "full_credit",
      renderer: "bar",
    },
    controls: ["metric", "dimension", "breakdown", "display", "normalization", "renderer"],
    allowedRenderers: ["bar", "matrix", "work_item_table"],
    allowedMetrics: ["work_item_count", "estimate_points", "pending_work_items"],
    allowedDimensions: ["labels", "project", "state_group", "priority"],
    allowedBreakdowns: CATEGORICAL_BREAKDOWNS,
    timeDependent: false,
    defaultTimePreset: "none",
    filters: {},
  },
  {
    id: "all_members_workload",
    letter: "N",
    section: "workload",
    titleKey: "dashboard_v3.card.all_members_workload",
    wide: true,
    defaults: {
      metric: "work_item_count",
      dimension: "assignees",
      breakdown: null,
      display: "value",
      normalization: "none",
      allocation: "split_equal",
      renderer: "bar",
    },
    controls: ["metric", "display", "normalization", "allocation", "renderer"],
    allowedRenderers: ["bar", "matrix", "work_item_table"],
    allowedMetrics: ["work_item_count", "estimate_points", "pending_work_items"],
    allowedDimensions: ["assignees", "created_by"],
    allowedBreakdowns: [],
    timeDependent: false,
    defaultTimePreset: "none",
    filters: {},
  },
];

/** §7.4 — distribution. */
const DISTRIBUTION_DEFINITIONS: TCardDefinition[] = [
  {
    id: "priority_distribution",
    letter: "J",
    section: "distribution",
    titleKey: "dashboard_v3.card.priority_distribution",
    wide: false,
    defaults: {
      metric: "work_item_count",
      dimension: "priority",
      breakdown: null,
      display: "value_and_percentage",
      normalization: "group_total",
      allocation: "full_credit",
      renderer: "bar",
    },
    controls: ["metric", "dimension", "breakdown", "display", "normalization", "renderer"],
    allowedRenderers: ["bar", "donut", "pie", "matrix", "work_item_table"],
    allowedMetrics: ["work_item_count", "estimate_points", "pending_work_items"],
    allowedDimensions: ["priority", "state_group", "state", "work_item_type", "estimate_point"],
    allowedBreakdowns: CATEGORICAL_BREAKDOWNS,
    timeDependent: false,
    defaultTimePreset: "none",
    filters: {},
  },
  {
    id: "work_by_project",
    letter: "K",
    section: "distribution",
    titleKey: "dashboard_v3.card.work_by_project",
    wide: false,
    defaults: {
      metric: "work_item_count",
      dimension: "project",
      breakdown: null,
      display: "value_and_percentage",
      normalization: "group_total",
      allocation: "full_credit",
      renderer: "bar",
    },
    controls: ["metric", "dimension", "breakdown", "display", "normalization", "renderer"],
    allowedRenderers: ["bar", "donut", "pie", "matrix", "work_item_table"],
    allowedMetrics: ["work_item_count", "estimate_points", "pending_work_items"],
    // P0 shows the single project rather than inventing a dynamic substitute
    // dimension; a mono-project team can pick `module` or `labels` by hand.
    allowedDimensions: ["project", "module", "labels", "cycle", "state_group"],
    allowedBreakdowns: CATEGORICAL_BREAKDOWNS,
    timeDependent: false,
    defaultTimePreset: "none",
    filters: {},
  },
];

/** §7.5 — attention. Deterministic filters only; no invented risk score. */
const ATTENTION_DEFINITIONS: TCardDefinition[] = [
  {
    id: "attention_required",
    letter: "L",
    section: "attention",
    titleKey: "dashboard_v3.card.attention_required",
    wide: true,
    defaults: {
      metric: "work_item_count",
      dimension: "state_group",
      breakdown: null,
      display: "value",
      normalization: "none",
      allocation: "full_credit",
      renderer: "work_item_table",
    },
    controls: ["metric", "dimension", "renderer"],
    allowedRenderers: ["work_item_table"],
    allowedMetrics: ["work_item_count", "estimate_points", "overdue_work_items", "blocked_work_items"],
    allowedDimensions: ["state_group", "priority", "assignees", "due_date", "project"],
    allowedBreakdowns: [],
    timeDependent: false,
    defaultTimePreset: "none",
    // §7.5 — deterministic risk filter, not a score. `state_group` gives the
    // work-item table rows to group by.
    filters: { priority: ["urgent"] },
  },
];

/** §7 — the twelve built-in cards, in §7 reading order. */
export const WORKSPACE_DASHBOARD_CARDS: TCardDefinition[] = [
  ...KPI_DEFINITIONS,
  ...DELIVERY_DEFINITIONS,
  ...WORKLOAD_DEFINITIONS,
  ...DISTRIBUTION_DEFINITIONS,
  ...ATTENTION_DEFINITIONS,
];

export const WORKSPACE_DASHBOARD_SECTIONS: { id: TCardSection; titleKey: string; subtitleKey?: string }[] = [
  { id: "kpi", titleKey: "dashboard_v3.section.kpi", subtitleKey: "dashboard_v3.section.kpi_subtitle" },
  { id: "delivery", titleKey: "dashboard_v3.section.delivery", subtitleKey: "dashboard_v3.section.delivery_subtitle" },
  { id: "workload", titleKey: "dashboard_v3.section.workload", subtitleKey: "dashboard_v3.section.workload_subtitle" },
  {
    id: "distribution",
    titleKey: "dashboard_v3.section.distribution",
    subtitleKey: "dashboard_v3.section.distribution_subtitle",
  },
  {
    id: "attention",
    titleKey: "dashboard_v3.section.attention",
    subtitleKey: "dashboard_v3.section.attention_subtitle",
  },
];

const CARDS_BY_ID = new Map(WORKSPACE_DASHBOARD_CARDS.map((card) => [card.id, card]));

export const getCardDefinition = (id: TCardId | string): TCardDefinition | undefined => CARDS_BY_ID.get(id as TCardId);

export const getCardsBySection = (section: TCardSection): TCardDefinition[] =>
  WORKSPACE_DASHBOARD_CARDS.filter((card) => card.section === section);

export const defaultCardPreference = (id: TCardId | string): TCardPreference => {
  const card = getCardDefinition(id);
  if (!card) throw new Error(`Unknown workspace dashboard card: ${id}`);
  return { ...card.defaults };
};

/** Product defaults for the whole dashboard (§8.4 reset). */
export const defaultCardPreferences = (): Record<string, TCardPreference> =>
  Object.fromEntries(WORKSPACE_DASHBOARD_CARDS.map((card) => [card.id, { ...card.defaults }]));

/**
 * §9.7 — drop a renderer the card does not declare instead of sending a query
 * shape it cannot truthfully represent.
 */
export const allowedRendererFor = (card: TCardDefinition, renderer: TCardRenderer | undefined): TCardRenderer =>
  renderer && card.allowedRenderers.includes(renderer) ? renderer : card.defaults.renderer;

/**
 * Clamp a stored/preferred configuration to what the card still allows.
 *
 * Preferences outlive the registry (§15.3): a card definition can drop a
 * dimension or a renderer between releases, and a stale preference must fall
 * back to the product default instead of producing an invalid query.
 */
export function reconcileCardPreference(card: TCardDefinition, preference: Partial<TCardPreference>): TCardPreference {
  const wants = { ...card.defaults, ...preference };
  const metric = card.allowedMetrics.includes(wants.metric) ? wants.metric : card.defaults.metric;
  const dimension = card.allowedDimensions.includes(wants.dimension as TAnalyticsDimensionKey)
    ? wants.dimension
    : card.defaults.dimension;
  const breakdown = card.allowedBreakdowns.includes(wants.breakdown as TAnalyticsDimensionKey)
    ? wants.breakdown
    : card.defaults.breakdown;
  return {
    metric,
    dimension: card.controls.includes("dimension") ? dimension : card.defaults.dimension,
    breakdown: card.controls.includes("breakdown") ? breakdown : card.defaults.breakdown,
    display: wants.display,
    normalization: wants.normalization,
    allocation: wants.allocation,
    renderer: allowedRendererFor(card, wants.renderer),
    dateGrouping: card.controls.includes("date_grouping") ? wants.dateGrouping : card.defaults.dateGrouping,
  };
}
