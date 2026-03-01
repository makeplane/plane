/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { getSchema } from "@tiptap/core";
import { yXmlFragmentToProseMirrorRootNode } from "y-prosemirror";
import * as Y from "yjs";
// extensions
import {
  CoreEditorExtensionsWithoutProps,
  DocumentEditorExtensionsWithoutProps,
} from "@/extensions/core-without-props";
// helpers
import { convertBase64StringToBinaryData, convertBinaryDataToBase64String } from "./yjs-utils";

const DOCUMENT_EDITOR_EXTENSIONS = [...CoreEditorExtensionsWithoutProps, ...DocumentEditorExtensionsWithoutProps];
const documentEditorSchema = getSchema(DOCUMENT_EDITOR_EXTENSIONS);

/**
 * @description Extract unique user IDs from PermanentUserData clients map
 * @param {Y.PermanentUserData} userData - The PermanentUserData instance
 * @returns {string[]} Array of unique user IDs
 */
export const extractUserIdsFromPermanentUserData = (userData: Y.PermanentUserData): string[] => {
  const userIds = new Set<string>();
  if (userData.clients && userData.clients.size > 0) {
    for (const userId of userData.clients.values()) {
      if (userId) {
        userIds.add(userId);
      }
    }
  }
  return Array.from(userIds);
};

/**
 * @description Extract unique user IDs from a Yjs binary document
 * The user IDs are stored in the PermanentUserData mapping within the Y.Doc
 * @param {string | Uint8Array} binaryData - The binary document data (base64 string or Uint8Array)
 * @returns {string[]} Array of unique user IDs who edited this document
 */
export const extractUserIdsFromBinary = (binaryData: string | Uint8Array | null | undefined): string[] => {
  if (!binaryData) return [];

  try {
    const binaryUpdate = typeof binaryData === "string" ? convertBase64StringToBinaryData(binaryData) : binaryData;

    const yDoc = new Y.Doc({ gc: false });
    Y.applyUpdate(yDoc, binaryUpdate);

    const userData = new Y.PermanentUserData(yDoc);
    return extractUserIdsFromPermanentUserData(userData);
  } catch {
    return [];
  }
};

export type TComputedVersionDiff = {
  docUpdate: string;
  oldSnapshot: string;
  newSnapshot: string;
  editors: string[];
};

/**
 * @description Check if an item ID is in a snapshot's delete set
 */
const isInDeleteSet = (snapshot: Y.Snapshot, id: Y.ID): boolean => {
  const dominated = snapshot.ds.clients.get(id.client);
  if (!dominated) return false;
  for (const range of dominated) {
    if (range.clock <= id.clock && id.clock < range.clock + range.len) {
      return true;
    }
  }
  return false;
};

/**
 * @description Proper visibility check matching y-prosemirror's isVisible
 * An item is visible if: its clock is within the snapshot's state vector AND it's not deleted
 */
const isItemVisible = (item: Y.Item, snapshot: Y.Snapshot): boolean => {
  const dominated = snapshot.sv.get(item.id.client);
  return dominated !== undefined && dominated > item.id.clock && !isInDeleteSet(snapshot, item.id);
};

/**
 * @description Walk up the parent chain to find the shared root type (e.g. XmlFragment "default" / "title")
 * This is needed to filter out items that don't belong to the editor's content tree
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getRootTypeForItem = (item: Y.Item): any | null => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parent: any = item.parent;
  while (parent && parent._item != null) {
    const parentItem = parent._item as Y.Item | null;
    parent = parentItem ? parentItem.parent : null;
  }
  return parent ?? null;
};

/**
 * @description Check if a struct is a Y.Item (not a GC struct)
 * Uses structural check instead of constructor.name to be minification-safe
 */
const isYItem = (struct: unknown): struct is Y.Item =>
  struct !== null && typeof struct === "object" && "id" in struct && "parent" in struct && "content" in struct;

/**
 * @description Extract editors who made VISIBLE changes between two snapshots
 * Only returns users whose changes actually appear as ychange markers in the diff
 * This matches what y-prosemirror does when rendering diffs by:
 * 1. Only considering items under the editor's root XmlFragments ("default", "title")
 * 2. Checking visibility changes between snapshots
 *
 * NOTE: This function uses Yjs internals (doc.store.clients, parent._item) which may
 * change in future Yjs versions. Tested with yjs@13.x. Re-verify after Yjs upgrades.
 *
 * @param {Y.Doc} doc - The Y.Doc containing the content
 * @param {Y.Snapshot} oldSnapshot - Previous snapshot
 * @param {Y.Snapshot} newSnapshot - Current snapshot
 * @param {Y.PermanentUserData} userData - User data mapping clientId -> userId
 * @returns {string[]} Array of user IDs who made visible changes
 */
const extractEditorsFromSnapshots = (
  doc: Y.Doc,
  oldSnapshot: Y.Snapshot,
  newSnapshot: Y.Snapshot,
  userData: Y.PermanentUserData
): string[] => {
  try {
    const editors = new Set<string>();

    // Root fragments that correspond to ProseMirror editors
    // "default" is the main body; "title" exists for the document editor
    // We only consider items under these roots - other shared types (like "versions" array,
    // "users" map for PermanentUserData, etc.) are NOT part of the rendered diff
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rootFragments = new Set<any>([doc.getXmlFragment("default"), doc.getXmlFragment("title")]);

    // Iterate through all structs in the document
    // Check each item's visibility in both snapshots
    // Only attribute users who have items with different visibility AND belong to editor roots
    doc.store.clients.forEach((structs) => {
      for (const struct of structs) {
        // Only process Items (not GC structs) - use structural check for minification safety
        if (!isYItem(struct)) continue;
        const item = struct;

        // IMPORTANT: Only consider items that belong to one of our editor fragments
        // This filters out items from other shared types like "users" map, "versions" array, etc.
        // which can have visibility changes but never produce ychange marks in ProseMirror
        const rootType = getRootTypeForItem(item);
        if (!rootType || !rootFragments.has(rootType)) {
          continue;
        }

        const visibleInOld = isItemVisible(item, oldSnapshot);
        const visibleInNew = isItemVisible(item, newSnapshot);

        if (visibleInOld !== visibleInNew) {
          if (visibleInNew && !visibleInOld) {
            // Item was ADDED - attribute to the user who created it
            const userId = userData.getUserByClientId(item.id.client);
            if (userId) {
              editors.add(userId);
            }
          } else if (visibleInOld && !visibleInNew) {
            // Item was DELETED - attribute to the user who deleted it
            const userId = userData.getUserByDeletedId(item.id);
            if (userId) {
              editors.add(userId);
            }
          }
        }
      }
    });

    return Array.from(editors);
  } catch {
    // Fallback: return all known users from PermanentUserData if internal traversal fails
    // This can happen if Yjs internals change in future versions
    return extractUserIdsFromPermanentUserData(userData);
  }
};

/**
 * @description Compute version diff between two binary updates server-side
 * Returns base64-encoded data ready for API response
 * @param {string | null} currentBinaryBase64 - Current version binary (base64)
 * @param {string | null} previousBinaryBase64 - Previous version binary (base64), null for first version
 * @returns {TComputedVersionDiff} Diff data with editors list
 */
export type TPrecomputedDiffData = {
  docUpdate: string;
  oldSnapshot: string;
  newSnapshot: string;
};

/**
 * @description Precomputed diff data with Uint8Array format (for VersionDiffEditor)
 */
export type TPrecomputedDiffUint8 = {
  docUpdate: Uint8Array;
  oldSnapshot: Uint8Array;
  newSnapshot: Uint8Array;
};

/**
 * @description Convert base64 precomputed diff data to Uint8Array format
 * Use this to convert API response data to the format expected by VersionDiffEditor
 * @param {TPrecomputedDiffData} precomputedDiff - Base64-encoded diff data from API
 * @returns {TPrecomputedDiffUint8} Diff data with Uint8Array format
 */
export const convertPrecomputedDiffToUint8Array = (precomputedDiff: TPrecomputedDiffData): TPrecomputedDiffUint8 => ({
  docUpdate: new Uint8Array(convertBase64StringToBinaryData(precomputedDiff.docUpdate)),
  oldSnapshot: new Uint8Array(convertBase64StringToBinaryData(precomputedDiff.oldSnapshot)),
  newSnapshot: new Uint8Array(convertBase64StringToBinaryData(precomputedDiff.newSnapshot)),
});

/**
 * @description Extract ProseMirror JSON from base64-encoded docUpdate
 * Use this to derive document JSON from version diff data without needing it sent from API
 * @param {string} docUpdateBase64 - Base64-encoded Y.js document update
 * @returns {object} ProseMirror JSON representation of the document
 */
export const extractJsonFromDocUpdate = (docUpdateBase64: string): object => {
  const docUpdate = new Uint8Array(convertBase64StringToBinaryData(docUpdateBase64));
  const yDoc = new Y.Doc();
  try {
    Y.applyUpdate(yDoc, docUpdate);
    const type = yDoc.getXmlFragment("default");
    return yXmlFragmentToProseMirrorRootNode(type, documentEditorSchema).toJSON();
  } finally {
    yDoc.destroy();
  }
};

export const computeVersionDiff = (
  currentBinaryBase64: string,
  previousBinaryBase64: string | null
): TComputedVersionDiff => {
  const currentBinary = new Uint8Array(convertBase64StringToBinaryData(currentBinaryBase64));

  let doc: Y.Doc;
  let oldSnapshot: Y.Snapshot;
  let newSnapshot: Y.Snapshot;

  if (previousBinaryBase64) {
    const previousBinary = new Uint8Array(convertBase64StringToBinaryData(previousBinaryBase64));

    // Create ONE doc with GC disabled to preserve struct IDs
    doc = new Y.Doc({ gc: false });

    // Apply old version first, snapshot it
    Y.applyUpdate(doc, previousBinary);
    oldSnapshot = Y.snapshot(doc);

    // Advance to new state using delta
    const svOld = Y.encodeStateVector(doc);
    const deltaOldToNew = Y.diffUpdate(currentBinary, svOld);
    Y.applyUpdate(doc, deltaOldToNew);
    newSnapshot = Y.snapshot(doc);
  } else {
    // First version: old = empty snapshot
    doc = new Y.Doc({ gc: false });
    Y.applyUpdate(doc, currentBinary);
    oldSnapshot = Y.emptySnapshot;
    newSnapshot = Y.snapshot(doc);
  }

  // Extract ONLY editors who made VISIBLE changes between these two snapshots
  // This matches what y-prosemirror does when rendering ychange markers
  const userData = new Y.PermanentUserData(doc);
  const editors = extractEditorsFromSnapshots(doc, oldSnapshot, newSnapshot, userData);

  // Encode everything as base64 for API response
  const result: TComputedVersionDiff = {
    docUpdate: convertBinaryDataToBase64String(Y.encodeStateAsUpdate(doc)),
    oldSnapshot: convertBinaryDataToBase64String(Y.encodeSnapshotV2(oldSnapshot)),
    newSnapshot: convertBinaryDataToBase64String(Y.encodeSnapshotV2(newSnapshot)),
    editors,
  };

  // Clean up Y.Doc to prevent memory leaks on server-side usage
  doc.destroy();

  return result;
};
