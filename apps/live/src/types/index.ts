export type TDocumentTypes = "project_page";

export type TConvertDocumentRequestBody = {
  description_html: string;
  variant: "rich" | "document";
};

// Re-export Hocuspocus types
export * from "./hocuspocus";
