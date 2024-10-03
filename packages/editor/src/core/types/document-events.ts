import { DocumentEventResponses } from "@/helpers/document-events";

export type DocumentEventsServer = keyof typeof DocumentEventResponses;
export type DocumentEventsClient = (typeof DocumentEventResponses)[DocumentEventsServer];
