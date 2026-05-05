/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TChartData } from "./charts";

export enum ChartXAxisProperty {
  STATES = "STATES",
  STATE_GROUPS = "STATE_GROUPS",
  LABELS = "LABELS",
  ASSIGNEES = "ASSIGNEES",
  ESTIMATE_POINTS = "ESTIMATE_POINTS",
  CYCLES = "CYCLES",
  MODULES = "MODULES",
  PRIORITY = "PRIORITY",
  START_DATE = "START_DATE",
  TARGET_DATE = "TARGET_DATE",
  CREATED_AT = "CREATED_AT",
  COMPLETED_AT = "COMPLETED_AT",
  CREATED_BY = "CREATED_BY",
  WORK_ITEM_TYPES = "WORK_ITEM_TYPES",
  PROJECTS = "PROJECTS",
  EPICS = "EPICS",
}

export enum ChartYAxisMetric {
  WORK_ITEM_COUNT = "WORK_ITEM_COUNT",
  ESTIMATE_POINT_COUNT = "ESTIMATE_POINT_COUNT",
  PENDING_WORK_ITEM_COUNT = "PENDING_WORK_ITEM_COUNT",
  COMPLETED_WORK_ITEM_COUNT = "COMPLETED_WORK_ITEM_COUNT",
  IN_PROGRESS_WORK_ITEM_COUNT = "IN_PROGRESS_WORK_ITEM_COUNT",
  WORK_ITEM_DUE_THIS_WEEK_COUNT = "WORK_ITEM_DUE_THIS_WEEK_COUNT",
  WORK_ITEM_DUE_TODAY_COUNT = "WORK_ITEM_DUE_TODAY_COUNT",
  BLOCKED_WORK_ITEM_COUNT = "BLOCKED_WORK_ITEM_COUNT",
  EPIC_WORK_ITEM_COUNT = "EPIC_WORK_ITEM_COUNT",
}

export type TAnalyticsTabsBase = "overview" | "work-items" | "projects" | "users" | "cycles" | "modules" | "intake";
export type TAnalyticsGraphsBase =
  | "projects"
  | "work-items"
  | "custom-work-items"
  | "users"
  | "cycles"
  | "modules"
  | "intake";
export interface AnalyticsTab {
  key: TAnalyticsTabsBase;
  label: string;
  content: React.FC;
  isDisabled: boolean;
}
export type TAnalyticsFilterParams = {
  project_ids?: string;
  cycle_id?: string;
  module_id?: string;
};

// service types

export interface IAnalyticsResponse {
  [key: string]: unknown;
}

export interface IAnalyticsResponseFields {
  count: number;
  filter_count: number;
}

// chart types

export interface IChartResponse {
  schema: Record<string, string>;
  data: TChartData<string, string>[];
}

// analytics params form
export interface IAnalyticsParams {
  x_axis: ChartXAxisProperty;
  y_axis: ChartYAxisMetric;
  group_by?: ChartXAxisProperty;
}

// insight table column types
export interface IntakeInsightColumns {
  project__name: string;
  total_intakes: number;
  accepted: number;
  declined: number;
  duplicate: number;
}

export interface CycleInsightColumns {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  project__name: string;
  project_id: string;
  lead__display_name: string;
  total_issues: number;
  completed_issues: number;
  completion_percent: number;
}

export interface ModuleInsightColumns {
  id: string;
  name: string;
  start_date: string;
  target_date: string;
  project__name: string;
  project_id: string;
  lead__display_name: string;
  total_issues: number;
  completed_issues: number;
  completion_percent: number;
}

export interface ProjectInsightColumns {
  project__name: string;
  project_id: string;
  members: number;
  work_items: number;
  state_groups: {
    started: number;
    completed: number;
    backlog: number;
    unstarted: number;
    cancelled: number;
  };
}

export interface UserInsightColumns {
  display_name: string;
  assignee_id: string;
  avatar_url: string;
  started_work_items: number;
  completed_work_items: number;
  un_started_work_items: number;
}

export interface WorkItemInsightColumns {
  project__name: string;
  project_id: string;
  display_name: string;
  assignee_id: string;
  avatar_url: string;
  backlog_work_items: number;
  started_work_items: number;
  un_started_work_items: number;
  completed_work_items: number;
  cancelled_work_items: number;
}

export type AnalyticsTableDataMap = {
  intake: IntakeInsightColumns;
  cycles: CycleInsightColumns;
  modules: ModuleInsightColumns;
  projects: ProjectInsightColumns;
  users: UserInsightColumns;
  "work-items": WorkItemInsightColumns;
};
