/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Transaction } from "@tiptap/pm/state";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const TABLE_DRAG_STATE_PLUGIN_KEY = new PluginKey("tableDragState");

export const updateTransactionMeta = (tr: Transaction, hiddenCellPositions: number[] | null) => {
  tr.setMeta(TABLE_DRAG_STATE_PLUGIN_KEY, hiddenCellPositions);
};

/**
 * @description Plugin to manage table drag state using decorations.
 * This allows hiding cell content during drag operations without modifying the document.
 * Decorations are local to each user and not persisted or shared.
 */
export const TableDragStatePlugin = new Plugin({
  key: TABLE_DRAG_STATE_PLUGIN_KEY,
  state: {
    init() {
      return DecorationSet.empty;
    },
    apply(tr, oldState) {
      // Get metadata about which cells to hide
      const hiddenCellPositions = tr.getMeta(TABLE_DRAG_STATE_PLUGIN_KEY) as number[] | null;

      if (hiddenCellPositions === undefined) {
        // No change, map decorations through the transaction
        return oldState.map(tr.mapping, tr.doc);
      }

      if (hiddenCellPositions === null || !Array.isArray(hiddenCellPositions) || hiddenCellPositions.length === 0) {
        // Clear all decorations
        return DecorationSet.empty;
      }

      // Create decorations for hidden cells
      const decorations: Decoration[] = [];
      hiddenCellPositions.forEach((pos) => {
        if (typeof pos !== "number") return;
        const node = tr.doc.nodeAt(pos);
        if (node) {
          decorations.push(
            Decoration.node(pos, pos + node.nodeSize, {
              class: "content-hidden",
            })
          );
        }
      });

      return DecorationSet.create(tr.doc, decorations);
    },
  },
  props: {
    decorations(state) {
      return this.getState(state);
    },
  },
});
