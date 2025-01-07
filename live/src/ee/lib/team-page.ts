// helpers
import { getAllDocumentFormatsFromBinaryData, getBinaryDataFromHTMLString } from "@/core/helpers/page.js";
// services
import { TeamPageService } from "../services/team-page.service.js";
const teamPageService = new TeamPageService();

export const updateTeamPageDescription = async (
  params: URLSearchParams,
  pageId: string,
  updatedDescription: Uint8Array,
  cookie: string | undefined
) => {
  if (!(updatedDescription instanceof Uint8Array)) {
    throw new Error("Invalid updatedDescription: must be an instance of Uint8Array");
  }

  const workspaceSlug = params.get("workspaceSlug")?.toString();
  const teamId = params.get("teamId")?.toString();
  if (!workspaceSlug || !teamId || !cookie) return;

  const { contentBinaryEncoded, contentHTML, contentJSON } = getAllDocumentFormatsFromBinaryData(updatedDescription);
  try {
    const payload = {
      description_binary: contentBinaryEncoded,
      description_html: contentHTML,
      description: contentJSON,
    };

    await teamPageService.updateDescription(workspaceSlug, teamId, pageId, payload, cookie);
  } catch (error) {
    console.error("Update error:", error);
    throw error;
  }
};

const fetchDescriptionHTMLAndTransform = async (
  workspaceSlug: string,
  teamId: string,
  pageId: string,
  cookie: string
) => {
  if (!workspaceSlug || !teamId || !cookie) return;

  try {
    const pageDetails = await teamPageService.fetchDetails(workspaceSlug, teamId, pageId, cookie);
    const { contentBinary } = getBinaryDataFromHTMLString(pageDetails.description_html ?? "<p></p>");
    return contentBinary;
  } catch (error) {
    console.error("Error while transforming from HTML to Uint8Array", error);
    throw error;
  }
};

export const fetchTeamPageDescriptionBinary = async (
  params: URLSearchParams,
  pageId: string,
  cookie: string | undefined
) => {
  const workspaceSlug = params.get("workspaceSlug")?.toString();
  const teamId = params.get("teamId")?.toString();
  if (!workspaceSlug || !teamId || !cookie) return null;

  try {
    const response = await teamPageService.fetchDescriptionBinary(workspaceSlug, teamId, pageId, cookie);
    const binaryData = new Uint8Array(response);

    if (binaryData.byteLength === 0) {
      const binary = await fetchDescriptionHTMLAndTransform(workspaceSlug, teamId, pageId, cookie);
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
