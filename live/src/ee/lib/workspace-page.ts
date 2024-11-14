// helpers
import {
  getAllDocumentFormatsFromDocumentEditorBinaryData,
  getBinaryDataFromDocumentEditorHTMLString,
} from "@plane/editor";
// services
import { WorkspacePageService } from "../services/workspace-page.service.js";
const workspacePageService = new WorkspacePageService();

export const updateWorkspacePageDescription = async (
  params: URLSearchParams,
  pageId: string,
  updatedDescription: Uint8Array,
  cookie: string | undefined
) => {
  if (!(updatedDescription instanceof Uint8Array)) {
    throw new Error("Invalid updatedDescription: must be an instance of Uint8Array");
  }

  const workspaceSlug = params.get("workspaceSlug")?.toString();
  if (!workspaceSlug || !cookie) return;

  const { contentBinaryEncoded, contentHTML, contentJSON } =
    getAllDocumentFormatsFromDocumentEditorBinaryData(updatedDescription);
  try {
    const payload = {
      description_binary: contentBinaryEncoded,
      description_html: contentHTML,
      description: contentJSON,
    };

    await workspacePageService.updateDescription(workspaceSlug, pageId, payload, cookie);
  } catch (error) {
    console.error("Update error:", error);
    throw error;
  }
};

const fetchDescriptionHTMLAndTransform = async (workspaceSlug: string, pageId: string, cookie: string) => {
  if (!workspaceSlug || !cookie) return;

  try {
    const pageDetails = await workspacePageService.fetchDetails(workspaceSlug, pageId, cookie);
    const contentBinary = getBinaryDataFromDocumentEditorHTMLString(pageDetails.description_html ?? "<p></p>");
    return contentBinary;
  } catch (error) {
    console.error("Error while transforming from HTML to Uint8Array", error);
    throw error;
  }
};

export const fetchWorkspacePageDescriptionBinary = async (
  params: URLSearchParams,
  pageId: string,
  cookie: string | undefined
) => {
  const workspaceSlug = params.get("workspaceSlug")?.toString();
  if (!workspaceSlug || !cookie) return null;

  try {
    const response = await workspacePageService.fetchDescriptionBinary(workspaceSlug, pageId, cookie);
    const binaryData = new Uint8Array(response);

    if (binaryData.byteLength === 0) {
      const binary = await fetchDescriptionHTMLAndTransform(workspaceSlug, pageId, cookie);
      if (binary) {
        return binary;
      }
    }

    return binaryData;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};
