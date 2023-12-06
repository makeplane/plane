import { IIssue } from "types/issue";

export type TIssueGroupByOptions = "state" | "priority" | "labels" | null;

export type TIssueParams = "priority" | "state" | "labels";

export interface IIssueFilterOptions {
  state?: string[] | null;
  labels?: string[] | null;
  priority?: string[] | null;
}

// issues
export interface IGroupedIssues {
  [group_id: string]: string[];
}

export interface ISubGroupedIssues {
  [sub_grouped_id: string]: {
    [group_id: string]: string[];
  };
}

export type TUnGroupedIssues = string[];

export interface IIssueResponse {
  [issue_id: string]: IIssue;
}

export type TLoader = "init-loader" | "mutation" | undefined;

export interface ViewFlags {
  enableQuickAdd: boolean;
  enableIssueCreation: boolean;
  enableInlineEditing: boolean;
}
