export const DocumentCollaborativeEvents = {
  Lock: { client: "locked", server: "Lock" },
  Unlock: { client: "unlocked", server: "Unlock" },
  Archive: { client: "archived", server: "Archive" },
  Unarchive: { client: "unarchived", server: "Unarchive" },
} as const;
