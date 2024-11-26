export const DocumentCollaborativeEvents = {
  lock: { client: "locked", server: "lock" },
  unlock: { client: "unlocked", server: "unlock" },
  archive: { client: "archived", server: "archive" },
  unarchive: { client: "unarchived", server: "unarchive" },
} as const;
