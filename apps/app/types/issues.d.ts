import { KeyedMutator } from "swr";
import type {
  IState,
  IUser,
  IProject,
  ICycle,
  IModule,
  IUserLite,
  IProjectLite,
  IWorkspaceLite,
  IStateLite,
  TStateGroups,
  Properties,
} from "types";

export interface IIssueCycle {
  id: string;
  cycle_detail: ICycle;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  issue: string;
  cycle: string;
}

export interface IIssueModule {
  created_at: Date;
  created_by: string;
  id: string;
  issue: string;
  module: string;
  module_detail: IModule;
  project: string;
  updated_at: Date;
  updated_by: string;
  workspace: string;
}

export interface IIssueParent {
  description: any;
  id: string;
  name: string;
  priority: string | null;
  project_detail: IProjectLite;
  sequence_id: number;
  start_date: string | null;
  state_detail: IStateLite;
  target_date: string | null;
}

export interface IIssueLink {
  title: string;
  url: string;
}

export interface linkDetails {
  created_at: Date;
  created_by: string;
  created_by_detail: IUserLite;
  id: string;
  metadata: any;
  title: string;
  url: string;
}

export interface IIssue {
  archived_at: string;
  assignees: string[];
  assignee_details: IUser[];
  assignees_list: string[];
  attachment_count: number;
  attachments: any[];
  blocked_issues: { blocked_issue_detail?: BlockeIssueDetail }[];
  blocker_issues: { blocker_issue_detail?: BlockeIssueDetail }[];
  blockers_list: string[];
  blocks_list: string[];
  bridge_id?: string | null;
  completed_at: Date;
  created_at: string;
  created_by: string;
  cycle: string | null;
  cycle_id: string | null;
  cycle_detail: ICycle | null;
  description: any;
  description_html: any;
  description_stripped: any;
  estimate_point: number | null;
  id: string;
  issue_cycle: IIssueCycle | null;
  issue_link: linkDetails[];
  issue_module: IIssueModule | null;
  labels: string[];
  label_details: any[];
  labels_list: string[];
  links_list: IIssueLink[];
  link_count: number;
  module: string | null;
  module_id: string | null;
  name: string;
  parent: string | null;
  parent_detail: IIssueParent | null;
  priority: string | null;
  project: string;
  project_detail: IProjectLite;
  sequence_id: number;
  sort_order: number;
  sprints: string | null;
  start_date: string | null;
  state: string;
  state_detail: IState;
  sub_issues_count: number;
  target_date: string | null;
  updated_at: string;
  updated_by: string;
  workspace: string;
  workspace_detail: IWorkspaceLite;
}

export interface ISubIssuesState {
  backlog: number;
  unstarted: number;
  started: number;
  completed: number;
  cancelled: number;
}

export interface ISubIssueResponse {
  state_distribution: ISubIssuesState;
  sub_issues: IIssue[];
}

export interface BlockeIssueDetail {
  id: string;
  name: string;
  sequence_id: number;
  project_detail: IProjectLite;
}

export type IssuePriorities = {
  id: string;
  created_at: Date;
  updated_at: Date;
  uuid: string;
  properties: Properties;
  created_by: number;
  updated_by: number;
  user: string;
};

export interface IIssueLabels {
  id: string;
  created_at: Date;
  updated_at: Date;
  name: string;
  description: string;
  color: string;
  created_by: string;
  updated_by: string;
  project: string;
  project_detail: IProjectLite;
  workspace: string;
  workspace_detail: IWorkspaceLite;
  parent: string | null;
}

export interface IIssueActivity {
  actor: string;
  actor_detail: IUserLite;
  attachments: any[];
  comment: string;
  created_at: Date;
  created_by: string;
  field: string | null;
  id: string;
  issue: string | null;
  issue_comment: string | null;
  issue_detail: {
    description: any;
    description_html: string;
    id: string;
    name: string;
    priority: string | null;
    sequence_id: string;
  } | null;
  new_identifier: string | null;
  new_value: string | null;
  old_identifier: string | null;
  old_value: string | null;
  project: string;
  project_detail: IProjectLite;
  updated_at: Date;
  updated_by: string;
  verb: string;
  workspace: string;
}

export interface IIssueComment extends IIssueActivity {
  comment_html: string;
  comment_json: any;
  comment_stripped: string;
}

export interface IIssueLite {
  id: string;
  name: string;
  project_id: string;
  start_date?: string | null;
  target_date?: string | null;
  workspace__slug: string;
}

export interface IIssueFilterOptions {
  type: "active" | "backlog" | null;
  assignees: string[] | null;
  start_date: string[] | null;
  target_date: string[] | null;
  state: string[] | null;
  state_group: TStateGroups[] | null;
  subscriber: string[] | null;
  labels: string[] | null;
  priority: string[] | null;
  created_by: string[] | null;
}

export type TIssueViewOptions = "list" | "kanban" | "calendar" | "spreadsheet" | "gantt_chart";

export type TIssueGroupByOptions =
  | "state"
  | "priority"
  | "labels"
  | "created_by"
  | "state_detail.group"
  | "project"
  | "assignees"
  | null;

export type TIssueOrderByOptions =
  | "-created_at"
  | "-updated_at"
  | "priority"
  | "sort_order"
  | "state__name"
  | "-state__name"
  | "assignees__name"
  | "-assignees__name"
  | "labels__name"
  | "-labels__name"
  | "target_date"
  | "-target_date"
  | "estimate__point"
  | "-estimate__point";

export interface IIssueViewOptions {
  group_by: TIssueGroupByOptions;
  order_by: TIssueOrderByOptions;
  filters: IIssueFilterOptions;
}

export interface IIssueAttachment {
  asset: string;
  attributes: {
    name: string;
    size: number;
  };
  created_at: string;
  created_by: string;
  id: string;
  issue: string;
  project: string;
  updated_at: string;
  updated_by: string;
  workspace: string;
}

export interface IIssueViewProps {
  groupedIssues: { [key: string]: IIssue[] } | undefined;
  groupByProperty: TIssueGroupByOptions;
  isEmpty: boolean;
  issueView: TIssueViewOptions;
  mutateIssues: KeyedMutator<
    | IIssue[]
    | {
        [key: string]: IIssue[];
      }
  >;
  orderBy: TIssueOrderByOptions;
  params: any;
  properties: Properties;
  showEmptyGroups: boolean;
}
