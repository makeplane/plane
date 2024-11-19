import { DocumentEventKey, DocumentRealtimeEvents } from "@/helpers/document-events";

export type TDocumentEventsClient = (typeof DocumentRealtimeEvents)[DocumentEventKey]["client"];
export type TDocumentEventsServer = (typeof DocumentRealtimeEvents)[DocumentEventKey]["server"];
