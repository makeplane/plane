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

export type TIssueGroup = { issueIds: string[]; issueCount: number };
export type TGroupedIssues = {
  [group_id: string]: TIssueGroup;
};

export type TSubGroupedIssues = {
  [sub_grouped_id: string]: TGroupedIssues;
};
export type TUnGroupedIssues = {
  "All Issues": TIssueGroup;
};

export type TIssues = TGroupedIssues | TUnGroupedIssues;
