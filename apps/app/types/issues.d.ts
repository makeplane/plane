import type { IState, IUser, IProject, ICycle } from "./";

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

export interface IIssue {
  id: string;
  state_detail: IState;
  label_details: any[];
  assignee_details: IUser[];
  assignees_list: string[];
  bridge?: string;
  blocked_by_issue_details: any[];
  blocked_issues: BlockeIssue[];
  blocker_issues: BlockeIssue[];
  blockers_list: string[];
  blocked_list: string[];
  created_at: Date;
  updated_at: Date;
  name: string;
  // TODO change type of description
  issue_cycle: {
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
  };
  description: any;
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
  cycle: string | null;

  issue_cycle: IIssueCycle;
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
  start_date: boolean;
  target_date: boolean;
  cycle: boolean;
  children_count: boolean;
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
