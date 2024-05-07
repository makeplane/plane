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
  state_detail: {
    id: string;
    name: string;
    group: TIssueGroupKey;
    color: string;
  };
  target_date: any;
  votes: IVote[];
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

export interface IVote {
  issue: string;
  vote: -1 | 1;
  workspace: string;
  project: string;
  actor: string;
  actor_detail: ActorDetail;
}

export interface Comment {
  actor_detail: ActorDetail;
  access: string;
  actor: string;
  attachments: any[];
  comment_html: string;
  comment_reactions: {
    actor_detail: ActorDetail;
    comment: string;
    id: string;
    reaction: string;
  }[];
  comment_stripped: string;
  created_at: Date;
  created_by: string;
  id: string;
  is_member: boolean;
  issue: string;
  issue_detail: IssueDetail;
  project: string;
  project_detail: ProjectDetail;
  updated_at: Date;
  updated_by: string;
  workspace: string;
  workspace_detail: WorkspaceDetail;
}

export interface IIssueReaction {
  actor_detail: ActorDetail;
  id: string;
  issue: string;
  reaction: string;
}

export interface ActorDetail {
  avatar?: string;
  display_name?: string;
  first_name?: string;
  id?: string;
  is_bot?: boolean;
  last_name?: string;
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
