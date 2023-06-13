import { IIssueFilterOptions, IIssueLabels } from "./issues";
import type { IProjectLite } from "./projects";
import { IState } from "./state";
import { IUserLite } from "./users";

export interface IInboxIssue {
  assignee_details: IUserLite[];
  assignees: string[];
  bridge_id: string;
  completed_at: string | null;
  created_at: Date;
  created_by: string;
  description: any;
  description_html: string;
  description_stripped: string;
  estimate_point: number | null;
  id: string;
  issue_inbox: {
    duplicate_to: string | null;
    snoozed_till: Date | null;
    source: string;
    status: -2 | -1 | 0 | 1 | 2;
  };
  label_details: IIssueLabels[];
  labels: string[];
  name: string;
  parent: string | null;
  priority: string | null;
  project: string;
  project_detail: IProjectLite;
  sequence_id: number;
  sort_order: number;
  start_date: string | null;
  state: string;
  state_detail: IState;
  sub_issues_count: number;
  target_date: string | null;
  updated_at: Date;
  updated_by: string;
  workspace: string;
}

export interface IInboxIssueDetail {
  id: string;
  issue_detail: {
    id: string;
    name: string;
    description: any;
    description_html: string;
    priority: string | null;
    start_date: string | null;
    target_date: string | null;
    sequence_id: number;
    sort_order: number;
  };
  project_detail: {
    id: string;
    identifier: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
  status: -2 | -1 | 0 | 1 | 2;
  snoozed_till: string | null;
  source: string | null;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  inbox: string;
  issue: string;
  duplicate_to: string | null;
}
export interface IInbox {
  id: string;
  project_detail: IProjectLite;
  pending_issue_count: number;
  created_at: Date;
  updated_at: Date;
  name: string;
  description: string;
  is_default: boolean;
  created_by: string;
  updated_by: string;
  project: string;
  view_props: IInboxFilterOptions;
  workspace: string;
}

interface StatePending {
  readonly status: -2;
}
interface StatusReject {
  status: -1;
}

interface StatusSnoozed {
  status: 0;
  snoozed_till: Date;
}

interface StatusAccepted {
  status: 1;
}

interface StatusDuplicate {
  status: 2;
  duplicate_to: string;
}

type TInboxStatus = StatusReject | StatusSnoozed | StatusAccepted | StatusDuplicate | StatePending;

export interface IInboxFilterOptions {
  priority: string[] | null;
  inbox_status: number[] | null;
}
