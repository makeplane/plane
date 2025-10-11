export const DocumentCollaborativeEvents = {
  lock: { client: "locked", server: "lock" },
  unlock: { client: "unlocked", server: "unlock" },
  archive: { client: "archived", server: "archive" },
  unarchive: { client: "unarchived", server: "unarchive" },
  "make-public": { client: "made-public", server: "make-public" },
  "make-private": { client: "made-private", server: "make-private" },
} as const;
