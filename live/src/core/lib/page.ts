// helpers
import {
  getAllDocumentFormatsFromBinaryData,
  getBinaryDataFromHTMLString,
} from "@/core/helpers/page.js";
// services
import { PageService } from "@/core/services/page.service.js";
import { manualLogger } from "../helpers/logger.js";
const pageService = new PageService();

export const updatePageDescription = async (
  params: URLSearchParams,
  pageId: string,
  updatedDescription: Uint8Array,
  cookie: string | undefined,
) => {
  if (!(updatedDescription instanceof Uint8Array)) {
    throw new Error(
      "Invalid updatedDescription: must be an instance of Uint8Array",
    );
  }

  const workspaceSlug = params.get("workspaceSlug")?.toString();
  const projectId = params.get("projectId")?.toString();
  if (!workspaceSlug || !projectId || !cookie) return;

  const { contentBinaryEncoded, contentHTML, contentJSON } =
    getAllDocumentFormatsFromBinaryData(updatedDescription);

  try {
    // Generate a unique boundary
    const boundary = `----FormBoundary${Date.now().toString()}`;

    // Construct the multipart form data manually
    let formData = "";

    // Add binary content
    formData += `--${boundary}\r\n`;
    formData += 'Content-Disposition: form-data; name="description_binary"\r\n';
    formData += "Content-Type: application/octet-stream\r\n\r\n";
    formData += updatedDescription + "\r\n";

    // Add HTML content
    formData += `--${boundary}\r\n`;
    formData += 'Content-Disposition: form-data; name="description_html"\r\n';
    formData += "Content-Type: text/html\r\n\r\n";
    formData += contentHTML + "\r\n";

    // Add JSON content
    formData += `--${boundary}\r\n`;
    formData += 'Content-Disposition: form-data; name="description"\r\n';
    formData += "Content-Type: application/json\r\n\r\n";
    formData += JSON.stringify(contentJSON) + "\r\n";

    // End boundary
    formData += `--${boundary}--\r\n`;

    await pageService.updateDescription(
      workspaceSlug,
      projectId,
      pageId,
      formData,
      boundary,
      cookie,
    );
  } catch (error) {
    manualLogger.error("Update error:", error);
    throw error;
  }
};

// Update the service method

const fetchDescriptionHTMLAndTransform = async (
  workspaceSlug: string,
  projectId: string,
  pageId: string,
  cookie: string,
) => {
  if (!workspaceSlug || !projectId || !cookie) return;

  try {
    const pageDetails = await pageService.fetchDetails(
      workspaceSlug,
      projectId,
      pageId,
      cookie,
    );
    const { contentBinary } = getBinaryDataFromHTMLString(
      pageDetails.description_html ?? "<p></p>",
    );
    return contentBinary;
  } catch (error) {
    manualLogger.error(
      "Error while transforming from HTML to Uint8Array",
      error,
    );
    throw error;
  }
};

export const fetchPageDescriptionBinary = async (
  params: URLSearchParams,
  pageId: string,
  cookie: string | undefined,
) => {
  const workspaceSlug = params.get("workspaceSlug")?.toString();
  const projectId = params.get("projectId")?.toString();
  if (!workspaceSlug || !projectId || !cookie) return null;

  try {
    const response = await pageService.fetchDescriptionBinary(
      workspaceSlug,
      projectId,
      pageId,
      cookie,
    );
    console.log("response", response);
    const binaryData = new Uint8Array(response);
    console.log("binaryData", binaryData);

    if (binaryData.byteLength === 0) {
      const binary = await fetchDescriptionHTMLAndTransform(
        workspaceSlug,
        projectId,
        pageId,
        cookie,
      );
      if (binary) {
        return binary;
      }
    }

    return binaryData;
  } catch (error) {
    manualLogger.error("Fetch error:", error);
    throw error;
  }
};
