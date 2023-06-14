import { IIssue, IIssueFilterOptions, IIssueLabels } from "./issues";
import type { IProjectLite } from "./projects";
import { IState } from "./state";
import { IUserLite } from "./users";

export interface IInboxIssue extends Partial<IIssue> {
  bridge_id: string;
  issue_inbox: {
    duplicate_to: string | null;
    snoozed_till: Date | null;
    source: string;
    status: -2 | -1 | 0 | 1 | 2;
  }[];
}

export interface IInboxIssueDetail {
  id: string;
  issue_detail: IIssue & { bridge_id: string };
  project_detail: IProjectLite;
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
  view_props: { filters: IInboxFilterOptions };
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

export interface IInboxQueryParams {
  priority: string | null;
  inbox_status: string | null;
}
