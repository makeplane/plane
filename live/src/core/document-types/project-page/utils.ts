import { PageService } from "@/core/services/page.service";
import { transformHTMLToBinary } from "./transformers";

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