export type TIssueLayout = "list" | "kanban" | "calendar" | "spreadsheet" | "gantt";
export type TIssueLayoutOptions = {
  [key in TIssueLayout]: boolean;
};
export type TIssueLayoutViews = {
  [key in TIssueLayout]: { title: string; icon: string; className: string };
};

export type TIssueFilterPriority = "urgent" | "high" | "medium" | "low" | "none";
export type TIssueFilterPriorityObject = {
  key: TIssueFilterPriority;
  title: string;
  className: string;
  icon: string;
};

export type TIssueFilterState = "backlog" | "unstarted" | "started" | "completed" | "cancelled";
export type TIssueFilterStateObject = {
  key: TIssueFilterState;
  title: string;
  color: string;
  className: string;
};

export type TIssueFilterKeys = "priority" | "state" | "labels";

export type TDisplayFilters = {
  layout: TIssueLayout;
};

export type TFilters = {
  state: TIssueFilterState[];
  priority: TIssueFilterPriority[];
  labels: string[];
};

export type TIssueFilters = {
  display_filters: TDisplayFilters;
  filters: TFilters;
};

export type TIssueQueryFilters = Partial<TFilters>;

export type TIssueQueryFiltersParams = Partial<Record<keyof TFilters, string>>;

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

export type IPeekMode = "side" | "modal" | "full";

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

export type TIssueGroupByOptions = "state" | "priority" | "labels" | null;

export type TIssueParams = "priority" | "state" | "labels";

export interface IIssueFilterOptions {
  state?: string[] | null;
  labels?: string[] | null;
  priority?: string[] | null;
}

// issues
export interface IGroupedIssues {
  [group_id: string]: string[];
}

export interface ISubGroupedIssues {
  [sub_grouped_id: string]: {
    [group_id: string]: string[];
  };
}

export type TUnGroupedIssues = string[];

export interface IIssueResponse {
  [issue_id: string]: IIssue;
}

export type TLoader = "init-loader" | "mutation" | undefined;

export interface ViewFlags {
  enableQuickAdd: boolean;
  enableIssueCreation: boolean;
  enableInlineEditing: boolean;
}
