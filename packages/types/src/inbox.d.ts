import { TIssue } from "./issues/base";
import type { IProjectLite } from "./projects";
import { TPaginationInfo } from "./common";

export type TInboxIssueListResponse = TPaginationInfo & {
  results: TInboxIssue[];
};

export type TInboxIssueStatus = -2 | -1 | 0 | 1 | 2;

export type TInboxIssue = {
  id: string;
  status: TInboxIssueStatus;
  snoozed_till: Date | null;
  duplicate_to: string | null;
  source: string;
  issue: TIssue;
  created_by: string;
};

export type TInboxIssueFilterOptions = {
  inbox_status: TInboxIssueStatus[];
  priority: string[];
  assignee: string[];
  created_by: string[];
  label: string[];
  created_at: string[];
  updated_at: string[];
};

export type TInboxIssueQueryParams = "priority" | "inbox_status";

export type TInboxIssueFilters = { filters: TInboxIssueFilterOptions };

export type TInbox = {
  id: string;
  name: string;
  description: string;
  workspace: string;
  project: string;
  is_default: boolean;
  view_props: TInboxIssueFilters;
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
  pending_issue_count: number;
};

export type TInboxIssueExtended = {
  completed_at: string | null;
  start_date: string | null;
  target_date: string | null;
};

export interface IInboxIssue extends TIssue, TInboxIssueExtended {
  issue_inbox: {
    duplicate_to: string | null;
    id: string;
    snoozed_till: Date | null;
    source: string;
    status: -2 | -1 | 0 | 1 | 2;
  }[];
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

export interface IInboxFilterOptions {
  priority?: string[] | null;
  inbox_status?: number[] | null;
}

export interface IInboxQueryParams {
  priority: string | null;
  inbox_status: string | null;
}

export type TInboxIssueOrderByOptions =
  | "-issue__created_at"
  | "issue__created_at"
  | "-issue__updated_at"
  | "issue__updated_at"
  | "issue__sequence_id"
  | "-issue__sequence_id";

export type TInboxIssueDisplayFilters = {
  order_by: TInboxIssueOrderByOptions;
};
