export type TInboxIssueFilterOptions = {
  priority: string[];
  inbox_status: number[];
};

export type TInboxIssueQueryParams = "priority" | "inbox_status";

export type TInboxIssueFilters = { filters: TInboxIssueFilterOptions };

export type TInbox = {
  id: string;
  name: string;
  description: string;
  workspace: string;
  project: string;
  is_default: boolean;
  view_props: TInboxIssueFilters;
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
  pending_issue_count: number;
};

export type TInboxDetailMap = Record<string, TInbox>; // inbox_id -> TInbox

export type TInboxDetailIdMap = Record<string, string[]>; // project_id -> inbox_id[]
