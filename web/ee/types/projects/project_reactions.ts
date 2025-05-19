export type TProjectReaction = {
  actor: string;
  id: string;
  project: string;
  reaction: string;
};

export type TProjectReactionMap = {
  [reaction_id: string]: TProjectReaction;
};

export type TProjectReactionIdMap = {
  [project_id: string]: { [reaction: string]: string[] };
};
