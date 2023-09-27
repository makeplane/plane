import { Properties } from "./workspace";

export type TIssueViewOptions = "list" | "kanban" | "calendar" | "spreadsheet" | "gantt_chart";

export type TIssueGroupByOptions =
  | "state"
  | "priority"
  | "labels"
  | "created_by"
  | "state_detail.group"
  | "project"
  | "assignees"
  | null;

export type TIssueOrderByOptions =
  | "-created_at"
  | "created_at"
  | "updated_at"
  | "-updated_at"
  | "priority"
  | "-priority"
  | "sort_order"
  | "state__name"
  | "-state__name"
  | "assignees__first_name"
  | "-assignees__first_name"
  | "labels__name"
  | "-labels__name"
  | "target_date"
  | "-target_date"
  | "estimate_point"
  | "-estimate_point"
  | "start_date"
  | "-start_date";

export interface IIssueFilterOptions {
  assignees?: string[] | null;
  created_by?: string[] | null;
  labels?: string[] | null;
  priority?: string[] | null;
  start_date?: string[] | null;
  state?: string[] | null;
  state_group?: string[] | null;
  subscriber?: string[] | null;
  target_date?: string[] | null;
  project?: string[] | null;
}

export interface IIssueDisplayFilterOptions {
  group_by?: TIssueGroupByOptions;
  layout?: TIssueViewOptions;
  order_by?: TIssueOrderByOptions;
  show_empty_groups?: boolean;
  start_target_date?: boolean;
  sub_issue?: boolean;
  type?: "active" | "backlog" | null;
}

export interface IWorkspaceIssueFilterOptions {
  assignees?: string[] | null;
  created_by?: string[] | null;
  labels?: string[] | null;
  priority?: string[] | null;
  state_group?: string[] | null;
  subscriber?: string[] | null;
  start_date?: string[] | null;
  target_date?: string[] | null;
  project?: string[] | null;
}

export interface IWorkspaceIssueDisplayFilterOptions {
  order_by?: string | undefined;
  type?: "active" | "backlog" | null;
  sub_issue?: boolean;
}

export interface IProjectViewProps {
  display_filters: IIssueDisplayFilterOptions | undefined;
  filters: IIssueFilterOptions;
}

export interface IWorkspaceViewProps {
  filters: IWorkspaceIssueFilterOptions;
  display_filters: IWorkspaceIssueDisplayFilterOptions | undefined;
  display_properties: Properties | undefined;
}
