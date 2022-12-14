import type { IState, IUser, IProject, ICycle, IModule, IUserLite } from "./";

export interface IssueResponse {
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
  count: number;
  total_pages: number;
  extra_stats: null;
  results: IIssue[];
}

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

export interface IIssueCycle {
  created_at: Date;
  created_by: string;
  cycle: string;
  cycle_detail: ICycle;
  id: string;
  issue: string;
  project: string;
  updated_at: Date;
  updated_by: string;
  workspace: string;
}

export interface IIssue {
  id: string;
  state_detail: IState;
  label_details: any[];
  assignee_details: IUser[];
  assignees_list: string[];
  blocked_by_issue_details: any[];
  blocked_issues: BlockeIssue[];
  blocker_issues: BlockeIssue[];
  blockers_list: string[];
  blocked_list: string[];
  blocks_list: string[];
  created_at: Date;
  updated_at: Date;
  name: string;
  issue_cycle: IIssueCycle | null;
  issue_module: IIssueModule | null;
  description: any;
  description_html: any;
  priority: string | null;
  start_date: string | null;
  target_date: string | null;
  sequence_id: number;
  attachments: any[];
  created_by: string;
  updated_by: string;
  project: string;
  project_detail: IProject;
  workspace: string;
  parent: string | null;
  parent_detail: IProject | null;
  state: string;
  assignees: any[] | null;
  labels: any[];
  labels_list: string[];
  blockers: any[];
  blocked_issue_details: any[];
  sprints: string | null;
  module: string | null;
  cycle: string | null;
  cycle_detail: ICycle | null;
}

export interface BlockeIssue {
  id: string;
  blocked_issue_detail?: BlockeIssueDetail;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  block: string;
  blocked_by: string;
  blocker_issue_detail?: BlockeIssueDetail;
}

export interface BlockeIssueDetail {
  id: string;
  name: string;
  description: string;
  priority: null;
  start_date: null;
  target_date: null;
}

export interface IIssueComment {
  id: string;
  actor: string;
  actor_detail: IUser;
  created_at: Date;
  updated_at: Date;
  comment: string;
  comment_html: string;
  comment_json: any;
  attachments: any[];
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  issue: string;
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

export type Properties = {
  key: boolean;
  state: boolean;
  assignee: boolean;
  priority: boolean;
  due_date: boolean;
  cycle: boolean;
  sub_issue_count: boolean;
};

export interface IIssueLabels {
  id: string;
  created_at: Date;
  updated_at: Date;
  name: string;
  description: string;
  colour: string;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  parent: string | null;
}

export interface IIssueActivity {
  id: string;
  actor_detail: IUser;
  created_at: Date;
  updated_at: Date;
  verb: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  comment: string;
  attachments: any[];
  old_identifier: string | null;
  new_identifier: string | null;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  issue: string;
  issue_comment: string | null;
  actor: string;
}
