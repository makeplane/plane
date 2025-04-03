import { PageService } from "@/core/services/page.service";
import { transformHTMLToBinary } from "./transformers";
import { getAllDocumentFormatsFromBinaryData } from "@/core/helpers/page";
import { logger } from "@plane/logger";
import { HocusPocusServerContext } from "@/core/types/common";

const pageService = new PageService();

/**
 * Fetches the binary description data for a project page
 * Falls back to HTML transformation if binary is not available
 */
export const fetchPageDescriptionBinary = async ({
  pageId,
  context,
}: {
  pageId: string;
  context: HocusPocusServerContext;
}) => {
  const { workspaceSlug, projectId, cookie } = context;

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
  context,
  pageId,
  state: updatedDescription,
  title,
}: {
  context: HocusPocusServerContext;
  pageId: string;
  state: Uint8Array;
  title: string;
}) => {
  if (!(updatedDescription instanceof Uint8Array)) {
    throw new Error("Invalid updatedDescription: must be an instance of Uint8Array");
  }

  const { workspaceSlug, projectId, cookie } = context;
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
  context,
  pageId,
}: {
  context: HocusPocusServerContext;
  pageId: string;
}) => {
  const { workspaceSlug, projectId, cookie } = context;
  if (!workspaceSlug || !projectId || !cookie) return;

  try {
    const pageDetails = await pageService.fetchDetails(workspaceSlug, projectId, pageId, cookie);
    return pageDetails.name;
  } catch (error) {
    logger.error("Error while transforming from HTML to Uint8Array", error);
    throw error;
  }
};

export const updateProjectPageTitle = async ({
  context,
  pageId,
  title,
  abortSignal,
}: {
  context: HocusPocusServerContext;
  pageId: string;
  title: string;
  abortSignal?: AbortSignal;
}) => {
  const { workspaceSlug, projectId, cookie } = context;
  if (!workspaceSlug || !projectId || !cookie) return;

  const payload = {
    name: title,
  };

  await pageService.updateTitle(workspaceSlug, projectId, pageId, payload, cookie, abortSignal);
};
