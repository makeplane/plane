/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Transaction } from "@tiptap/pm/state";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const COLUMN_DRAG_STATE_PLUGIN_KEY = new PluginKey("columnDragState");

export const updateColumnDragMeta = (tr: Transaction, hiddenColumnPos: number | null) => {
  tr.setMeta(COLUMN_DRAG_STATE_PLUGIN_KEY, hiddenColumnPos);
};

/**
 * @description Plugin to manage column drag state using decorations.
 * This allows hiding column content during drag operations without modifying the document.
 * Decorations are local to each user and not persisted or shared.
 */
export const ColumnDragStatePlugin = new Plugin({
  key: COLUMN_DRAG_STATE_PLUGIN_KEY,
  state: {
    init() {
      return DecorationSet.empty;
    },
    apply(tr, oldState) {
      // Get metadata about which column to hide
      const hiddenColumnPos = tr.getMeta(COLUMN_DRAG_STATE_PLUGIN_KEY) as number | null | undefined;

      if (hiddenColumnPos === undefined) {
        // No change, map decorations through the transaction
        return oldState.map(tr.mapping, tr.doc);
      }

      if (hiddenColumnPos === null) {
        // Clear all decorations
        return DecorationSet.empty;
      }

      // Create decoration for hidden column
      const decorations: Decoration[] = [];
      if (typeof hiddenColumnPos === "number") {
        const node = tr.doc.nodeAt(hiddenColumnPos);
        if (node) {
          decorations.push(
            Decoration.node(hiddenColumnPos, hiddenColumnPos + node.nodeSize, {
              class: "column-content-hidden",
            })
          );
        }
      }

      return DecorationSet.create(tr.doc, decorations);
    },
  },
  props: {
    decorations(state) {
      return this.getState(state);
    },
  },
});
