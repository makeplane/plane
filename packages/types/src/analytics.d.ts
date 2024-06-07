export interface IAnalyticsResponse {
  total: number;
  distribution: IAnalyticsData;
  extras: {
    assignee_details: IAnalyticsAssigneeDetails[];
    cycle_details: IAnalyticsCycleDetails[];
    label_details: IAnalyticsLabelDetails[];
    module_details: IAnalyticsModuleDetails[];
    state_details: IAnalyticsStateDetails[];
  };
}

export interface IAnalyticsData {
  [key: string]: {
    dimension: string | null;
    segment?: string;
    count?: number;
    estimate?: number | null;
  }[];
}

export interface IAnalyticsAssigneeDetails {
  assignees__avatar: string | null;
  assignees__display_name: string | null;
  assignees__first_name: string;
  assignees__id: string | null;
  assignees__last_name: string;
}

export interface IAnalyticsCycleDetails {
  issue_cycle__cycle__name: string | null;
  issue_cycle__cycle_id: string | null;
}

export interface IAnalyticsLabelDetails {
  labels__color: string | null;
  labels__id: string | null;
  labels__name: string | null;
}

export interface IAnalyticsModuleDetails {
  issue_module__module__name: string | null;
  issue_module__module_id: string | null;
}

export interface IAnalyticsStateDetails {
  state__color: string;
  state__name: string;
  state_id: string;
}

export type TXAxisValues =
  | "state_id"
  | "state__group"
  | "labels__id"
  | "assignees__id"
  | "estimate_point"
  | "issue_cycle__cycle_id"
  | "issue_module__module_id"
  | "priority"
  | "start_date"
  | "target_date"
  | "created_at"
  | "completed_at";

export type TYAxisValues = "issue_count" | "estimate";

export interface IAnalyticsParams {
  x_axis: TXAxisValues;
  y_axis: TYAxisValues;
  segment?: TXAxisValues | null;
  project?: string[] | null;
  cycle?: string | null;
  module?: string | null;
}

export interface ISaveAnalyticsFormData {
  name: string;
  description: string;
  query_dict: IExportAnalyticsFormData;
}
export interface IExportAnalyticsFormData {
  x_axis: TXAxisValues;
  y_axis: TYAxisValues;
  segment?: TXAxisValues | null;
  project?: string[];
}

export interface IDefaultAnalyticsUser {
  assignees__avatar: string | null;
  assignees__first_name: string;
  assignees__last_name: string;
  assignees__display_name: string;
  assignees__id: string;
  count: number;
}

export interface IDefaultAnalyticsResponse {
  issue_completed_month_wise: { month: number; count: number }[];
  most_issue_closed_user: IDefaultAnalyticsUser[];
  most_issue_created_user: {
    created_by__avatar: string | null;
    created_by__first_name: string;
    created_by__last_name: string;
    created_by__display_name: string;
    created_by__id: string;
    count: number;
  }[];
  open_estimate_sum: number;
  open_issues: number;
  open_issues_classified: { state_group: string; state_count: number }[];
  pending_issue_user: IDefaultAnalyticsUser[];
  total_estimate_sum: number;
  total_issues: number;
  total_issues_classified: { state_group: string; state_count: number }[];
}
