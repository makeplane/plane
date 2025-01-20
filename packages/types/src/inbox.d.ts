import { TPaginationInfo } from "./common";
import { TIssuePriorities } from "./issues";
import { TIssue } from "./issues/base";

// filters
export type TInboxIssueFilterMemberKeys = "assignees" | "created_by";

export type TInboxIssueFilterDateKeys = "created_at" | "updated_at";

export type TInboxIssueFilter = {
  [key in TInboxIssueFilterMemberKeys]: string[] | undefined;
} & {
  [key in TInboxIssueFilterDateKeys]: string[] | undefined;
} & {
  state: string[] | undefined;
  status: TInboxIssueStatus[] | undefined;
  priority: TIssuePriorities[] | undefined;
  labels: string[] | undefined;
};

// sorting filters
export type TInboxIssueSortingKeys = "order_by" | "sort_by";

export type TInboxIssueSortingOrderByKeys = "issue__created_at" | "issue__updated_at" | "issue__sequence_id";

export type TInboxIssueSortingSortByKeys = "asc" | "desc";

export type TInboxIssueSorting = {
  order_by: TInboxIssueSortingOrderByKeys | undefined;
  sort_by: TInboxIssueSortingSortByKeys | undefined;
};

// filtering and sorting types for query params
export type TInboxIssueSortingOrderByQueryParamKeys =
  | "issue__created_at"
  | "-issue__created_at"
  | "issue__updated_at"
  | "-issue__updated_at"
  | "issue__sequence_id"
  | "-issue__sequence_id";

export type TInboxIssueSortingOrderByQueryParam = {
  order_by: TInboxIssueSortingOrderByQueryParamKeys;
};

export type TInboxIssuesQueryParams = {
  [key in keyof TInboxIssueFilter]: string;
} & TInboxIssueSortingOrderByQueryParam & {
    per_page: number;
    cursor: string;
  };

// inbox issue types

export type TInboxDuplicateIssueDetails = {
  id: string;
  sequence_id: string;
  name: string;
};

export type TInboxIssuePaginationInfo = TPaginationInfo & {
  total_results: number;
};

export type TInboxIssueWithPagination = TInboxIssuePaginationInfo & {
  results: TInboxIssue[];
};

export type TInboxForm = {
  anchor: string;
  id: string;
  is_in_app_enabled: boolean;
  is_form_enabled: boolean;
};

export type TInboxIssueForm = {
  name: string;
  description: string;
  username: string;
  email: string;
};
