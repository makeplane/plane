// helpers
import { getAllDocumentFormatsFromBinaryData, getBinaryDataFromHTMLString } from "@/core/helpers/page";
// services
import { PageService } from "@/services/page.service";
const pageService = new PageService();

export const updatePageDescription = async (
  params: URLSearchParams,
  pageId: string,
  updatedDescription: Uint8Array,
  cookie: string | undefined
) => {
  if (!(updatedDescription instanceof Uint8Array)) {
    throw new Error("Invalid updatedDescription: must be an instance of Uint8Array");
  }

  const workspaceSlug = params.get("workspaceSlug")?.toString();
  const projectId = params.get("projectId")?.toString();
  if (!workspaceSlug || !projectId || !cookie) return;

  const { contentBinaryEncoded, contentHTML, contentJSON } = getAllDocumentFormatsFromBinaryData(updatedDescription);
  const payload = {
    description_binary: contentBinaryEncoded,
    description_html: contentHTML,
    description: contentJSON,
  };

  await pageService.updateDescription(workspaceSlug, projectId, pageId, payload, cookie);
};

const fetchDescriptionHTMLAndTransform = async (
  workspaceSlug: string,
  projectId: string,
  pageId: string,
  cookie: string
) => {
  if (!workspaceSlug || !projectId || !cookie) return;

  const pageDetails = await pageService.fetchDetails(workspaceSlug, projectId, pageId, cookie);
  const { contentBinary } = getBinaryDataFromHTMLString(pageDetails.description_html ?? "<p></p>");
  return contentBinary;
};

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
    const binary = await fetchDescriptionHTMLAndTransform(workspaceSlug, projectId, pageId, cookie);
    if (binary) {
      return binary;
    }
  }

  return binaryData;
};
