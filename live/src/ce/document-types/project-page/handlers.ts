import { PageService } from "@/core/services/page.service";
import { transformHTMLToBinary } from "./transformers";
import { getAllDocumentFormatsFromBinaryData } from "@/core/helpers/page";
import { logger } from "@plane/logger";

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
export const updatePageDescription = async ({
  params,
  pageId,
  updatedDescription,
  cookie,
  title,
}: {
  params: URLSearchParams | undefined;
  pageId: string;
  updatedDescription: Uint8Array;
  cookie: string | undefined;
  title: string;
}) => {
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
    name: title,
  };

  await pageService.updateDescription(workspaceSlug, projectId, pageId, payload, cookie);
};

export const fetchProjectPageTitle = async ({
  workspaceSlug,
  projectId,
  pageId,
  cookie,
}: {
  workspaceSlug: string;
  projectId: string;
  pageId: string;
  cookie: string | undefined;
}) => {
  if (!workspaceSlug || !cookie) return;

  try {
    const pageDetails = await pageService.fetchDetails(workspaceSlug, projectId, pageId, cookie);
    return pageDetails.name;
  } catch (error) {
    logger.error("Error while transforming from HTML to Uint8Array", error);
    throw error;
  }
};

export const updateProjectPageTitle = async ({
  workspaceSlug,
  projectId,
  pageId,
  title,
  cookie,
  abortSignal,
}: {
  workspaceSlug: string;
  projectId: string;
  pageId: string;
  title: string;
  cookie: string | undefined;
  abortSignal?: AbortSignal;
}) => {
  if (!workspaceSlug || !projectId || !cookie) return;

  const payload = {
    name: title,
  };

  await pageService.updateTitle(workspaceSlug, projectId, pageId, payload, cookie, abortSignal);
};
