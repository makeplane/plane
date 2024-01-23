export type TInboxFilterOptions = {
  priority: string[] | undefined;
  inbox_status: number[] | undefined;
};

export type TInboxQueryParams = {
  priority: string;
  inbox_status: string;
};

export type TInboxFilters = { filters: TInboxFilterOptions };

export type TInbox = {
  id: string;
  name: string;
  description: string;
  workspace: string;
  project: string;
  is_default: boolean;
  view_props: TInboxFilters;
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
  pending_issue_count: number;
};

export type TInboxDetailMap = Record<string, TInbox>; // inbox_id -> TInbox

export type TInboxDetailIdMap = Record<string, string[]>; // project_id -> inbox_id[]
