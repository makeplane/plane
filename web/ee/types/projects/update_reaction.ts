export type TProjectUpdateReaction = {
  actor: string;
  id: string;
  project: string;
  reaction: string;
};

export type TProjectUpdateReactionMap = {
  [reaction_id: string]: TProjectUpdateReaction;
};

export type TProjectUpdateReactionIdMap = {
  [update_id: string]: { [reaction: string]: string[] };
};
