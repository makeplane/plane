import { getSchema } from "@tiptap/core";
import { generateJSON } from "@tiptap/html";
import * as Y from "yjs";
import { prosemirrorJSONToYDoc } from "y-prosemirror";
// editor
import {
  CoreEditorExtensionsWithoutProps,
  DocumentEditorExtensionsWithoutProps,
} from "@plane/editor/lib";
// services
import { PageService } from "./services/page.service.js";
const pageService = new PageService();

export const updateDocument = async (
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  pageId: string,
  data: Uint8Array,
  cookie: string | undefined,
) => {
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

const fetchDescriptionHTMLAndTransform = async (
  workspaceSlug: string,
  projectId: string,
  pageId: string,
  cookie: string,
) => {
  if (!workspaceSlug || !projectId || !cookie) return;

  try {
    const pageDetails = await pageService.fetchDetails(
      workspaceSlug,
      projectId,
      pageId,
      cookie,
    );
    // document editor extensions
    const extensions = [
      ...CoreEditorExtensionsWithoutProps(),
      ...DocumentEditorExtensionsWithoutProps(),
    ];
    // convert already existing html to json
    const contentJSON = generateJSON(
      pageDetails.description_html ?? "<p></p>",
      extensions,
    );
    // get editor schema from the extensions array
    const schema = getSchema(extensions);
    // convert json to Y.Doc format
    const transformedData = prosemirrorJSONToYDoc(
      schema,
      contentJSON,
      "default",
    );
    // convert Y.Doc to Uint8Array format
    const encodedData = Y.encodeStateAsUpdate(transformedData);

    return encodedData;
  } catch (error) {
    console.error("Error while transforming from HTML to Uint8Array", error);
    throw error;
  }
};

export const fetchPageDescriptionBinary = async (
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  pageId: string,
  cookie: string | undefined,
) => {
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
      const binary = await fetchDescriptionHTMLAndTransform(
        workspaceSlug,
        projectId,
        pageId,
        cookie,
      );
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
