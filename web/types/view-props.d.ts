export type TIssueLayouts = "list" | "kanban" | "calendar" | "spreadsheet" | "gantt_chart";

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

export type TIssueTypeFilters = "active" | "backlog" | null;

export type TIssueExtraOptions = "show_empty_groups" | "sub_issue";

export type TIssueParams =
  | "priority"
  | "state_group"
  | "state"
  | "assignees"
  | "created_by"
  | "subscriber"
  | "labels"
  | "start_date"
  | "target_date"
  | "project"
  | "group_by"
  | "sub_group_by"
  | "order_by"
  | "type"
  | "sub_issue"
  | "show_empty_groups"
  | "start_target_date";

export type TCalendarLayouts = "month" | "week";

export interface IIssueFilterOptions {
  assignees?: string[] | null;
  created_by?: string[] | null;
  labels?: string[] | null;
  priority?: string[] | null;
  project?: string[] | null;
  start_date?: string[] | null;
  state?: string[] | null;
  state_group?: string[] | null;
  subscriber?: string[] | null;
  target_date?: string[] | null;
}

export interface IIssueDisplayFilterOptions {
  calendar?: {
    show_weekends?: boolean;
    layout?: TCalendarLayouts;
  };
  group_by?: TIssueGroupByOptions;
  sub_group_by?: TIssueGroupByOptions;
  layout?: TIssueLayouts;
  order_by?: TIssueOrderByOptions;
  show_empty_groups?: boolean;
  start_target_date?: boolean;
  sub_issue?: boolean;
  type?: TIssueTypeFilters;
}
export interface IIssueDisplayProperties {
  assignee: boolean;
  start_date: boolean;
  due_date: boolean;
  labels: boolean;
  key: boolean;
  priority: boolean;
  state: boolean;
  sub_issue_count: boolean;
  link: boolean;
  attachment_count: boolean;
  estimate: boolean;
  created_on: boolean;
  updated_on: boolean;
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

export interface IWorkspaceGlobalViewDisplayFilterOptions {
  order_by?: string | undefined;
  type?: "active" | "backlog" | null;
  sub_issue?: boolean;
  layout?: TIssueViewOptions;
}

export interface IWorkspaceViewIssuesParams {
  assignees?: string | undefined;
  created_by?: string | undefined;
  labels?: string | undefined;
  priority?: string | undefined;
  start_date?: string | undefined;
  state?: string | undefined;
  state_group?: string | undefined;
  subscriber?: string | undefined;
  target_date?: string | undefined;
  project?: string | undefined;
  order_by?: string | undefined;
  type?: "active" | "backlog" | undefined;
  sub_issue?: boolean;
}

export interface IProjectViewProps {
  display_filters: IIssueDisplayFilterOptions | undefined;
  filters: IIssueFilterOptions;
}

export interface IWorkspaceViewProps {
  filters: IIssueFilterOptions;
  display_filters: IIssueDisplayFilterOptions | undefined;
  display_properties: Properties;
}
export interface IWorkspaceGlobalViewProps {
  filters: IWorkspaceIssueFilterOptions;
  display_filters: IWorkspaceIssueDisplayFilterOptions | undefined;
  display_properties: Properties;
}
