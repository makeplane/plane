import { Schema } from "@tiptap/pm/model";
import { prosemirrorJSONToYDoc } from "y-prosemirror";
import * as Y from "yjs";

const defaultSchema: Schema = new Schema({
  nodes: {
    text: {},
    doc: { content: "text*" },
  },
});

/**
 * @description converts ProseMirror JSON to Yjs document
 * @param document prosemirror JSON
 * @param fieldName
 * @param schema
 * @returns {Y.Doc} Yjs document
 */
export const proseMirrorJSONToBinaryString = (
  document: any,
  fieldName: string | Array<string> = "default",
  schema?: Schema
): string => {
  if (!document) {
    throw new Error(
      `You've passed an empty or invalid document to the Transformer. Make sure to pass ProseMirror-compatible JSON. Actually passed JSON: ${document}`
    );
  }

  // allow a single field name
  if (typeof fieldName === "string") {
    const yDoc = prosemirrorJSONToYDoc(schema ?? defaultSchema, document, fieldName);
    const docAsUint8Array = Y.encodeStateAsUpdate(yDoc);
    const base64Doc = Buffer.from(docAsUint8Array).toString("base64");
    return base64Doc;
  }

  const yDoc = new Y.Doc();

  fieldName.forEach((field) => {
    const update = Y.encodeStateAsUpdate(prosemirrorJSONToYDoc(schema ?? defaultSchema, document, field));

    Y.applyUpdate(yDoc, update);
  });

  const docAsUint8Array = Y.encodeStateAsUpdate(yDoc);
  const base64Doc = Buffer.from(docAsUint8Array).toString("base64");

  return base64Doc;
};

/**
 * @description apply updates to a doc and return the updated doc in base64(binary) format
 * @param {Uint8Array} document
 * @param {Uint8Array} updates
 * @returns {string} base64(binary) form of the updated doc
 */
export const applyUpdates = (document: Uint8Array, updates: Uint8Array): string => {
  const yDoc = new Y.Doc();
  Y.applyUpdate(yDoc, document);
  Y.applyUpdate(yDoc, updates);

  const encodedDoc = Y.encodeStateAsUpdate(yDoc);
  const base64Updates = Buffer.from(encodedDoc).toString("base64");
  return base64Updates;
};

/**
 * @description merge multiple updates into one single update
 * @param {Uint8Array[]} updates
 * @returns {Uint8Array} merged updates
 */
export const mergeUpdates = (updates: Uint8Array[]): Uint8Array => {
  const mergedUpdates = Y.mergeUpdates(updates);
  return mergedUpdates;
};
