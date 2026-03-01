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

import { combineTransactionSteps, findChildrenInRange, getChangedRanges } from "@tiptap/core";
import { Fragment, Slice } from "@tiptap/pm/model";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { Transaction } from "@tiptap/pm/state";
// types
import type { UniqueIDOptions } from "./extension";
// utils
import { createIdsForView, findDuplicates } from "./utils";

export const createUniqueIDPlugin = (options: UniqueIDOptions) => {
  let dragSourceElement: Element | null = null;
  let transformPasted = false;
  let syncHandler: (() => void) | null = null;

  return new Plugin({
    key: new PluginKey("uniqueID"),
    appendTransaction: (transactions, oldState, newState) => {
      // Early exit for collab transactions - check first for performance
      const isCollabTransaction = transactions.some((tr) => tr.getMeta("y-sync$"));
      if (isCollabTransaction) {
        return;
      }

      const hasDocChanges =
        transactions.some((transaction) => transaction.docChanged) && !oldState.doc.eq(newState.doc);
      const filterTransactions =
        options.filterTransaction && transactions.some((tr) => !options.filterTransaction?.(tr));

      if (!hasDocChanges || filterTransactions) {
        return;
      }

      const { tr } = newState;
      const { types, attributeName, generateUniqueID } = options;
      const transform = combineTransactionSteps(oldState.doc, transactions as Transaction[]);
      const { mapping } = transform;

      // get changed ranges based on the old state
      const changes = getChangedRanges(transform);

      changes.forEach(({ newRange }) => {
        const newNodes = findChildrenInRange(newState.doc, newRange, (node) => types.includes(node.type.name));

        // Only check duplicates within the changed range - much faster than scanning entire doc
        const newIds = newNodes.map(({ node }) => node.attrs[attributeName]).filter((id) => id !== null);
        const duplicatedNewIds = findDuplicates(newIds);

        newNodes.forEach(({ node, pos }) => {
          // instead of checking `node.attrs[attributeName]` directly
          // we look at the current state of the node within `tr.doc`.
          // this helps to prevent adding new ids to the same node
          // if the node changed multiple times within one transaction
          const id = tr.doc.nodeAt(pos)?.attrs[attributeName];

          if (id === null) {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              [attributeName]: generateUniqueID({ node, pos }),
            });

            return;
          }

          // check if the node doesn't exist in the old state
          const { deleted } = mapping.invert().mapResult(pos);

          // If this is a new node (didn't exist in old state) and its ID is duplicated
          const newNode = deleted && duplicatedNewIds.includes(id);

          if (newNode) {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              [attributeName]: generateUniqueID({ node, pos }),
            });
          }
        });
      });

      if (!tr.steps.length) {
        return;
      }

      // `tr.setNodeMarkup` resets the stored marks
      // so we'll restore them if they exist
      tr.setStoredMarks(newState.tr.storedMarks);

      // Don't add ID generation to undo history
      // since its causing issue with undo feature we are commmeting it out for now
      // tr.setMeta("addToHistory", false);

      return tr;
    },

    // we register a global drag handler to track the current drag source element
    view(view) {
      const handleDragstart = (event: DragEvent) => {
        dragSourceElement = view.dom.parentElement?.contains(event.target as Element) ? view.dom.parentElement : null;
      };

      window.addEventListener("dragstart", handleDragstart);

      // Handle provider sync listener for creating IDs when collaboration provider syncs
      const provider = options.provider;
      if (provider && !provider.isSynced) {
        syncHandler = () => {
          createIdsForView(view, options);

          // Clean up the listener after it runs
          if (provider && syncHandler) {
            provider.off("synced", syncHandler);
            syncHandler = null;
          }
        };

        provider.on("synced", syncHandler);
      }

      return {
        destroy() {
          window.removeEventListener("dragstart", handleDragstart);

          // Clean up provider sync listener if it exists
          if (provider && syncHandler) {
            provider.off("synced", syncHandler);
            syncHandler = null;
          }
        },
      };
    },

    props: {
      // `handleDOMEvents` is called before `transformPasted`
      // so we can do some checks before
      handleDOMEvents: {
        // only create new ids for dropped content
        // or dropped content while holding `alt`
        // or content is dragged from another editor
        drop: (view, event) => {
          if (dragSourceElement !== view.dom.parentElement || event.dataTransfer?.effectAllowed === "copy") {
            dragSourceElement = null;
            transformPasted = true;
          }

          return false;
        },
        // always create new ids on pasted content
        paste: () => {
          transformPasted = true;

          return false;
        },
      },

      // we'll remove ids for every pasted node
      // so we can create a new one within `appendTransaction`
      transformPasted: (slice) => {
        if (!transformPasted) {
          return slice;
        }

        const { types, attributeName } = options;
        const removeId = (fragment: Fragment): Fragment => {
          const list: ProseMirrorNode[] = [];

          fragment.forEach((node) => {
            // don't touch text nodes
            if (node.isText) {
              list.push(node);

              return;
            }

            // check for any other child nodes
            if (!types.includes(node.type.name)) {
              list.push(node.copy(removeId(node.content)));

              return;
            }

            // remove id
            const nodeWithoutId = node.type.create(
              {
                ...node.attrs,
                [attributeName]: null,
              },
              removeId(node.content),
              node.marks
            );

            list.push(nodeWithoutId);
          });

          return Fragment.from(list);
        };

        // reset check
        transformPasted = false;

        return new Slice(removeId(slice.content), slice.openStart, slice.openEnd);
      },
    },
  });
};
