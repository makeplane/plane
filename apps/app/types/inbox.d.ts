export interface IInboxIssue {
  id: string;
  issue_detail: IInboxIssue;
  created_at: Date;
  updated_at: Date;
  status: number;
  snoozed_till: null;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  inbox: string;
  issue: string;
  duplicate_to: null;
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

export interface IInbox extends any {}

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

type TInboxStatus = StatusReject | StatusSnoozed | StatusAccepted | StatusDuplicate;
