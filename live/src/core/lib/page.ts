import { getSchema } from "@tiptap/core";
import { generateHTML, generateJSON } from "@tiptap/html";
import * as Y from "yjs";
import {
  prosemirrorJSONToYDoc,
  yXmlFragmentToProseMirrorRootNode,
} from "y-prosemirror";
// editor
import {
  CoreEditorExtensionsWithoutProps,
  DocumentEditorExtensionsWithoutProps,
} from "@plane/editor/lib";
// services
import { PageService } from "../services/page.service.js";
const pageService = new PageService();

const DOCUMENT_EDITOR_EXTENSIONS = [
  ...CoreEditorExtensionsWithoutProps,
  ...DocumentEditorExtensionsWithoutProps,
];
const documentEditorSchema = getSchema(DOCUMENT_EDITOR_EXTENSIONS);

export const updatePageDescription = async (
  params: URLSearchParams,
  pageId: string,
  updatedDescription: Uint8Array,
  cookie: string | undefined
) => {
  if (!(updatedDescription instanceof Uint8Array)) {
    throw new Error(
      "Invalid updatedDescription: must be an instance of Uint8Array"
    );
  }

  const workspaceSlug = params.get("workspaceSlug")?.toString();
  const projectId = params.get("projectId")?.toString();
  if (!workspaceSlug || !projectId || !cookie) return;
  // encode binary description data
  const base64Data = Buffer.from(updatedDescription).toString("base64");
  const yDoc = new Y.Doc();
  Y.applyUpdate(yDoc, updatedDescription);
  // convert to JSON
  const type = yDoc.getXmlFragment("default");
  const contentJSON = yXmlFragmentToProseMirrorRootNode(
    type,
    documentEditorSchema
  ).toJSON();
  // convert to HTML
  const contentHTML = generateHTML(contentJSON, DOCUMENT_EDITOR_EXTENSIONS);

  try {
    const payload = {
      description_binary: base64Data,
      description_html: contentHTML,
      description: contentJSON,
    };

    await pageService.updateDescription(
      workspaceSlug,
      projectId,
      pageId,
      payload,
      cookie
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
  cookie: string
) => {
  if (!workspaceSlug || !projectId || !cookie) return;

  try {
    const pageDetails = await pageService.fetchDetails(
      workspaceSlug,
      projectId,
      pageId,
      cookie
    );
    // convert already existing html to json
    const contentJSON = generateJSON(
      pageDetails.description_html ?? "<p></p>",
      DOCUMENT_EDITOR_EXTENSIONS
    );
    // get editor schema from the DOCUMENT_EDITOR_EXTENSIONS array
    const schema = getSchema(DOCUMENT_EDITOR_EXTENSIONS);
    // convert json to Y.Doc format
    const transformedData = prosemirrorJSONToYDoc(
      schema,
      contentJSON,
      "default"
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
  params: URLSearchParams,
  pageId: string,
  cookie: string | undefined
) => {
  const workspaceSlug = params.get("workspaceSlug")?.toString();
  const projectId = params.get("projectId")?.toString();
  if (!workspaceSlug || !projectId || !cookie) return null;

  try {
    const response = await pageService.fetchDescriptionBinary(
      workspaceSlug,
      projectId,
      pageId,
      cookie
    );
    const binaryData = new Uint8Array(response);

    if (binaryData.byteLength === 0) {
      const binary = await fetchDescriptionHTMLAndTransform(
        workspaceSlug,
        projectId,
        pageId,
        cookie
      );
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
