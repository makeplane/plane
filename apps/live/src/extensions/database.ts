import { Database as HocuspocusDatabase } from "@hocuspocus/extension-database";
import { logger } from "@plane/logger";
// lib
import { getPageService } from "@/services/page/handler";
// utils
import { getAllDocumentFormatsFromBinaryData, getBinaryDataFromHTMLString } from "@/utils";
// types
import type { fetchPayload, storePayload } from "@hocuspocus/server";

const fetchDocument = async ({ context, documentName, requestParameters }: fetchPayload) => {
  try {
    const params = {
      ...context,
      ...requestParameters,
      pageId: documentName,
    };
    const service = getPageService(params);
    // fetch details
    const response = await service.fetchDescriptionBinary(params.pageId);
    const binaryData = new Uint8Array(response);
    // if binary data is empty, convert HTML to binary data
    if (binaryData.byteLength === 0) {
      const pageDetails = await service.fetchDetails(params.pageId);
      const convertedBinaryData = getBinaryDataFromHTMLString(pageDetails.description_html ?? "<p></p>");
      if (convertedBinaryData) {
        return convertedBinaryData;
      }
    }
    // return binary data
    return binaryData;
  } catch (error) {
    logger.error("Error in fetching document", error);
    return null;
  }
};

const storeDocument = async ({ context, state, documentName, requestParameters }: storePayload) => {
  try {
    const params = {
      ...context,
      ...requestParameters,
      pageId: documentName,
      data: state,
    };
    const service = getPageService(params);
    // convert binary data to all formats
    const { contentBinaryEncoded, contentHTML, contentJSON } = getAllDocumentFormatsFromBinaryData(params.data);
    // create payload
    const payload = {
      description_binary: contentBinaryEncoded,
      description_html: contentHTML,
      description: contentJSON,
    };
    return service.updateDescriptionBinary(params.pageId, payload);
  } catch (error) {
    logger.error("Error in updating document:", error);
  }
};

export class Database extends HocuspocusDatabase {
  constructor() {
    super({ fetch: fetchDocument, store: storeDocument });
  }
}
