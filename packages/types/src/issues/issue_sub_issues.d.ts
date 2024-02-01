import { TIssue } from "./issue";

export type TSubIssuesStateDistribution = {
  backlog: string[];
  unstarted: string[];
  started: string[];
  completed: string[];
  cancelled: string[];
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
