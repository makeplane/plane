import { IUserLite } from "./users";

export interface IIssueReaction {
  actor: string;
  actor_detail: IUserLite;
  created_at: Date;
  created_by: string;
  id: string;
  issue: string;
  project: string;
  reaction: string;
  updated_at: Date;
  updated_by: string;
  workspace: string;
}

export interface IssueReactionForm {
  reaction: string;
}

export interface IssueCommentReaction {
  id: string;
  created_at: Date;
  updated_at: Date;
  reaction: string;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  actor: string;
  comment: string;
}

export interface IssueCommentReactionForm {
  reaction: string;
}
