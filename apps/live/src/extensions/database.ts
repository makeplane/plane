import { Database as HocuspocusDatabase } from "@hocuspocus/extension-database";
import { logger } from "@plane/logger";
// lib
import { fetchPageDescriptionBinary, updatePageDescription } from "@/lib/page";
// types
import { HocusPocusServerContext, TDocumentTypes } from "@/types";

const onFetch = async ({ context, documentName: pageId, requestParameters }: any) => {
  try {
    const cookie = (context as HocusPocusServerContext).cookie;
    // query params
    const params = requestParameters;
    const documentType = params.get("documentType")?.toString() as TDocumentTypes | undefined;
    // fetch document
    if (documentType === "project_page") {
      const data = await fetchPageDescriptionBinary(params, pageId, cookie);
      return data;
    }
    throw new Error(`Invalid document type ${documentType} provided.`);
  } catch (error) {
    logger.error("Error in fetching document", error);
    return null;
  }
};
const onStore = async ({ context, state, documentName: pageId, requestParameters }: any) => {
  const cookie = (context as HocusPocusServerContext).cookie;
  try {
    // query params
    const params = requestParameters;
    const documentType = params.get("documentType")?.toString() as TDocumentTypes | undefined;

    if (documentType === "project_page") {
      await updatePageDescription(params, pageId, state, cookie);
    }
  } catch (error) {
    logger.error("Error in updating document:", error);
  }
};

export class Database extends HocuspocusDatabase {
  constructor() {
    super({ fetch: onFetch, store: onStore });
  }
}
