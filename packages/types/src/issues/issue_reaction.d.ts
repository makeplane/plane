export type TIssueReaction = {
  actor: string;
  id: string;
  issue: string;
  reaction: string;
};

export type TIssueReactionMap = {
  [reaction_id: string]: TIssueReaction;
};

export type TIssueReactionIdMap = {
  [issue_id: string]: { [reaction: string]: string[] };
};
