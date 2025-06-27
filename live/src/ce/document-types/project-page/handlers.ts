import { PageService } from "@/core/services/page.service";
import { transformHTMLToBinary } from "./transformers";
import { getAllDocumentFormatsFromBinaryData } from "@/core/helpers/page";

const pageService = new PageService();

/**
 * Fetches the binary description data for a project page
 * Falls back to HTML transformation if binary is not available
 */
export const fetchPageDescriptionBinary = async (
  params: URLSearchParams,
  pageId: string,
  cookie: string | undefined
) => {
  const workspaceSlug = params.get("workspaceSlug")?.toString();
  const projectId = params.get("projectId")?.toString();
  if (!workspaceSlug || !projectId || !cookie) return null;

  const response = await pageService.fetchDescriptionBinary(workspaceSlug, projectId, pageId, cookie);
  const binaryData = new Uint8Array(response);

  if (binaryData.byteLength === 0) {
    const binary = await transformHTMLToBinary(workspaceSlug, projectId, pageId, cookie);
    if (binary) {
      return binary;
    }
  }

  return binaryData;
};

/**
 * Updates the description of a project page
 */
export const updatePageDescription = async (
  params: URLSearchParams | undefined,
  pageId: string,
  updatedDescription: Uint8Array,
  cookie: string | undefined
) => {
  if (!(updatedDescription instanceof Uint8Array)) {
    throw new Error("Invalid updatedDescription: must be an instance of Uint8Array");
  }

  const workspaceSlug = params?.get("workspaceSlug")?.toString();
  const projectId = params?.get("projectId")?.toString();
  if (!workspaceSlug || !projectId || !cookie) return;

  const { contentBinaryEncoded, contentHTML, contentJSON } = getAllDocumentFormatsFromBinaryData(updatedDescription);
  const payload = {
    description_binary: contentBinaryEncoded,
    description_html: contentHTML,
    description: contentJSON,
  };

  await pageService.updateDescription(workspaceSlug, projectId, pageId, payload, cookie);
};
