export type TLayouts = "list" | "kanban" | "calendar" | "spreadsheet" | "gantt";

export type TCalendarLayouts = "month" | "week";

export type TFilters = {
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

export type TDisplayFilters = {
  layout: TLayouts;
  group_by: string | undefined;
  sub_group_by: string | undefined;
  order_by: string;
  type: string | undefined;
  sub_issue: boolean;
  show_empty_groups: boolean;
  calendar: {
    show_weekends: boolean;
    layout: TCalendarLayouts;
  };
};

export type TDisplayProperties = {
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

export type TFilterProps = {
  filters: TFilters;
  display_filters: TDisplayFilters;
  display_properties: TDisplayProperties;
};

export type TFilterPartialProps = {
  filters: Partial<TFilters>;
  display_filters: Partial<TDisplayFilters>;
  display_properties: Partial<TDisplayProperties>;
};

export type TFilterQueryParams =
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
