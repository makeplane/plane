export type TIssueReaction = {
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
};

export type TIssueReactionMap = {
  [reaction_id: string]: TIssueReaction;
};

export type TIssueReactionIdMap = {
  [issue_id: string]: { [reaction: string]: string[] };
};
