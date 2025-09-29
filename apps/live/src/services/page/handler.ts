import type { HocusPocusServerContext, TDocumentTypes } from "@/types";
// services
import { ProjectPageService } from "./project-page.service";

export const getPageService = (documentType: TDocumentTypes, context: HocusPocusServerContext) => {
  if (documentType === "project_page") {
    return new ProjectPageService({
      workspaceSlug: context.workspaceSlug,
      projectId: context.projectId,
      cookie: context.cookie,
    });
  }

  throw new Error(`Invalid document type ${documentType} provided.`);
};
