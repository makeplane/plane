import { StateGroup } from "components/states";
import { TIssuePriorities } from "../issues";

// issues
export * from "./issue";
export * from "./issue_reaction";
export * from "./issue_link";
export * from "./issue_attachment";
export * from "./issue_relation";
export * from "./issue_sub_issues";
export * from "./activity/base";

export type TLoader = "init-loader" | "mutation" | "pagination" | undefined;

export type TGroupedIssues = {
  [group_id: string]: string[];
};

export type TSubGroupedIssues = {
  [sub_grouped_id: string]: TGroupedIssues;
};

export type TIssues = TGroupedIssues | TSubGroupedIssues;

export type TPaginationData = {
  nextCursor: string;
  prevCursor: string;
  nextPageResults: boolean;
};

export type TIssuePaginationData = {
  [group_id: string]: TPaginationData;
};

export type TGroupedIssueCount = {
  [group_id: string]: number;
};

export type TUnGroupedIssues = string[];