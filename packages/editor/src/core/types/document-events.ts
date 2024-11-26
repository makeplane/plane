import { DocumentEventKey, DocumentRealtimeEvents } from "@/helpers/document-events";

export type TDocumentEventsClient = (typeof DocumentRealtimeEvents)[DocumentEventKey]["client"];
export type TDocumentEventsServer = (typeof DocumentRealtimeEvents)[DocumentEventKey]["server"];

export type TDocumentEventEmitter = {
  on: (event: string, callback: (message: { payload: TDocumentEventsClient }) => void) => void;
  off: (event: string, callback: (message: { payload: TDocumentEventsClient }) => void) => void;
};
