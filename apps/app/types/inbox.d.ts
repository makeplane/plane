import type { IProjectLite } from "./projects";

export interface IInboxIssue {
  id: string;
  issue_detail: IInboxIssue;
  created_at: Date;
  updated_at: Date;
  status: -2 | -1 | 0 | 1 | 2;
  snoozed_till: Date | null;
  created_by: string;
  updated_by: string;
  project: string;
  project_detail: IProjectLite;
  workspace: string;
  inbox: string;
  issue: string;
  duplicate_to: string | null;
}

export interface IInboxIssue {
  id: string;
  name: string;
  description: string;
  priority: null;
  start_date: null;
  target_date: null;
  sequence_id: number;
  sort_order: number;
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
  workspace: string;
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

interface StatePending {
  readonly status: -2;
}

type TInboxStatus = StatusReject | StatusSnoozed | StatusAccepted | StatusDuplicate | StatePending;
