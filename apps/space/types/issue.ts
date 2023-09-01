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
  comments: Comment[];
  description_html: string;
  label_details: any;
  name: string;
  priority: TIssuePriorityKey | null;
  project: string;
  project_detail: any;
  reactions: IIssueReaction[];
  sequence_id: number;
  start_date: any;
  state: string;
  state_detail: any;
  target_date: any;
  votes: {
    issue: string;
    vote: -1 | 1;
    workspace: string;
    project: string;
    actor: string;
    actor_detail: ActorDetail;
  }[];
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

export interface Comment {
  id: string;
  actor_detail: ActorDetail;
  issue_detail: IssueDetail;
  project_detail: ProjectDetail;
  workspace_detail: WorkspaceDetail;
  comment_reactions: any[];
  is_member: boolean;
  created_at: Date;
  updated_at: Date;
  comment_stripped: string;
  comment_html: string;
  attachments: any[];
  access: string;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  issue: string;
  actor: string;
}

export interface IIssueReaction {
  actor_detail: ActorDetail;
  id: string;
  issue: string;
  reaction: string;
}

export interface ActorDetail {
  avatar: string;
  display_name: string;
  first_name: string;
  id: string;
  is_bot: boolean;
  last_name: string;
}

export interface IssueDetail {
  id: string;
  name: string;
  description: Description;
  description_html: string;
  priority: string;
  start_date: null;
  target_date: null;
  sequence_id: number;
  sort_order: number;
}

export interface Description {
  type: string;
  content: DescriptionContent[];
}

export interface DescriptionContent {
  type: string;
  attrs?: Attrs;
  content: ContentContent[];
}

export interface Attrs {
  level: number;
}

export interface ContentContent {
  text: string;
  type: string;
}

export interface ProjectDetail {
  id: string;
  identifier: string;
  name: string;
  cover_image: string;
  icon_prop: null;
  emoji: string;
  description: string;
}

export interface WorkspaceDetail {
  name: string;
  slug: string;
  id: string;
}

export interface IssueDetailType {
  [issueId: string]: {
    issue: IIssue;
    comments: Comment[];
    reactions: any[];
    votes: any[];
  };
}
