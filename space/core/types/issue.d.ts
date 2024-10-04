import { IWorkspaceLite, TIssue, TIssuePriorities, TStateGroups } from "@plane/types";

export type TIssueLayout = "list" | "kanban" | "calendar" | "spreadsheet" | "gantt";
export type TIssueLayoutOptions = {
  [key in TIssueLayout]: boolean;
};

export type TIssueFilterPriorityObject = {
  key: TIssuePriorities;
  title: string;
  className: string;
  icon: string;
};

export type TIssueFilterKeys = "priority" | "state" | "labels";

export type TDisplayFilters = {
  layout: TIssueLayout;
};

export type TFilters = {
  state: TStateGroups[];
  priority: TIssuePriorities[];
  labels: string[];
};

export type TIssueFilters = {
  display_filters: TDisplayFilters;
  filters: TFilters;
};

export type TIssueQueryFilters = Partial<TFilters>;

export type TIssueQueryFiltersParams = Partial<Record<keyof TFilters, string>>;

export interface IIssue
  extends Pick<
    TIssue,
    | "description_html"
    | "created_at"
    | "updated_at"
    | "created_by"
    | "id"
    | "name"
    | "priority"
    | "state_id"
    | "project_id"
    | "sequence_id"
    | "sort_order"
    | "start_date"
    | "target_date"
    | "cycle_id"
    | "module_ids"
    | "label_ids"
    | "assignee_ids"
    | "attachment_count"
    | "sub_issues_count"
    | "link_count"
    | "estimate_point"
  > {
  comments: Comment[];
  reaction_items: IIssueReaction[];
  vote_items: IVote[];
}

export type IPeekMode = "side" | "modal" | "full";

type TIssueResponseResults =
  | IIssue[]
  | {
      [key: string]: {
        results:
          | IIssue[]
          | {
              [key: string]: {
                results: IIssue[];
                total_results: number;
              };
            };
        total_results: number;
      };
    };

export type TIssuesResponse = {
  grouped_by: string;
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
  total_count: number;
  count: number;
  total_pages: number;
  extra_stats: null;
  results: TIssueResponseResults;
};

export interface IIssueLabel {
  id: string;
  name: string;
  color: string;
  parent: string | null;
}

export interface IVote {
  vote: -1 | 1;
  actor_details: ActorDetail;
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
  workspace_detail: IWorkspaceLite;
}

export interface IIssueReaction {
  actor_details: ActorDetail;
  reaction: string;
}

export interface ActorDetail {
  avatar_url?: string;
  display_name?: string;
  first_name?: string;
  is_bot?: boolean;
  id?: string;
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

export interface IIssueFilterOptions {
  state?: string[] | null;
  labels?: string[] | null;
  priority?: string[] | null;
}
