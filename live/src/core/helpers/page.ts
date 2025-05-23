import { getSchema } from "@tiptap/core";
import { generateHTML, generateJSON } from "@tiptap/html";
import { prosemirrorJSONToYDoc, yXmlFragmentToProseMirrorRootNode } from "y-prosemirror";
import * as Y from "yjs";
// plane editor
import { CoreEditorExtensionsWithoutProps, DocumentEditorExtensionsWithoutProps } from "@plane/editor/lib";

const DOCUMENT_EDITOR_EXTENSIONS = [...CoreEditorExtensionsWithoutProps, ...DocumentEditorExtensionsWithoutProps];
const documentEditorSchema = getSchema(DOCUMENT_EDITOR_EXTENSIONS);

/**
 * Extracts the text content from an HTML string
 * @param html HTML string
 * @returns text content
 */
export const extractTextFromHTML = (html: string): string => {
  // Use a regex to extract text between tags
  const textMatch = html.replace(/<[^>]*>/g, "");
  return textMatch || "";
};

export const getAllDocumentFormatsFromBinaryData = (
  description: Uint8Array
): {
  contentBinaryEncoded: string;
  contentJSON: object;
  contentHTML: string;
  titleHTML: string;
} => {
  // encode binary description data
  const base64Data = Buffer.from(description).toString("base64");
  const yDoc = new Y.Doc();
  Y.applyUpdate(yDoc, description);
  // convert to JSON
  const type = yDoc.getXmlFragment("default");
  const contentJSON = yXmlFragmentToProseMirrorRootNode(type, documentEditorSchema).toJSON();

  const title = yDoc.getXmlFragment("title");
  const titleJSON = yXmlFragmentToProseMirrorRootNode(title, documentEditorSchema).toJSON();
  const titleHTML = extractTextFromHTML(generateHTML(titleJSON, DOCUMENT_EDITOR_EXTENSIONS));
  // convert to HTML
  const contentHTML = generateHTML(contentJSON, DOCUMENT_EDITOR_EXTENSIONS);

  return {
    contentBinaryEncoded: base64Data,
    contentJSON,
    contentHTML,
    titleHTML,
  };
};

export const getBinaryDataFromHTMLString = (
  descriptionHTML: string
): {
  contentBinary: Uint8Array;
} => {
  // convert HTML to JSON
  const contentJSON = generateJSON(descriptionHTML ?? "<p></p>", DOCUMENT_EDITOR_EXTENSIONS);
  // convert JSON to Y.Doc format
  const transformedData = prosemirrorJSONToYDoc(documentEditorSchema, contentJSON, "default");
  // convert Y.Doc to Uint8Array format
  const encodedData = Y.encodeStateAsUpdate(transformedData);

  return {
    contentBinary: encodedData,
  };
};
