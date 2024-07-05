import { config } from "dotenv";
import { TiptapTransformer } from "@hocuspocus/transformer";
// import { generateJSON } from "@tiptap/html";
import * as Y from "yjs";
// import { CoreEditorExtensionsWithoutProps } from "@plane/editor";
import { PageService } from "./services/page.service.js";
import { TContext } from "./types/server.js";
const pageService = new PageService();

config();

const BASE_URL = process.env.API_BASE_URL;

export const updateDocument = async (
  pageId: string,
  data: Uint8Array,
  context: TContext,
) => {
  const { workspaceSlug, projectId, cookie } = context;
  if (!workspaceSlug || !projectId || !cookie) return;

  // encode binary description data
  const base64Data = Buffer.from(data).toString("base64");

  try {
    const payload = {
      description_binary: base64Data,
      description_html: "<p></p>",
    };

    await pageService.updateDescription(
      workspaceSlug,
      projectId,
      pageId,
      payload,
      cookie,
    );
  } catch (error) {
    console.error("Update error:", error);
    throw error;
  }
};

const fetchByIdIfExists = async (pageId: string, context: TContext) => {
  const { workspaceSlug, projectId, cookie } = context;
  if (!workspaceSlug || !projectId || !cookie) return;
  const url = `${BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    });

    if (!response.ok) {
      try {
        console.error(
          `HTTP error! Status: ${response.status}, Body:`,
          response.body,
        );
      } catch {
        console.error(
          `HTTP error! Status: ${response.status}, Body: ${response.body}`,
        );
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const ans = await response.json();

    if (!ans.description_yjs) {
      console.log("ans", ans.description_html);
      // const final = generateJSON(
      //   ans.description_html,
      //   CoreEditorExtensionsWithoutProps(),
      // );
      const finalDataInYdoc = TiptapTransformer.toYdoc({});
      const encodedData = Y.encodeStateAsUpdate(finalDataInYdoc);

      return encodedData;
    }
    return null;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export const fetchPageDescriptionBinary = async (
  pageId: string,
  context: TContext,
) => {
  const { workspaceSlug, projectId, cookie } = context;
  if (!workspaceSlug || !projectId || !cookie) return null;

  try {
    const response = await pageService.fetchDescriptionBinary(
      workspaceSlug,
      projectId,
      pageId,
      cookie,
    );
    const binaryData = new Uint8Array(response);

    if (binaryData.byteLength === 0) {
      const binary = await fetchByIdIfExists(pageId, context);
      if (binary) {
        console.log("not found in db:", binary, binary instanceof Uint8Array);
        return binary;
      }
    }

    return binaryData;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};
