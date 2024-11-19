import { TDocumentEventsClient, TDocumentEventsServer } from "src/lib";

export const DocumentRealtimeEvents = {
  Lock: { client: "locked", server: "Lock" },
  Unlock: { client: "unlocked", server: "Unlock" },
  Archive: { client: "archived", server: "Archive" },
  Unarchive: { client: "unarchived", server: "Unarchive" },
  Favorite: { client: "favorited", server: "Favorite" },
  RemoveFavorite: { client: "removed-favorite", server: "RemoveFavorite" },
} as const;

export type DocumentEventKey = keyof typeof DocumentRealtimeEvents;

export const getServerEventName = (clientEvent: TDocumentEventsClient): TDocumentEventsServer | undefined => {
  for (const key in DocumentRealtimeEvents) {
    if (DocumentRealtimeEvents[key as DocumentEventKey].client === clientEvent) {
      return DocumentRealtimeEvents[key as DocumentEventKey].server;
    }
  }
  return undefined;
};
