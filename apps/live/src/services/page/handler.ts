import { TDocumentTypes } from "@/types";
// services
import { ProjectPageService } from "./project-page.service";

interface PageServiceParams {
  documentType?: TDocumentTypes;
  workspaceSlug?: string;
  projectId?: string;
  cookie?: string;
  pageId?: string;
  [key: string]: unknown;
}

export const getPageService = (params: PageServiceParams) => {
  const documentType = params["documentType"]?.toString() as TDocumentTypes | undefined;

  if (documentType === "project_page") {
    return new ProjectPageService(params);
  }

  throw new Error(`Invalid document type ${documentType} provided.`);
};
