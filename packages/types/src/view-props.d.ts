import { EIssueLayoutTypes } from "constants/issue";

export type TIssueLayouts =
  | "list"
  | "kanban"
  | "calendar"
  | "spreadsheet"
  | "gantt_chart";

export type TIssueGroupByOptions =
  | "state"
  | "priority"
  | "labels"
  | "created_by"
  | "state_detail.group"
  | "project"
  | "assignees"
  | "cycle"
  | "module"
  | "target_date"
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
  | "issue_module__module__name"
  | "-issue_module__module__name"
  | "issue_cycle__cycle__name"
  | "-issue_cycle__cycle__name"
  | "target_date"
  | "-target_date"
  | "estimate_point"
  | "-estimate_point"
  | "start_date"
  | "-start_date"
  | "link_count"
  | "-link_count"
  | "attachment_count"
  | "-attachment_count"
  | "sub_issues_count"
  | "-sub_issues_count"
  | "trip_reference_number"
  | "-trip_reference_number"
  | "reference_number"
  | "-reference_number"
  | "hub_code"
  | "-hub_code"
  | "hub_name"
  | "-hub_name"
  | "customer_code"
  | "-customer_code"
  | "customer_name"
  | "-customer_name"
  | "vendor_name"
  | "-vendor_name"
  | "vendor_code"
  | "-vendor_code"
  | "worker_code"
  | "-worker_code"
  | "worker_name"
  | "-worker_name"
  | string;

export type TIssueGroupingFilters = "active" | "backlog" | null;

export type TIssueExtraOptions = "show_empty_groups" | "sub_issue";

export type TIssueParams =
  | "priority"
  | "state_group"
  | "state"
  | "assignees"
  | "mentions"
  | "created_by"
  | "subscriber"
  | "labels"
  | "cycle"
  | "module"
  | "start_date"
  | "target_date"
  | "project"
  | "group_by"
  | "sub_group_by"
  | "order_by"
  | "type"
  | "sub_issue"
  | "show_empty_groups"
  | "cursor"
  | "per_page"
  | "hub_code"
  | "issue_type"
  | "layout"
  | "expand"
  | "customer_code"
  | "customer_name"
  | "worker_code"
  | "worker_name"
  | "trip_reference_number"
  | "reference_number"
  | "vendor_code"
  | "vendor_name"
  | "custom_properties"
  | "hub_code"
  | "hub_name";

export type TCalendarLayouts = "month" | "week";

export interface IIssueFilterOptions {
  assignees?: string[] | null;
  mentions?: string[] | null;
  created_by?: string[] | null;
  labels?: string[] | null;
  priority?: string[] | null;
  cycle?: string[] | null;
  module?: string[] | null;
  project?: string[] | null;
  start_date?: string[] | null;
  state?: string[] | null;
  state_group?: string[] | null;
  subscriber?: string[] | null;
  target_date?: string[] | null;
  issue_type?: string[] | null;
  hub_code?: string[] | null;
  hub_name?: string[] | null;
  customer_code?: string[] | null;
  customer_name?: string[] | null;
  worker_code?: string[] | null;
  worker_name?: string[] | null;
  trip_reference_number?: string[] | null;
  reference_number?: string[] | null;
  vendor_code?: string[] | null;
  vendor_name?: string[] | null;
  custom_properties?: string[] | null;
}

export interface IIssueDisplayFilterOptions {
  calendar?: {
    show_weekends?: boolean;
    layout?: TCalendarLayouts;
  };
  group_by?: TIssueGroupByOptions;
  sub_group_by?: TIssueGroupByOptions;
  layout?: EIssueLayoutTypes;
  order_by?: TIssueOrderByOptions;
  show_empty_groups?: boolean;
  sub_issue?: boolean;
  type?: TIssueGroupingFilters;
}
export interface IIssueDisplayProperties {
  assignee?: boolean;
  start_date?: boolean;
  due_date?: boolean;
  labels?: boolean;
  key?: boolean;
  priority?: boolean;
  state?: boolean;
  sub_issue_count?: boolean;
  link?: boolean;
  attachment_count?: boolean;
  estimate?: boolean;
  created_on?: boolean;
  updated_on?: boolean;
  modules?: boolean;
  cycle?: boolean;
  issue_type?: boolean;
  trip_reference_number?: boolean;
  reference_number?: boolean;
  hub_code?: boolean;
  hub_name?: boolean;
  customer_code?: boolean;
  customer_name?: boolean;
  vendor_name?: boolean;
  vendor_code?: boolean;
  worker_code?: boolean;
  worker_name?: boolean;
  custom_properties?: Record<string, boolean>;
  [key: string]: boolean;
}

export type TIssueKanbanFilters = {
  group_by: string[];
  sub_group_by: string[];
};

export interface IIssueFilters {
  filters: IIssueFilterOptions | undefined;
  displayFilters: IIssueDisplayFilterOptions | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
  kanbanFilters: TIssueKanbanFilters | undefined;
}

export interface IIssueFiltersResponse {
  filters: IIssueFilterOptions;
  display_filters: IIssueDisplayFilterOptions;
  display_properties: IIssueDisplayProperties;
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
  display_properties: IIssueDisplayProperties;
}
export interface IWorkspaceGlobalViewProps {
  filters: IWorkspaceIssueFilterOptions;
  display_filters: IWorkspaceIssueDisplayFilterOptions | undefined;
  display_properties: IIssueDisplayProperties;
}

export interface IssuePaginationOptions {
  canGroup: boolean;
  perPageCount: number;
  before?: string;
  after?: string;
  groupedBy?: TIssueGroupByOptions;
  subGroupedBy?: TIssueGroupByOptions;
  orderBy?: TIssueOrderByOptions;
}
