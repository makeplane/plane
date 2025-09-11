import { Database as HocuspocusDatabase } from "@hocuspocus/extension-database";
import { logger } from "@plane/logger";
// lib
import { ProjectPageService } from "@/services/project-page";
// types
import { TDocumentTypes } from "@/types";

const projectPageService = new ProjectPageService();

const onFetch = async ({ context, documentName, requestParameters }: any) => {
  try {
    const documentType = requestParameters.get("documentType")?.toString() as TDocumentTypes | undefined;
    const params = {
      ...context,
      ...requestParameters,
      pageId: documentName,
    };
    // fetch document
    if (documentType === "project_page") {
      const data = await projectPageService.fetchDocument(params);
      return data;
    }
    throw new Error(`Invalid document type ${documentType} provided.`);
  } catch (error) {
    logger.error("Error in fetching document", error);
    return null;
  }
};

const onStore = async ({ context, state, documentName, requestParameters }: any) => {
  try {
    const documentType = requestParameters.get("documentType")?.toString() as TDocumentTypes | undefined;
    const params = {
      ...context,
      ...requestParameters,
      pageId: documentName,
    };
    // store document
    if (documentType === "project_page") {
      await projectPageService.storeDocument(params, state);
      return;
    }
    throw new Error(`Invalid document type ${documentType} provided.`);
  } catch (error) {
    logger.error("Error in updating document:", error);
  }
};

export class Database extends HocuspocusDatabase {
  constructor() {
    super({ fetch: onFetch, store: onStore });
  }
}
