import { IIssue } from "types";

// issue filters
export enum EFilterType {
  FILTERS = "filters",
  DISPLAY_FILTERS = "display_filters",
  DISPLAY_PROPERTIES = "display_properties",
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
