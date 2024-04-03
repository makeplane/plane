import { TPaginationInfo } from "./common";
import { TIssue } from "./issues/base";

export type TInboxIssueStatus = -2 | -1 | 0 | 1 | 2;

export type TInboxIssueFilter = {
  priority: string[] | undefined;
  label: string[] | undefined;
  assignee: string[] | undefined;
  create_by: string[] | undefined;
  created_at: string[] | undefined;
  updated_at: string[] | undefined;
  inbox_status: TInboxIssueStatus[] | undefined;
};

export type TInboxIssueSortingKeys = "order_by" | "sort_by";

export type TInboxIssueSortingOrderByKeys =
  | "created_at"
  | "updated_at"
  | "sequence_id";

export type TInboxIssueSortingSortByKeys = "asc" | "desc";

export type TInboxIssueSorting = {
  order_by: TInboxIssueSortingOrderByKeys | undefined;
  sort_by: TInboxIssueSortingSortByKeys | undefined;
};

export type TInboxIssuesQueryParams = {
  [key in TInboxIssueFilter]: string;
} & { [key in TInboxIssueSorting]: string };

export type TInboxIssue = {
  id: string;
  status: TInboxIssueStatus;
  snoozed_till: Date | null;
  duplicate_to: string | null;
  source: string;
  issue: TIssue;
  created_by: string;
};

export type TInboxIssueWithPagination = TPaginationInfo & {
  results: TInboxIssue[];
};
