import type { TIssue } from "./issue";

export type TSubIssuesStateDistribution = {
  backlog: string[];
  unstarted: string[];
  started: string[];
  completed: string[];
  cancelled: string[];
};

export type TIssueSubIssues = {
  state_distribution: TSubIssuesStateDistribution;
  sub_issues: TSubIssueResponse;
};

export type TSubIssueResponse = TIssue[] | { [key: string]: TIssue[] };

export type TIssueSubIssuesStateDistributionMap = {
  [issue_id: string]: TSubIssuesStateDistribution;
};

export type TIssueSubIssuesIdMap = {
  [issue_id: string]: string[];
};

export type TSubIssueOperations = {
  copyLink: (path: string) => void;
  fetchSubIssues: (workspaceSlug: string, projectId: string, parentIssueId: string) => Promise<void>;
  addSubIssue: (workspaceSlug: string, projectId: string, parentIssueId: string, issueIds: string[]) => Promise<void>;
  updateSubIssue: (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    issueId: string,
    issueData: Partial<TIssue>,
    oldIssue?: Partial<TIssue>,
    fromModal?: boolean
  ) => Promise<void>;
  removeSubIssue: (workspaceSlug: string, projectId: string, parentIssueId: string, issueId: string) => Promise<void>;
  deleteSubIssue: (workspaceSlug: string, projectId: string, parentIssueId: string, issueId: string) => Promise<void>;
};
