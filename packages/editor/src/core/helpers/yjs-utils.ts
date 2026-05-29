import { Buffer } from "buffer";
import type { Extensions, JSONContent } from "@tiptap/core";
import { getSchema } from "@tiptap/core";
import { generateHTML, generateJSON } from "@tiptap/html";
import { prosemirrorJSONToYDoc, yXmlFragmentToProseMirrorRootNode } from "y-prosemirror";
import * as Y from "yjs";
// extensions
import type { TDocumentPayload } from "@plane/types";
import {
  CoreEditorExtensionsWithoutProps,
  DocumentEditorExtensionsWithoutProps,
} from "@/extensions/core-without-props";
import { TitleExtensions } from "@/extensions/title-extension";
import { sanitizeHTML } from "@plane/utils";

// editor extension configs
const RICH_TEXT_EDITOR_EXTENSIONS = CoreEditorExtensionsWithoutProps;
const DOCUMENT_EDITOR_EXTENSIONS = [...CoreEditorExtensionsWithoutProps, ...DocumentEditorExtensionsWithoutProps];
export const TITLE_EDITOR_EXTENSIONS: Extensions = TitleExtensions;
// editor schemas
const richTextEditorSchema = getSchema(RICH_TEXT_EDITOR_EXTENSIONS);
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
 * @returns {Buffer<ArrayBuffer>}
 */
export const convertBase64StringToBinaryData = (document: string): Buffer<ArrayBuffer> =>
  Buffer.from(document, "base64");

/**
 * @description this function generates the binary equivalent of html content for the rich text editor
 * @param {string} descriptionHTML
 * @returns {Uint8Array}
 */
export const getBinaryDataFromRichTextEditorHTMLString = (descriptionHTML: string): Uint8Array => {
  // convert HTML to JSON
  const contentJSON = generateJSON(descriptionHTML ?? "<p></p>", RICH_TEXT_EDITOR_EXTENSIONS);
  // convert JSON to Y.Doc format
  const transformedData = prosemirrorJSONToYDoc(richTextEditorSchema, contentJSON, "default");
  // convert Y.Doc to Uint8Array format
  const encodedData = Y.encodeStateAsUpdate(transformedData);
  return encodedData;
};

export const generateTitleProsemirrorJson = (text: string): JSONContent => {
  return {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        ...(text
          ? {
              content: [
                {
                  type: "text",
                  text,
                },
              ],
            }
          : {}),
      },
    ],
  };
};

/**
 * @description this function generates the binary equivalent of html content for the document editor
 * @param {string} descriptionHTML - The HTML content to convert
 * @param {string} [title] - Optional title to append to the document
 * @returns {Uint8Array}
 */
export const getBinaryDataFromDocumentEditorHTMLString = (descriptionHTML: string, title?: string): Uint8Array => {
  // convert HTML to JSON
  const contentJSON = generateJSON(descriptionHTML ?? "<p></p>", DOCUMENT_EDITOR_EXTENSIONS);
  // convert JSON to Y.Doc format
  const transformedData = prosemirrorJSONToYDoc(documentEditorSchema, contentJSON, "default");

  // If title is provided, merge it into the document
  if (title != null) {
    const titleJSON = generateTitleProsemirrorJson(title);
    const titleField = prosemirrorJSONToYDoc(documentEditorSchema, titleJSON, "title");
    // Encode the title YDoc to updates and apply them to the main document
    const titleUpdates = Y.encodeStateAsUpdate(titleField);
    Y.applyUpdate(transformedData, titleUpdates);
  }

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
  description: Uint8Array,
  updateTitle: boolean
): {
  contentBinaryEncoded: string;
  contentJSON: object;
  contentHTML: string;
  titleHTML?: string;
} => {
  // encode binary description data
  const base64Data = convertBinaryDataToBase64String(description);
  const yDoc = new Y.Doc();
  Y.applyUpdate(yDoc, description);
  // convert to JSON
  const type = yDoc.getXmlFragment("default");
  const contentJSON = yXmlFragmentToProseMirrorRootNode(type, documentEditorSchema).toJSON();
  // convert to HTML
  const contentHTML = generateHTML(contentJSON, DOCUMENT_EDITOR_EXTENSIONS);

  if (updateTitle) {
    const title = yDoc.getXmlFragment("title");
    const titleJSON = yXmlFragmentToProseMirrorRootNode(title, documentEditorSchema).toJSON();
    const titleHTML = extractTextFromHTML(generateHTML(titleJSON, DOCUMENT_EDITOR_EXTENSIONS));

    return {
      contentBinaryEncoded: base64Data,
      contentJSON,
      contentHTML,
      titleHTML,
    };
  } else {
    return {
      contentBinaryEncoded: base64Data,
      contentJSON,
      contentHTML,
    };
  }
};

type TConvertHTMLDocumentToAllFormatsArgs = {
  document_html: string;
  variant: "rich" | "document";
};

/**
 * @description Converts HTML content to all supported document formats (JSON, HTML, and binary)
 * @param {TConvertHTMLDocumentToAllFormatsArgs} args - Arguments containing HTML content and variant type
 * @param {string} args.document_html - The HTML content to convert
 * @param {"rich" | "document"} args.variant - The type of editor variant to use for conversion
 * @returns {TDocumentPayload} Object containing the document in all supported formats
 * @throws {Error} If an invalid variant is provided
 */
export const convertHTMLDocumentToAllFormats = (args: TConvertHTMLDocumentToAllFormatsArgs): TDocumentPayload => {
  const { document_html, variant } = args;

  let allFormats: TDocumentPayload;

  if (variant === "rich") {
    // Convert HTML to binary format for rich text editor
    const contentBinary = getBinaryDataFromRichTextEditorHTMLString(document_html);
    // Generate all document formats from the binary data
    const { contentBinaryEncoded, contentHTML, contentJSON } =
      getAllDocumentFormatsFromRichTextEditorBinaryData(contentBinary);
    allFormats = {
      description_json: contentJSON,
      description_html: contentHTML,
      description_binary: contentBinaryEncoded,
    };
  } else if (variant === "document") {
    // Convert HTML to binary format for document editor
    const contentBinary = getBinaryDataFromDocumentEditorHTMLString(document_html);
    // Generate all document formats from the binary data
    const { contentBinaryEncoded, contentHTML, contentJSON } = getAllDocumentFormatsFromDocumentEditorBinaryData(
      contentBinary,
      false
    );
    allFormats = {
      description_json: contentJSON,
      description_html: contentHTML,
      description_binary: contentBinaryEncoded,
    };
  } else {
    throw new Error(`Invalid variant provided: ${variant}`);
  }

  return allFormats;
};

export const extractTextFromHTML = (html: string): string => {
  // Use DOMPurify to safely extract text and remove all HTML tags
  // This is more secure than regex as it handles edge cases and prevents injection
  // Note: sanitizeHTML trims whitespace, which is acceptable for title extraction
  const sanitizedText = sanitizeHTML(html); // sanitize the string to remove all HTML tags
  return sanitizedText.trim() || ""; // trim the string to remove leading and trailing whitespaces
};
