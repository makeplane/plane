export const documentEventResponses = {
  lock: "locked",
  unlock: "unlocked",
  archive: "archived",
  unarchive: "unarchived",
} as const;

export type DocumentEventsServer = keyof typeof documentEventResponses;
export type DocumentEventsClient = (typeof documentEventResponses)[DocumentEventsServer];
