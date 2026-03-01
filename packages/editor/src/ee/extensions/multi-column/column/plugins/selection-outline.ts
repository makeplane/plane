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

import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
// constants
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";

type ColumnSelectionOutlinePluginState = {
  decorations?: DecorationSet;
  selectedColumnPos?: number;
};

const COLUMN_SELECTION_OUTLINE_PLUGIN_KEY = new PluginKey<ColumnSelectionOutlinePluginState>(
  "column-selection-outline"
);

export const ColumnSelectionOutlinePlugin = (editor: Editor): Plugin<ColumnSelectionOutlinePluginState> =>
  new Plugin<ColumnSelectionOutlinePluginState>({
    key: COLUMN_SELECTION_OUTLINE_PLUGIN_KEY,
    state: {
      init: () => ({
        decorations: DecorationSet.empty,
        selectedColumnPos: undefined,
      }),
      apply(tr, prev) {
        if (!editor.isEditable) return prev;

        // Check if there's a metadata flag to highlight a column
        const selectedColumnPos = tr.getMeta(COLUMN_SELECTION_OUTLINE_PLUGIN_KEY);

        // If document changed, clear any existing selection (dropdown should already be closed)
        // This prevents stale selections when columns are deleted, moved, or modified
        if (tr.docChanged && prev.selectedColumnPos !== undefined) {
          return {
            decorations: DecorationSet.empty,
            selectedColumnPos: undefined,
          };
        }

        // If no change requested, return previous state
        if (selectedColumnPos === undefined) {
          return prev;
        }

        // If clearing selection
        if (selectedColumnPos === null) {
          return {
            decorations: DecorationSet.empty,
            selectedColumnPos: undefined,
          };
        }

        // If selecting a column, validate it exists
        const node = tr.doc.nodeAt(selectedColumnPos);
        if (node && node.type.name === (ADDITIONAL_EXTENSIONS.COLUMN as string)) {
          const decoration = Decoration.node(selectedColumnPos, selectedColumnPos + node.nodeSize, {
            class: "selected-column",
          });

          return {
            decorations: DecorationSet.create(tr.doc, [decoration]),
            selectedColumnPos,
          };
        }

        // If node doesn't exist or isn't a column, clear selection
        return {
          decorations: DecorationSet.empty,
          selectedColumnPos: undefined,
        };
      },
    },
    props: {
      decorations(state) {
        const pluginState = COLUMN_SELECTION_OUTLINE_PLUGIN_KEY.getState(state);
        return pluginState?.decorations || DecorationSet.empty;
      },
    },
  });

// Helper function to set selected column
export const setSelectedColumn = (editor: Editor, columnPos: number | null) => {
  const tr = editor.state.tr.setMeta(COLUMN_SELECTION_OUTLINE_PLUGIN_KEY, columnPos);
  editor.view.dispatch(tr);
};
