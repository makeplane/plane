import type { fetchPayload, onLoadDocumentPayload, storePayload } from "@hocuspocus/server";

export type TConvertDocumentRequestBody = {
  description_html: string;
  variant: "rich" | "document";
};

export interface OnLoadDocumentPayloadWithContext extends onLoadDocumentPayload {
  context: HocusPocusServerContext;
}

export interface FetchPayloadWithContext extends fetchPayload {
  context: HocusPocusServerContext;
}

export interface StorePayloadWithContext extends storePayload {
  context: HocusPocusServerContext;
}

export type TDocumentTypes = "project_page";

// Additional Hocuspocus types that are not exported from the main package
export type HocusPocusServerContext = {
  projectId: string | null;
  cookie: string;
  documentType: TDocumentTypes;
  workspaceSlug: string | null;
  userId: string;
};
