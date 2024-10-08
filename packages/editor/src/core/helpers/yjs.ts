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
