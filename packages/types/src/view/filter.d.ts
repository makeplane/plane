export type TViewLayouts =
  | "list"
  | "kanban"
  | "calendar"
  | "spreadsheet"
  | "gantt";

export type TViewDisplayFiltersGrouped =
  | "project"
  | "state_detail.group"
  | "state"
  | "priority"
  | "labels"
  | "created_by"
  | "assignees"
  | "mentions"
  | "modules"
  | "cycles";

export type TViewDisplayFiltersOrderBy =
  | "sort_order"
  | "created_at"
  | "-created_at"
  | "updated_at"
  | "-updated_at"
  | "start_date"
  | "-start_date"
  | "target_date"
  | "-target_date"
  | "state__name"
  | "-state__name"
  | "priority"
  | "-priority"
  | "labels__name"
  | "-labels__name"
  | "assignees__first_name"
  | "-assignees__first_name"
  | "estimate_point"
  | "-estimate_point"
  | "link_count"
  | "-link_count"
  | "attachment_count"
  | "-attachment_count"
  | "sub_issues_count"
  | "-sub_issues_count";

export type TViewDisplayFiltersType = "active" | "backlog";

export type TViewCalendarLayouts = "month" | "week";

export type TViewFilters = {
  project: string[];
  module: string[];
  cycle: string[];
  priority: string[];
  state: string[];
  state_group: string[];
  assignees: string[];
  mentions: string[];
  subscriber: string[];
  created_by: string[];
  labels: string[];
  start_date: string[];
  target_date: string[];
};

export type TViewDisplayFilters = {
  layout: TViewLayouts;
  group_by: TViewDisplayFiltersGrouped | undefined;
  sub_group_by: TViewDisplayFiltersGrouped | undefined;
  order_by: TViewDisplayFiltersOrderBy | string;
  type: TViewDisplayFiltersType | undefined;
  sub_issue: boolean;
  show_empty_groups: boolean;
  calendar: {
    show_weekends: boolean;
    layout: TViewCalendarLayouts;
  };
};

export type TViewDisplayProperties = {
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
};

export type TViewFilterProps = {
  filters: TViewFilters;
  display_filters: TViewDisplayFilters;
  display_properties: TViewDisplayProperties;
};

export type TViewFilterPartialProps = {
  filters: Partial<TViewFilters>;
  display_filters: Partial<TViewDisplayFilters>;
  display_properties: Partial<TViewDisplayProperties>;
};

export type TViewFilterQueryParams =
  | "project"
  | "module"
  | "cycle"
  | "priority"
  | "state"
  | "state_group"
  | "assignees"
  | "mentions"
  | "subscriber"
  | "created_by"
  | "labels"
  | "start_date"
  | "target_date"
  | "type"
  | "sub_issue";
