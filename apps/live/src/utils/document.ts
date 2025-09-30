import { getSchema } from "@tiptap/core";
import { generateHTML, generateJSON } from "@tiptap/html";
import { prosemirrorJSONToYDoc, yXmlFragmentToProseMirrorRootNode } from "y-prosemirror";
import * as Y from "yjs";
// plane editor
import {
  getAllDocumentFormatsFromDocumentEditorBinaryData,
  getAllDocumentFormatsFromRichTextEditorBinaryData,
  getBinaryDataFromDocumentEditorHTMLString,
  getBinaryDataFromRichTextEditorHTMLString,
} from "@plane/editor";
import { CoreEditorExtensionsWithoutProps, DocumentEditorExtensionsWithoutProps } from "@plane/editor/lib";
// plane types
import { TDocumentPayload } from "@plane/types";

const DOCUMENT_EDITOR_EXTENSIONS = [...CoreEditorExtensionsWithoutProps, ...DocumentEditorExtensionsWithoutProps];
const documentEditorSchema = getSchema(DOCUMENT_EDITOR_EXTENSIONS);

type TArgs = {
  document_html: string;
  variant: "rich" | "document";
};

export const convertHTMLDocumentToAllFormats = (args: TArgs): TDocumentPayload => {
  const { document_html, variant } = args;

  if (variant === "rich") {
    const contentBinary = getBinaryDataFromRichTextEditorHTMLString(document_html);
    const { contentBinaryEncoded, contentHTML, contentJSON } =
      getAllDocumentFormatsFromRichTextEditorBinaryData(contentBinary);
    return {
      description: contentJSON,
      description_html: contentHTML,
      description_binary: contentBinaryEncoded,
    };
  }

  if (variant === "document") {
    const contentBinary = getBinaryDataFromDocumentEditorHTMLString(document_html);
    const { contentBinaryEncoded, contentHTML, contentJSON } =
      getAllDocumentFormatsFromDocumentEditorBinaryData(contentBinary);
    return {
      description: contentJSON,
      description_html: contentHTML,
      description_binary: contentBinaryEncoded,
    };
  }

  throw new Error(`Invalid variant provided: ${variant}`);
};

export const getAllDocumentFormatsFromBinaryData = (
  description: Uint8Array
): {
  contentBinaryEncoded: string;
  contentJSON: object;
  contentHTML: string;
} => {
  // encode binary description data
  const base64Data = Buffer.from(description).toString("base64");
  const yDoc = new Y.Doc();
  Y.applyUpdate(yDoc, description);
  // convert to JSON
  const type = yDoc.getXmlFragment("default");
  const contentJSON = yXmlFragmentToProseMirrorRootNode(type, documentEditorSchema).toJSON();
  // convert to HTML
  const contentHTML = generateHTML(contentJSON, DOCUMENT_EDITOR_EXTENSIONS);

  return {
    contentBinaryEncoded: base64Data,
    contentJSON,
    contentHTML,
  };
};

export const getBinaryDataFromHTMLString = (descriptionHTML: string): Uint8Array => {
  // convert HTML to JSON
  const contentJSON = generateJSON(descriptionHTML ?? "<p></p>", DOCUMENT_EDITOR_EXTENSIONS);
  // convert JSON to Y.Doc format
  const transformedData = prosemirrorJSONToYDoc(documentEditorSchema, contentJSON, "default");
  // convert Y.Doc to Uint8Array format
  return Y.encodeStateAsUpdate(transformedData);
};
