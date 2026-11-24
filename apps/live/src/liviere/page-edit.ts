/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: page content and title changes coming from the public API, applied as
// regular Yjs edits on the existing document (never by rebuilding the binary from HTML).

import { getSchema } from "@tiptap/core";
import type { Extensions } from "@tiptap/core";
import { generateJSON } from "@tiptap/html";
import { updateYFragment } from "@tiptap/y-tiptap";
import * as Y from "yjs";
import {
  CoreEditorExtensionsWithoutProps,
  DocumentEditorExtensionsWithoutProps,
  generateTitleProsemirrorJson,
  getAllDocumentFormatsFromDocumentEditorBinaryData,
} from "@plane/editor/lib";

// Same extensions and schema as the document editor helpers in @plane/editor (yjs-utils.ts). The cast only
// bridges the type identity of the two @tiptap/core copies in the workspace (different @tiptap/pm peers).
const DOCUMENT_EDITOR_EXTENSIONS = [
  ...CoreEditorExtensionsWithoutProps,
  ...DocumentEditorExtensionsWithoutProps,
] as unknown as Extensions;
const documentEditorSchema = getSchema(DOCUMENT_EDITOR_EXTENSIONS);

export const CONTENT_FRAGMENT = "default";
export const TITLE_FRAGMENT = "title";

export type TPageEdit = {
  descriptionHtml?: string;
  name?: string;
};

export type TPageEditResult = {
  /** Full document state after the edit, base64 */
  descriptionBinary: string;
  descriptionHtml: string;
  descriptionJson: object;
  /** Only the changes made by this edit, base64 (to replay on other copies of the document) */
  update: string;
};

/**
 * Applies the edit as a diff: only the nodes that differ from the target are changed, so unchanged
 * paragraphs keep their Yjs items. Concurrent edits in them survive, and stale copies of the document
 * (browser y-indexeddb cache, other live instances) merge without duplicating content.
 */
export const applyPageEdit = (doc: Y.Doc, edit: TPageEdit, origin?: unknown): void => {
  // Parse before opening the transaction, so invalid input leaves the document untouched
  const contentNode =
    edit.descriptionHtml === undefined
      ? null
      : documentEditorSchema.nodeFromJSON(generateJSON(edit.descriptionHtml || "<p></p>", DOCUMENT_EDITOR_EXTENSIONS));
  const titleNode =
    edit.name === undefined ? null : documentEditorSchema.nodeFromJSON(generateTitleProsemirrorJson(edit.name));

  doc.transact(() => {
    if (contentNode) {
      updateYFragment(doc, doc.getXmlFragment(CONTENT_FRAGMENT), contentNode, {
        mapping: new Map(),
        isOMark: new Map(),
      });
    }
    if (titleNode) {
      updateYFragment(doc, doc.getXmlFragment(TITLE_FRAGMENT), titleNode, { mapping: new Map(), isOMark: new Map() });
    }
  }, origin);
};

/** Applies the edit to `doc` and returns the resulting formats plus the incremental update. */
export const editDocument = (doc: Y.Doc, edit: TPageEdit, origin?: unknown): TPageEditResult => {
  const stateBefore = Y.encodeStateVector(doc);
  applyPageEdit(doc, edit, origin);
  const update = Y.encodeStateAsUpdate(doc, stateBefore);
  const { contentBinaryEncoded, contentHTML, contentJSON } = getAllDocumentFormatsFromDocumentEditorBinaryData(
    Y.encodeStateAsUpdate(doc),
    false
  );
  return {
    descriptionBinary: contentBinaryEncoded,
    descriptionHtml: contentHTML,
    descriptionJson: contentJSON,
    update: Buffer.from(update).toString("base64"),
  };
};

/** Builds a detached document from a stored binary state, applies the edit and returns the result. */
export const editStoredDocument = (state: Uint8Array, edit: TPageEdit): TPageEditResult => {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, state);
  try {
    return editDocument(doc, edit);
  } finally {
    doc.destroy();
  }
};

/**
 * Edit of a document that is open in the editor. The diff is computed against the stored state, not
 * against the in-memory document, and then merged into the in-memory document as a CRDT update. So
 * changes a person typed that are not stored yet are merged with the edit instead of being treated
 * as content to remove. The merge has no transaction origin: connected editors receive it, and
 * Hocuspocus does not schedule its own store (the caller stores the returned state).
 */
export const editLoadedDocument = (loaded: Y.Doc, storedState: Uint8Array, edit: TPageEdit): TPageEditResult => {
  const stored = new Y.Doc();
  Y.applyUpdate(stored, storedState);
  try {
    const { update } = editDocument(stored, edit);
    const updateBinary = Buffer.from(update, "base64");
    // The loaded document already contains the stored state; applying it again is a no-op safeguard
    Y.applyUpdate(loaded, storedState);
    Y.applyUpdate(loaded, updateBinary);
    const { contentBinaryEncoded, contentHTML, contentJSON } = getAllDocumentFormatsFromDocumentEditorBinaryData(
      Y.encodeStateAsUpdate(loaded),
      false
    );
    return {
      descriptionBinary: contentBinaryEncoded,
      descriptionHtml: contentHTML,
      descriptionJson: contentJSON,
      update,
    };
  } finally {
    stored.destroy();
  }
};
