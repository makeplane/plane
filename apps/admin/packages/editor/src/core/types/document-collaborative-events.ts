import { DocumentCollaborativeEvents } from "@/constants/document-collaborative-events";

export type TDocumentEventKey = keyof typeof DocumentCollaborativeEvents;
export type TDocumentEventsClient = (typeof DocumentCollaborativeEvents)[TDocumentEventKey]["client"];
export type TDocumentEventsServer = (typeof DocumentCollaborativeEvents)[TDocumentEventKey]["server"];

export type TDocumentEventEmitter = {
  on: (event: string, callback: (message: { payload: TDocumentEventsClient }) => void) => void;
  off: (event: string, callback: (message: { payload: TDocumentEventsClient }) => void) => void;
};
