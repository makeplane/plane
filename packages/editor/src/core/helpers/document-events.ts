export enum DocumentEventResponses {
  Lock = "locked",
  Unlock = "unlocked",
  Archive = "archived",
  Unarchive = "unarchived",
}

export type DocumentEventsServer = keyof typeof DocumentEventResponses;
export type DocumentEventsClient = (typeof DocumentEventResponses)[DocumentEventsServer];
