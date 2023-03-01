import type { IUser, IIssue } from ".";

export interface ICycle {
  id: string;
  owned_by: IUser;
  created_at: Date;
  updated_at: Date;
  name: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  issue: string;
  current_cycle: [];
  upcoming_cycle: [];
  past_cycles: [];
}

export interface CurrentAndUpcomingCyclesResponse {
 current_cycle : ICycle[];
 upcoming_cycle : ICycle[];
}


export interface DraftCyclesResponse {
  draft_cycles : ICycle[];
 }

export interface CompletedCyclesResponse {
  completed_cycles : ICycle[];
 }

export interface CycleIssueResponse {
  id: string;
  issue_detail: IIssue;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  issue: string;
  cycle: string;
  sub_issues_count: number;
}

export type SelectCycleType =
  | (ICycle & { actionType: "edit" | "delete" | "create-issue" })
  | undefined;

export type SelectIssue = (IIssue & { actionType: "edit" | "delete" | "create" }) | null;
