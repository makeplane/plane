// types
import { TAdditionalDocumentTypes } from "@/plane-live/types/common.js";

export type TDocumentTypes = "project_page" | TAdditionalDocumentTypes;

export type HocusPocusServerContext = {
  cookie: string;
};

export type TConvertDocumentRequestBody = {
  description_html: string;
  variant: "rich" | "document";
};
