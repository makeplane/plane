import type { IUserLite } from "../users";

export type TIssueReaction = {
  actor: string;
  id: string;
  issue: string;
  reaction: string;
  display_name: string;
};

export interface IIssuePublicReaction {
  actor_details: IUserLite;
  reaction: string;
}

export type TIssueReactionMap = {
  [reaction_id: string]: TIssueReaction;
};

export type TIssueReactionIdMap = {
  [issue_id: string]: { [reaction: string]: string[] };
};

export interface IPublicVote {
  vote: -1 | 1;
  actor_details: IUserLite;
}
