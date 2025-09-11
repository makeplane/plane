import { getAllDocumentFormatsFromBinaryData, getBinaryDataFromHTMLString } from "@/utils";
// local imports
import { ProjectPageExtendedService } from "./extended.service";

export class ProjectPageService extends ProjectPageExtendedService {
  constructor() {
    super();
  }

  async fetchDocument(params: any) {
    const { workspaceSlug, projectId, pageId } = params;
    // validate params
    if (!workspaceSlug || !projectId || !pageId) throw new Error("Missing required fields.");
    // validate cookie
    if (!params.cookie) throw new Error("Cookie is required.");
    // set cookie
    this.setHeader("Cookie", params.cookie);
    // fetch details
    const response = await this.fetchDescriptionBinary(workspaceSlug, projectId, pageId);
    const binaryData = new Uint8Array(response);
    // if binary data is empty, convert HTML to binary data
    if (binaryData.byteLength === 0) {
      const pageDetails = await this.fetchDetails(workspaceSlug, projectId, pageId);
      const convertedBinaryData = getBinaryDataFromHTMLString(pageDetails.description_html ?? "<p></p>");
      if (convertedBinaryData) {
        return convertedBinaryData;
      }
    }
    // return binary data
    return binaryData;
  }

  storeDocument(params: any, data: Uint8Array) {
    const { workspaceSlug, projectId, pageId } = params;
    // validate params
    if (!workspaceSlug || !projectId || !pageId) throw new Error("Missing required fields.");
    // validate cookie
    if (!params.cookie) throw new Error("Cookie is required.");
    // set cookie
    this.setHeader("Cookie", params.cookie);
    // convert binary data to all formats
    const { contentBinaryEncoded, contentHTML, contentJSON } = getAllDocumentFormatsFromBinaryData(data);
    // create payload
    const payload = {
      description_binary: contentBinaryEncoded,
      description_html: contentHTML,
      description: contentJSON,
    };
    return this.updateDescriptionBinary(workspaceSlug, projectId, pageId, payload);
  }
}
