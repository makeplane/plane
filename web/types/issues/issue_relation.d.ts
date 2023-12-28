import { TIssue } from "./issues";

export type TIssueRelationTypes = "blocked" | "blocked_by" | "duplicate" | "relates_to";

export type TIssueRelation = Record<TIssueRelationTypes, { issue_detail: TIssue }[]>;

export type TIssueRelationMap = {
  [issue_id: string]: Record<TIssueRelationTypes, string[]>;
};

export type TIssueRelationIdMap = {
  [issue_id: string]: Record<TIssueRelationTypes, string[]>;
};
