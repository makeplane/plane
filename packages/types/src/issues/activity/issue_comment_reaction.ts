export type TIssueCommentReaction = {
  id: string;
  comment: string;
  actor: string;
  reaction: string;
  workspace: string;
  project: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
  display_name: string;
};

export type TIssueCommentReactionMap = {
  [reaction_id: string]: TIssueCommentReaction;
};

export type TIssueCommentReactionIdMap = {
  [comment_id: string]: { [reaction: string]: string[] };
};
