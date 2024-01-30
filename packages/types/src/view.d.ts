declare enum EGlobalViewAccess {
  "public" = 0,
  "private" = 1,
  "shared" = 2,
}

export type TViewAccess =
  | EGlobalViewAccess.public
  | EGlobalViewAccess.private
  | EGlobalViewAccess.shared;

export type TViewLayouts =
  | "list"
  | "kanban"
  | "calendar"
  | "spreadsheet"
  | "gantt";

export type TViewFilters = {
  project: string[];
  priority: string[];
  state: string[];
  state_group: string[];
  assignees: string[];
  mentions: string[];
  created_by: string[];
  label: string[];
  start_date: string[];
  target_date: string[];
};

export type TViewDisplayFilters = {
  group_by: string;
  sub_group_by: string;
  order_by: string;
  issue_type: string;
  layout: TViewLayouts;
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

export type TView = {
  readonly id: string;
  readonly workspace: string;
  readonly project: string | undefined;
  name: string;
  description: string;
  readonly query: string;
  filters: TViewFilters;
  display_filters: TViewDisplayFilters;
  display_properties: TViewDisplayProperties;
  readonly access: TViewAccess;
  readonly owned_by: string;
  readonly sort_order: number;
  readonly is_locked: boolean;
  readonly is_pinned: boolean;
  readonly is_favorite: boolean;
  readonly created_by: string;
  readonly updated_by: string;
  readonly created_at: Date;
  readonly updated_at: Date;
};
