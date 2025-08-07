import { getSchema } from "@tiptap/core";
import { generateHTML, generateJSON } from "@tiptap/html";
import { prosemirrorJSONToYDoc, yXmlFragmentToProseMirrorRootNode } from "y-prosemirror";
import * as Y from "yjs";
// extensions
import { TDocumentPayload } from "@plane/types";
import { PARSER_KIT } from "@/extensions/parser-kit";

// parser schema
const parserSchema = getSchema(PARSER_KIT);

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
export const getBinaryDataFromHTMLString = (descriptionHTML: string): Uint8Array => {
  // convert HTML to JSON
  const contentJSON = generateJSON(descriptionHTML ?? "<p></p>", PARSER_KIT);
  // convert JSON to Y.Doc format
  const transformedData = prosemirrorJSONToYDoc(parserSchema, contentJSON, "default");
  // convert Y.Doc to Uint8Array format
  const encodedData = Y.encodeStateAsUpdate(transformedData);
  return encodedData;
};

/**
 * @description this function generates all document formats for the provided binary data for the rich text editor
 * @param {Uint8Array} description
 * @returns
 */
export const getAllDocumentFormatsFromBinaryData = (
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
  const contentJSON = yXmlFragmentToProseMirrorRootNode(type, parserSchema).toJSON();
  // convert to HTML
  const contentHTML = generateHTML(contentJSON, PARSER_KIT);

  return {
    contentBinaryEncoded: base64Data,
    contentJSON,
    contentHTML,
  };
};

type TConvertHTMLDocumentToAllFormatsArgs = {
  document_html: string;
};

/**
 * @description Converts HTML string to all supported document formats (JSON, HTML, and binary)
 * @param {TConvertHTMLDocumentToAllFormatsArgs} args - Arguments containing HTML content and variant type
 * @returns {TDocumentPayload} Object containing the document in all supported formats
 */
export const getAllDocumentFormatsFromHTMLString = (args: TConvertHTMLDocumentToAllFormatsArgs): TDocumentPayload => {
  const { document_html } = args;

  // Convert HTML to binary format for rich text editor
  const contentBinary = getBinaryDataFromHTMLString(document_html);
  // Generate all document formats from the binary data
  const { contentBinaryEncoded, contentHTML, contentJSON } = getAllDocumentFormatsFromBinaryData(contentBinary);

  return {
    description: contentJSON,
    description_html: contentHTML,
    description_binary: contentBinaryEncoded,
  };
};
