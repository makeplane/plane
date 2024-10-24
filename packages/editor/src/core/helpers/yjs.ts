import { CoreEditorExtensionsWithoutProps } from "@/extensions";
import { getSchema } from "@tiptap/core";
import { generateJSON } from "@tiptap/html";
import { prosemirrorJSONToYDoc } from "y-prosemirror";
import * as Y from "yjs";

/**
 * @description apply updates to a doc and return the updated doc in base64(binary) format
 * @param {Uint8Array} document
 * @param {Uint8Array} updates
 * @returns {string} base64(binary) form of the updated doc
 */
export const applyUpdates = (document: Uint8Array, updates: Uint8Array): Uint8Array => {
  const yDoc = new Y.Doc();
  Y.applyUpdate(yDoc, document);
  Y.applyUpdate(yDoc, updates);

  const encodedDoc = Y.encodeStateAsUpdate(yDoc);
  return encodedDoc;
};

const richTextEditorSchema = getSchema(CoreEditorExtensionsWithoutProps);
export const getBinaryDataFromRichTextEditorHTMLString = (descriptionHTML: string): Uint8Array => {
  // convert HTML to JSON
  const contentJSON = generateJSON(descriptionHTML ?? "<p></p>", CoreEditorExtensionsWithoutProps);
  // convert JSON to Y.Doc format
  const transformedData = prosemirrorJSONToYDoc(richTextEditorSchema, contentJSON, "default");
  // convert Y.Doc to Uint8Array format
  const encodedData = Y.encodeStateAsUpdate(transformedData);

  return encodedData;
};
