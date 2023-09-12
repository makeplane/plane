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
  layout?: TIssueViewOptions;
  order_by?: TIssueOrderByOptions;
  show_empty_groups?: boolean;
  start_target_date?: boolean;
  sub_issue?: boolean;
  type?: "active" | "backlog" | null;
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
