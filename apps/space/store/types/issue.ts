export type TIssueBoardKeys = "list" | "kanban" | "calendar" | "spreadsheet" | "gantt";

export interface IIssueBoardViews {
  key: TIssueBoardKeys;
  title: string;
  icon: string;
  className: string;
}

export type TIssuePriorityKey = "urgent" | "high" | "medium" | "low" | "none";
export type TIssuePriorityTitle = "Urgent" | "High" | "Medium" | "Low" | "None";
export interface IIssuePriorityFilters {
  key: TIssuePriorityKey;
  title: TIssuePriorityTitle;
  className: string;
  icon: string;
}

export type TIssueGroupKey = "backlog" | "unstarted" | "started" | "completed" | "cancelled";
export type TIssueGroupTitle = "Backlog" | "Unstarted" | "Started" | "Completed" | "Cancelled";

export interface IIssueGroup {
  key: TIssueGroupKey;
  title: TIssueGroupTitle;
  color: string;
  className: string;
  icon: React.FC;
}

export interface IIssue {
  id: string;
  sequence_id: number;
  name: string;
  description_html: string;
  priority: TIssuePriorityKey | null;
  state: string;
  state_detail: any;
  label_details: any;
  target_date: any;
}

export interface IIssueState {
  id: string;
  name: string;
  group: TIssueGroupKey;
  color: string;
}

export interface IIssueLabel {
  id: string;
  name: string;
  color: string;
}

export interface IIssueStore {
  currentIssueBoardView: TIssueBoardKeys | null;
  loader: boolean;
  error: any | null;

  states: IIssueState[] | null;
  labels: IIssueLabel[] | null;
  issues: IIssue[] | null;

  userSelectedStates: string[];
  userSelectedLabels: string[];

  getCountOfIssuesByState: (state: string) => number;
  getFilteredIssuesByState: (state: string) => IIssue[];

  setCurrentIssueBoardView: (view: TIssueBoardKeys) => void;
  getIssuesAsync: (workspace_slug: string, project_slug: string) => Promise<void>;
}
