import type { IProjectMemberNavigationPreferences } from "./project";
import type { TIssue } from "./issues/issue";
import type { LOGICAL_OPERATOR, TSupportedOperators } from "./rich-filters";
import type { CompleteOrEmpty } from "./utils";

export type TIssueLayouts = "list" | "kanban" | "calendar" | "spreadsheet" | "gantt_chart";

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
  | "team_project"
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
  | "estimate_point__key"
  | "-estimate_point__key"
  | "start_date"
  | "-start_date"
  | "link_count"
  | "-link_count"
  | "attachment_count"
  | "-attachment_count"
  | "sub_issues_count"
  | "-sub_issues_count";

export type TIssueGroupingFilters = "active" | "backlog";

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
  | "team_project"
  | "group_by"
  | "sub_group_by"
  | "order_by"
  | "type"
  | "sub_issue"
  | "show_empty_groups"
  | "cursor"
  | "per_page"
  | "issue_type"
  | "layout"
  | "expand"
  | "filters";

export type TCalendarLayouts = "month" | "week";

/**
 * Keys for the work item filter properties
 */
export const WORK_ITEM_FILTER_PROPERTY_KEYS = [
  "state_group",
  "priority",
  "start_date",
  "target_date",
  "assignee_id",
  "mention_id",
  "created_by_id",
  "subscriber_id",
  "label_id",
  "state_id",
  "cycle_id",
  "module_id",
  "project_id",
  "created_at",
  "updated_at",
] as const;
export type TWorkItemFilterProperty = (typeof WORK_ITEM_FILTER_PROPERTY_KEYS)[number];

export type TWorkItemFilterConditionKey = `${TWorkItemFilterProperty}__${TSupportedOperators}`;

export type TWorkItemFilterConditionData = Partial<{
  [K in TWorkItemFilterConditionKey]: string | boolean | number;
}>;

export type TWorkItemFilterAndGroup = {
  [LOGICAL_OPERATOR.AND]: TWorkItemFilterConditionData[];
};

export type TWorkItemFilterGroup = TWorkItemFilterAndGroup;

export type TWorkItemFilterExpressionData = TWorkItemFilterConditionData | TWorkItemFilterGroup;

export type TWorkItemFilterExpression = CompleteOrEmpty<TWorkItemFilterExpressionData>;

export interface IIssueFilterOptions {
  assignees?: string[] | null;
  mentions?: string[] | null;
  created_by?: string[] | null;
  labels?: string[] | null;
  priority?: string[] | null;
  cycle?: string[] | null;
  module?: string[] | null;
  project?: string[] | null;
  team_project?: string[] | null;
  start_date?: string[] | null;
  state?: string[] | null;
  state_group?: string[] | null;
  subscriber?: string[] | null;
  target_date?: string[] | null;
  issue_type?: string[] | null;
}

export interface IIssueDisplayFilterOptions {
  calendar?: {
    show_weekends?: boolean;
    layout?: TCalendarLayouts;
  };
  group_by?: TIssueGroupByOptions;
  sub_group_by?: TIssueGroupByOptions;
  layout?: any; // TODO: Need to fix this and set it to enum EIssueLayoutTypes
  order_by?: TIssueOrderByOptions;
  show_empty_groups?: boolean;
  sub_issue?: boolean;
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
}

export type TIssueKanbanFilters = {
  group_by: string[];
  sub_group_by: string[];
};

export interface IIssueFilters {
  richFilters: TWorkItemFilterExpression;
  displayFilters: IIssueDisplayFilterOptions | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
  kanbanFilters: TIssueKanbanFilters | undefined;
}

export type TSupportedFilterForUpdate = IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters;

export interface ISubWorkItemFilters extends Omit<IIssueFilters, "richFilters"> {
  filters: IIssueFilterOptions;
}

export interface IIssueFiltersResponse {
  rich_filters: TWorkItemFilterExpression;
  display_filters: IIssueDisplayFilterOptions;
  display_properties: IIssueDisplayProperties;
}

export interface IProjectUserPropertiesResponse extends IIssueFiltersResponse {
  sort_order: number;
  preferences: {
    pages: {
      block_display: boolean;
    };
    navigation: IProjectMemberNavigationPreferences;
  };
}

export interface IWorkspaceUserPropertiesResponse extends IIssueFiltersResponse {
  navigation_project_limit?: number;
  navigation_control_preference?: "ACCORDION" | "TABBED";
  // Note: show_limited_projects is derived from navigation_project_limit (0 = false, >0 = true)
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
  sub_issue?: boolean;
}

export interface IProjectViewProps {
  rich_filters: TWorkItemFilterExpression;
  display_filters: IIssueDisplayFilterOptions | undefined;
}

export interface IWorkspaceViewProps {
  rich_filters: TWorkItemFilterExpression;
  display_filters: IIssueDisplayFilterOptions | undefined;
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

export type TSpreadsheetColumn = React.FC<{
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
}>;
