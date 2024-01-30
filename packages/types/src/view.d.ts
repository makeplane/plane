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

export type TView = {
  id: string;
  workspace: string;
  project: string | undefined;
  name: string;
  description: string;
  query: string;
  filters: TViewFilters;
  display_filters: TViewDisplayFilters;
  display_properties: TViewDisplayProperties;
  access: TViewAccess;
  owned_by: string;
  sort_order: number;
  is_locked: boolean;
  is_pinned: boolean;
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
};
