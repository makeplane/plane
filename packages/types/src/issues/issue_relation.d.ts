import { TIssue } from "./issues";

export type TIssueRelationTypes =
  | "blocking"
  | "blocked_by"
  | "duplicate"
  | "relates_to";

export type TIssueRelationObject = { issue_detail: TIssue };

export type TIssueRelation = Record<
  TIssueRelationTypes,
  TIssueRelationObject[]
>;

export type TIssueRelationMap = {
  [issue_id: string]: Record<TIssueRelationTypes, string[]>;
};

export type TIssueRelationIdMap = Record<TIssueRelationTypes, string[]>;
