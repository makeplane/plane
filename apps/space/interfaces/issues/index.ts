export type TIssueRenderViews = {
  key: "list" | "board" | "calendar" | "spreadsheet" | "gantt";
  title: string;
  icon: string;
  className: string;
};

export type TIssuePriorityFilters = {
  key: "urgent" | "high" | "medium" | "low" | "none";
  title: "Urgent" | "High" | "Medium" | "Low" | "None";
  color: string;
  icon: string;
};

export type TIssueGroupKey = "backlog" | "unstarted" | "started" | "completed" | "cancelled";

export type TIssueGroupTitle = "Backlog" | "Unstarted" | "Started" | "Completed" | "Cancelled";

export type TIssueGroup = {
  key: TIssueGroupKey;
  title: TIssueGroupTitle;
  color: string;
  className: string;
  icon: React.FC;
};
