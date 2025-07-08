// types
import { TAdditionalDocumentTypes } from "@/plane-live/types/common";

export type TDocumentTypes = "project_page" | TAdditionalDocumentTypes;

export type HocusPocusServerContext = {
  cookie: string;
  projectId?: string;
  teamspaceId?: string;
  workspaceSlug?: string;
  documentType: TDocumentTypes;
  userId: string;
  agentId: string;
  parentId: string | undefined;
};

export type TConvertDocumentRequestBody = {
  description_html: string;
  variant: "rich" | "document";
};
