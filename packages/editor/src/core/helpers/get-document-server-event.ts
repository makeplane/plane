import { DocumentCollaborativeEvents } from "@/constants/document-collaborative-events";
import type {
  TDocumentEventKey,
  TDocumentEventsClient,
  TDocumentEventsServer,
} from "@/types/document-collaborative-events";

export const getServerEventName = (clientEvent: TDocumentEventsClient): TDocumentEventsServer | undefined => {
  for (const key in DocumentCollaborativeEvents) {
    if (DocumentCollaborativeEvents[key as TDocumentEventKey].client === clientEvent) {
      return DocumentCollaborativeEvents[key as TDocumentEventKey].server;
    }
  }
  return undefined;
};
