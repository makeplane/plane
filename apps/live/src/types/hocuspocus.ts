// Additional Hocuspocus types that are not exported from the main package
export interface HocusPocusServerContext {
  cookie: string;
  [key: string]: unknown;
}

// Extended fetch payload for database operations
export interface DatabaseFetchPayload {
  context: HocusPocusServerContext;
  documentName: string;
  requestParameters: Record<string, string>;
  pageId: string;
}

// Extended store payload for database operations
export interface DatabaseStorePayload {
  context: HocusPocusServerContext;
  documentName: string;
  requestParameters: Record<string, string>;
  pageId: string;
  data: Uint8Array;
}
