export type TIssueCommentReaction = {
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
};

export type TIssueCommentReactionMap = {
  [issue_id: string]: TIssueCommentReaction;
};

export type TIssueCommentReactionIdMap = {
  [issue_id: string]: string[];
};
