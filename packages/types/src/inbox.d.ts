import { TPaginationInfo } from "./common";
import { TIssuePriorities } from "./issues";
import { TIssue } from "./issues/base";

export type TInboxIssueCurrentTab = "open" | "closed";

export type TInboxIssueStatus = -2 | -1 | 0 | 1 | 2;

// filters
export type TInboxIssueFilterMemberKeys = "assignee" | "created_by";

export type TInboxIssueFilterDateKeys = "created_at" | "updated_at";

export type TInboxIssueFilter = {
  [key in TInboxIssueFilterMemberKeys]: string[] | undefined;
} & {
  [key in TInboxIssueFilterDateKeys]: string[] | undefined;
} & {
  status: TInboxIssueStatus[] | undefined;
  priority: TIssuePriorities[] | undefined;
  label: string[] | undefined;
};

// sorting filters
export type TInboxIssueSortingKeys = "order_by" | "sort_by";

export type TInboxIssueSortingOrderByKeys =
  | "issue__created_at"
  | "issue__updated_at"
  | "issue__sequence_id";

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
  [key in TInboxIssueFilter]: string;
} & TInboxIssueSortingOrderByQueryParam & {
    per_page: number;
    cursor: string;
  };

// inbox issue types
export type TInboxIssue = {
  id: string;
  status: TInboxIssueStatus;
  snoozed_till: Date | null;
  duplicate_to: string | null;
  source: string;
  issue: TIssue;
  created_by: string;
};

export type TInboxIssuePaginationInfo = TPaginationInfo & {
  total_results: number;
};

export type TInboxIssueWithPagination = TInboxIssuePaginationInfo & {
  results: TInboxIssue[];
};
