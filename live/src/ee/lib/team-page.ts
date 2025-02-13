// helpers
import { getAllDocumentFormatsFromBinaryData, getBinaryDataFromHTMLString } from "@/core/helpers/page.js";
// services
import { TeamspacePageService } from "../services/team-page.service.js";
const teamspacePageService = new TeamspacePageService();

export const updateTeamspacePageDescription = async (
  params: URLSearchParams,
  pageId: string,
  updatedDescription: Uint8Array,
  cookie: string | undefined
) => {
  if (!(updatedDescription instanceof Uint8Array)) {
    throw new Error("Invalid updatedDescription: must be an instance of Uint8Array");
  }

  const workspaceSlug = params.get("workspaceSlug")?.toString();
  const teamspaceId = params.get("teamspaceId")?.toString();
  if (!workspaceSlug || !teamspaceId || !cookie) return;

  const { contentBinaryEncoded, contentHTML, contentJSON } = getAllDocumentFormatsFromBinaryData(updatedDescription);
  try {
    const payload = {
      description_binary: contentBinaryEncoded,
      description_html: contentHTML,
      description: contentJSON,
    };

    await teamspacePageService.updateDescription(workspaceSlug, teamspaceId, pageId, payload, cookie);
  } catch (error) {
    console.error("Update error:", error);
    throw error;
  }
};

const fetchDescriptionHTMLAndTransform = async (
  workspaceSlug: string,
  teamspaceId: string,
  pageId: string,
  cookie: string
) => {
  if (!workspaceSlug || !teamspaceId || !cookie) return;

  try {
    const pageDetails = await teamspacePageService.fetchDetails(workspaceSlug, teamspaceId, pageId, cookie);
    const { contentBinary } = getBinaryDataFromHTMLString(pageDetails.description_html ?? "<p></p>");
    return contentBinary;
  } catch (error) {
    console.error("Error while transforming from HTML to Uint8Array", error);
    throw error;
  }
};

export const fetchTeamspacePageDescriptionBinary = async (
  params: URLSearchParams,
  pageId: string,
  cookie: string | undefined
) => {
  const workspaceSlug = params.get("workspaceSlug")?.toString();
  const teamspaceId = params.get("teamspaceId")?.toString();
  if (!workspaceSlug || !teamspaceId || !cookie) return null;

  try {
    const response = await teamspacePageService.fetchDescriptionBinary(workspaceSlug, teamspaceId, pageId, cookie);
    const binaryData = new Uint8Array(response);

    if (binaryData.byteLength === 0) {
      const binary = await fetchDescriptionHTMLAndTransform(workspaceSlug, teamspaceId, pageId, cookie);
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
