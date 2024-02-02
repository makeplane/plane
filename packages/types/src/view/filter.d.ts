export type TViewLayouts =
  | "list"
  | "kanban"
  | "calendar"
  | "spreadsheet"
  | "gantt";

export type TViewCalendarLayouts = "month" | "week";

export type TViewFilters = {
  project: string[];
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
  group_by: string | undefined;
  sub_group_by: string | undefined;
  order_by: string;
  type: string | undefined;
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
  filters: TViewFilters | undefined;
  display_filters: TViewDisplayFilters | undefined;
  display_properties: TViewDisplayProperties | undefined;
};

export type TViewFilterPartialProps = {
  filters: Partial<TViewFilters> | undefined;
  display_filters: Partial<TViewDisplayFilters> | undefined;
  display_properties: Partial<TViewDisplayProperties> | undefined;
};

export type TViewFilterQueryParams =
  | "project"
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
