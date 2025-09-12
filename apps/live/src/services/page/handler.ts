import { TDocumentTypes } from "@/types";
// services
import { ProjectPageService } from "./project-page.service";

export const getPageService = (params: any) => {
  const documentType = params["documentType"]?.toString() as TDocumentTypes | undefined;

  if (documentType === "project_page") {
    return new ProjectPageService(params);
  }

  throw new Error(`Invalid document type ${documentType} provided.`);
};
