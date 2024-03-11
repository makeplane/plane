export type TIssueReaction = {
  actor_id: string;
  id: string;
  issue_id: string;
  reaction: string;
};

export type TIssueReactionMap = {
  [reaction_id: string]: TIssueReaction;
};

export type TIssueReactionIdMap = {
  [issue_id: string]: { [reaction: string]: string[] };
};
