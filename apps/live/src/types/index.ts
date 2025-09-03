export type TDocumentTypes = "project_page";

export type HocusPocusServerContext = {
  cookie: string;
};

export type TConvertDocumentRequestBody = {
  description_html: string;
  variant: "rich" | "document";
};
