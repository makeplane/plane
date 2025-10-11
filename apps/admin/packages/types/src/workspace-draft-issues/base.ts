import { TIssuePriorities } from "../issues";

export type TWorkspaceDraftIssue = {
  id: string;
  name: string;
  sort_order: number;

  state_id: string | undefined;
  priority: TIssuePriorities | undefined;
  label_ids: string[];
  assignee_ids: string[];
  estimate_point: string | undefined;

  project_id: string | undefined;
  parent_id: string | undefined;
  cycle_id: string | undefined;
  module_ids: string[] | undefined;

  start_date: string | undefined;
  target_date: string | undefined;
  completed_at: string | undefined;

  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;

  is_draft: boolean;

  type_id: string;
};

export type TWorkspaceDraftPaginationInfo<T> = {
  next_cursor: string | undefined;
  prev_cursor: string | undefined;
  next_page_results: boolean | undefined;
  prev_page_results: boolean | undefined;
  total_pages: number | undefined;
  count: number | undefined; // current paginated results count
  total_count: number | undefined; // total available results count
  total_results: number | undefined;
  results: T[] | undefined;
  extra_stats: string | undefined;
  grouped_by: string | undefined;
  sub_grouped_by: string | undefined;
};

export type TWorkspaceDraftQueryParams = {
  per_page: number;
  cursor: string;
};

export type TWorkspaceDraftIssueLoader =
  | "init-loader"
  | "empty-state"
  | "mutation"
  | "pagination"
  | "loaded"
  | "create"
  | "update"
  | "delete"
  | "move"
  | undefined;
