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
  | "-updated_at"
  | "priority"
  | "sort_order"
  | "state__name"
  | "-state__name"
  | "assignees__name"
  | "-assignees__name"
  | "labels__name"
  | "-labels__name"
  | "target_date"
  | "-target_date"
  | "estimate__point"
  | "-estimate__point"
  | "start_date"
  | "-start_date";

export type TIssueTypeFilters = "active" | "backlog" | null;

export interface IIssueFilterOptions {
  assignees?: string[] | null;
  created_by?: string[] | null;
  labels?: string[] | null;
  priority?: string[] | null;
  start_date?: string[] | null;
  state?: string[] | null;
  state_group?: TStateGroups[] | null;
  subscriber?: string[] | null;
  target_date?: string[] | null;
}

export interface IIssueDisplayFilterOptions {
  calendar_date_range?: string;
  group_by?: TIssueGroupByOptions;
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

export interface IProjectViewProps {
  display_filters: IIssueDisplayFilterOptions | undefined;
  filters: IIssueFilterOptions;
}

export interface IWorkspaceViewProps {
  display_filters: IIssueDisplayFilterOptions | undefined;
  display_properties: Properties | undefined;
  filters: IIssueFilterOptions;
}
