export type TEpicAnalyticsGroup =
  | "backlog_issues"
  | "unstarted_issues"
  | "started_issues"
  | "completed_issues"
  | "cancelled_issues"
  | "overdue_issues";

export type TEpicAnalytics = {
  backlog_issues: number;
  unstarted_issues: number;
  started_issues: number;
  completed_issues: number;
  cancelled_issues: number;
  overdue_issues: number;
};
