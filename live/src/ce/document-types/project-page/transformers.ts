import { PageService } from "@/core/services/page.service";
import { getBinaryDataFromHTMLString } from "@/core/helpers/page";
import logger from "@plane/logger";

const pageService = new PageService();

/**
 * Transforms HTML description to binary format
 */
export const transformHTMLToBinary = async (
  workspaceSlug: string,
  projectId: string,
  pageId: string,
  cookie: string
) => {
  if (!workspaceSlug || !projectId || !cookie) return;

  try {
    const pageDetails = await pageService.fetchDetails(workspaceSlug, projectId, pageId, cookie);
    const { contentBinary } = getBinaryDataFromHTMLString(pageDetails.description_html ?? "<p></p>");
    return contentBinary;
  } catch (error) {
    logger.error("Error while transforming from HTML to Uint8Array", error);
    throw error;
  }
}; 