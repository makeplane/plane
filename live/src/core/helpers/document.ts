import * as Y from "yjs";

/**
 * @description apply updates to a document
 * @param {Uint8Array} document
 * @param {Uint8Array} updates
 * @returns {Uint8Array} conflicts resolved document
 */
export const applyUpdatesToBinaryData = (document: Uint8Array, updates: Uint8Array): Uint8Array => {
  const yDoc = new Y.Doc();
  Y.applyUpdate(yDoc, document);
  Y.applyUpdate(yDoc, updates);

  const encodedDoc = Y.encodeStateAsUpdate(yDoc);
  return encodedDoc;
};
