import { getSchema } from "@tiptap/core";
import { generateHTML, generateJSON } from "@tiptap/html";
import { prosemirrorJSONToYDoc, yXmlFragmentToProseMirrorRootNode } from "y-prosemirror";
import * as Y from "yjs";
// extensions
import {
  CoreEditorExtensionsWithoutProps,
  DocumentEditorExtensionsWithoutProps,
} from "@/extensions/core-without-props";

// editor extension configs
const RICH_TEXT_EDITOR_EXTENSIONS = CoreEditorExtensionsWithoutProps;
const DOCUMENT_EDITOR_EXTENSIONS = [...CoreEditorExtensionsWithoutProps, ...DocumentEditorExtensionsWithoutProps];
// editor schemas
// @ts-expect-error tiptap types are incorrect
const richTextEditorSchema = getSchema(RICH_TEXT_EDITOR_EXTENSIONS);
// @ts-expect-error tiptap types are incorrect
const documentEditorSchema = getSchema(DOCUMENT_EDITOR_EXTENSIONS);

/**
 * @description apply updates to a doc and return the updated doc in binary format
 * @param {Uint8Array} document
 * @param {Uint8Array} updates
 * @returns {Uint8Array}
 */
export const applyUpdates = (document: Uint8Array, updates?: Uint8Array): Uint8Array => {
  const yDoc = new Y.Doc();
  Y.applyUpdate(yDoc, document);
  if (updates) {
    Y.applyUpdate(yDoc, updates);
  }

  const encodedDoc = Y.encodeStateAsUpdate(yDoc);
  return encodedDoc;
};

/**
 * @description this function encodes binary data to base64 string
 * @param {Uint8Array} document
 * @returns {string}
 */
export const convertBinaryDataToBase64String = (document: Uint8Array): string =>
  Buffer.from(document).toString("base64");

/**
 * @description this function decodes base64 string to binary data
 * @param {string} document
 * @returns {ArrayBuffer}
 */
export const convertBase64StringToBinaryData = (document: string): ArrayBuffer => Buffer.from(document, "base64");

/**
 * @description this function generates the binary equivalent of html content for the rich text editor
 * @param {string} descriptionHTML
 * @returns {Uint8Array}
 */
export const getBinaryDataFromRichTextEditorHTMLString = (descriptionHTML: string): Uint8Array => {
  // convert HTML to JSON
  // @ts-expect-error tiptap types are incorrect
  const contentJSON = generateJSON(descriptionHTML ?? "<p></p>", RICH_TEXT_EDITOR_EXTENSIONS);
  // convert JSON to Y.Doc format
  const transformedData = prosemirrorJSONToYDoc(richTextEditorSchema, contentJSON, "default");
  // convert Y.Doc to Uint8Array format
  const encodedData = Y.encodeStateAsUpdate(transformedData);
  return encodedData;
};

/**
 * @description this function generates the binary equivalent of html content for the document editor
 * @param {string} descriptionHTML
 * @returns {Uint8Array}
 */
export const getBinaryDataFromDocumentEditorHTMLString = (descriptionHTML: string): Uint8Array => {
  // convert HTML to JSON
  // @ts-expect-error tiptap types are incorrect
  const contentJSON = generateJSON(descriptionHTML ?? "<p></p>", DOCUMENT_EDITOR_EXTENSIONS);
  // convert JSON to Y.Doc format
  const transformedData = prosemirrorJSONToYDoc(documentEditorSchema, contentJSON, "default");
  // convert Y.Doc to Uint8Array format
  const encodedData = Y.encodeStateAsUpdate(transformedData);
  return encodedData;
};

/**
 * @description this function generates all document formats for the provided binary data for the rich text editor
 * @param {Uint8Array} description
 * @returns
 */
export const getAllDocumentFormatsFromRichTextEditorBinaryData = (
  description: Uint8Array
): {
  contentBinaryEncoded: string;
  contentJSON: object;
  contentHTML: string;
} => {
  // encode binary description data
  const base64Data = convertBinaryDataToBase64String(description);
  const yDoc = new Y.Doc();
  Y.applyUpdate(yDoc, description);
  // convert to JSON
  const type = yDoc.getXmlFragment("default");
  const contentJSON = yXmlFragmentToProseMirrorRootNode(type, richTextEditorSchema).toJSON();
  // convert to HTML
  // @ts-expect-error tiptap types are incorrect
  const contentHTML = generateHTML(contentJSON, RICH_TEXT_EDITOR_EXTENSIONS);

  return {
    contentBinaryEncoded: base64Data,
    contentJSON,
    contentHTML,
  };
};

/**
 * @description this function generates all document formats for the provided binary data for the document editor
 * @param {Uint8Array} description
 * @returns
 */
export const getAllDocumentFormatsFromDocumentEditorBinaryData = (
  description: Uint8Array
): {
  contentBinaryEncoded: string;
  contentJSON: object;
  contentHTML: string;
} => {
  // encode binary description data
  const base64Data = convertBinaryDataToBase64String(description);
  const yDoc = new Y.Doc();
  Y.applyUpdate(yDoc, description);
  // convert to JSON
  const type = yDoc.getXmlFragment("default");
  const contentJSON = yXmlFragmentToProseMirrorRootNode(type, documentEditorSchema).toJSON();
  // convert to HTML
  // @ts-expect-error tiptap types are incorrect
  const contentHTML = generateHTML(contentJSON, DOCUMENT_EDITOR_EXTENSIONS);

  return {
    contentBinaryEncoded: base64Data,
    contentJSON,
    contentHTML,
  };
};
