import { DocumentEventResponses } from "@/helpers/document-events";

export type TDocumentEventsServer = keyof typeof DocumentEventResponses;
export type TDocumentEventsClient = `${DocumentEventResponses}`;
