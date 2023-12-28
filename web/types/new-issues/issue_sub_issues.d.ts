import { TIssue } from "./issue";

export type TSubIssuesStateDistribution = {
  backlog: number;
  unstarted: number;
  started: number;
  completed: number;
  cancelled: number;
};

export type TIssueSubIssues = {
  state_distribution: TSubIssuesStateDistribution;
  sub_issues: TIssue[];
};

export type TIssueSubIssuesStateDistributionMap = {
  [issue_id: string]: TSubIssuesStateDistribution;
};

export type TIssueSubIssuesIdMap = {
  [issue_id: string]: string[];
};
