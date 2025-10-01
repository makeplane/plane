import { Database as HocuspocusDatabase } from "@hocuspocus/extension-database";
// utils
import {
  getAllDocumentFormatsFromDocumentEditorBinaryData,
  getBinaryDataFromDocumentEditorHTMLString,
} from "@plane/editor";
// logger
import { logger } from "@plane/logger";
// lib
import { getPageService } from "@/services/page/handler";
// type
import type { FetchPayloadWithContext, StorePayloadWithContext } from "@/types";

const fetchDocument = async ({ context, documentName: pageId }: FetchPayloadWithContext) => {
  try {
    const service = getPageService(context.documentType, context);
    // fetch details
    const response = await service.fetchDescriptionBinary(pageId);
    const binaryData = new Uint8Array(response);
    // if binary data is empty, convert HTML to binary data
    if (binaryData.byteLength === 0) {
      const pageDetails = await service.fetchDetails(pageId);
      const convertedBinaryData = getBinaryDataFromDocumentEditorHTMLString(pageDetails.description_html ?? "<p></p>");
      if (convertedBinaryData) {
        return convertedBinaryData;
      }
    }
    // return binary data
    return binaryData;
  } catch (error) {
    logger.error("Error in fetching document", error);
    throw error;
  }
};

const storeDocument = async ({ context, state: pageBinaryData, documentName: pageId }: StorePayloadWithContext) => {
  try {
    const service = getPageService(context.documentType, context);
    // convert binary data to all formats
    const { contentBinaryEncoded, contentHTML, contentJSON } =
      getAllDocumentFormatsFromDocumentEditorBinaryData(pageBinaryData);
    // create payload
    const payload = {
      description_binary: contentBinaryEncoded,
      description_html: contentHTML,
      description: contentJSON,
    };
    return service.updateDescriptionBinary(pageId, payload);
  } catch (error) {
    logger.error("Error in updating document:", error);
    throw error;
  }
};

export class Database extends HocuspocusDatabase {
  constructor() {
    super({ fetch: fetchDocument, store: storeDocument });
  }
}
