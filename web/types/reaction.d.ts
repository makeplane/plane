export interface IssueReaction {
  id: string;
  created_at: Date;
  updated_at: Date;
  reaction: string;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  actor: string;
  issue: string;
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
