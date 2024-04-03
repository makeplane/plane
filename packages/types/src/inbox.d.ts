import { TPaginationInfo } from "./common";
import { TIssuePriorities } from "./issues";
import { TIssue } from "./issues/base";

export type TInboxIssueStatus = -2 | -1 | 0 | 1 | 2;

export type TInboxIssueFilterMemberKeys = "assignee" | "created_by";

export type TInboxIssueFilterDateKeys = "created_at" | "updated_at";

export type TInboxIssueFilter = {
  [key in TInboxIssueFilterMemberKeys]: string[] | undefined;
} & {
  [key in TInboxIssueFilterDateKeys]: string[] | undefined;
} & {
  inbox_status: TInboxIssueStatus[] | undefined;
  priority: TIssuePriorities[] | undefined;
  label: string[] | undefined;
};

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
