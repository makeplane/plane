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

import { Node, mergeAttributes } from "@tiptap/core";
// constants
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";
// plugins
import { createColumnResizePlugin } from "./plugins/column-resize";
import { ColumnDragHandlePlugin } from "./plugins/drag-handle";
import { ColumnSelectionOutlinePlugin } from "./plugins/selection-outline";
import { ColumnClickHandler } from "./plugins/click-handler";
import { ColumnDragStatePlugin } from "../plugins/drag-state";
// types
import { DEFAULT_COLUMN_ATTRIBUTES, EColumnAttributeNames } from "../types";
import type { SetColumnWidthCommandOptions, TColumnAttributes, MultiColumnExtensionOptions } from "../types";
import type { ColumnNodeType } from "./types";
// utils
import { findColumnNodeAtSelection } from "./utils";
// keyboard
import { handleBackspaceInColumn } from "./keyboard-shortcut";
import { insertLineBelowColumnAction } from "./utils/insert-line-below-column-action";

// Helper function to get isFlagged from editor extension options
const getIsFlagged = (editor: {
  extensionManager: { extensions: Array<{ name: string; options?: MultiColumnExtensionOptions }> };
}): boolean => {
  const multiColumnExt = editor.extensionManager.extensions.find(
    (ext) => ext.name === ADDITIONAL_EXTENSIONS.MULTI_COLUMN
  );
  return multiColumnExt?.options?.isFlagged ?? false;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [ADDITIONAL_EXTENSIONS.COLUMN]: {
      setColumnWidth: (options: SetColumnWidthCommandOptions) => ReturnType;
    };
  }
}

export const Column: ColumnNodeType = Node.create<TColumnAttributes>({
  name: ADDITIONAL_EXTENSIONS.COLUMN,
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,
  draggable: true,

  addAttributes() {
    return {
      [EColumnAttributeNames.ID]: {
        default: DEFAULT_COLUMN_ATTRIBUTES[EColumnAttributeNames.ID],
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes: TColumnAttributes) =>
          attributes[EColumnAttributeNames.ID] ? { "data-id": attributes[EColumnAttributeNames.ID] } : {},
      },
      [EColumnAttributeNames.WIDTH]: {
        default: DEFAULT_COLUMN_ATTRIBUTES[EColumnAttributeNames.WIDTH],
        parseHTML: (element) => {
          const widthAttr = element.getAttribute("data-width") || "";
          const parsedWidth = parseFloat(widthAttr);
          return isFinite(parsedWidth) ? parsedWidth : DEFAULT_COLUMN_ATTRIBUTES[EColumnAttributeNames.WIDTH];
        },
        renderHTML: (attributes: TColumnAttributes) => ({
          "data-width": attributes[EColumnAttributeNames.WIDTH].toString(),
          style: `flex-grow: ${attributes[EColumnAttributeNames.WIDTH]};`,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: `div[${EColumnAttributeNames.NODE_TYPE}="column"]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        [EColumnAttributeNames.NODE_TYPE]: "column",
        class: "editor-column",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setColumnWidth:
        (options: SetColumnWidthCommandOptions) =>
        ({ tr, state, dispatch, editor }) => {
          // Prevent column manipulation when flagged
          if (getIsFlagged(editor)) return false;

          const { width } = options;
          const { $from } = state.selection;
          const columnNode = findColumnNodeAtSelection($from);

          if (!columnNode) {
            return false;
          }

          if (dispatch) {
            tr.setNodeMarkup(columnNode.pos, undefined, {
              ...columnNode.node.attrs,
              [EColumnAttributeNames.WIDTH]: width,
            });
          }

          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        return handleBackspaceInColumn(editor);
      },
      ArrowDown: insertLineBelowColumnAction,
    };
  },

  addProseMirrorPlugins() {
    const isFlagged = getIsFlagged(this.editor);
    return [
      ColumnDragHandlePlugin(this.editor, isFlagged),
      createColumnResizePlugin(this.editor, isFlagged),
      ColumnSelectionOutlinePlugin(this.editor),
      ColumnClickHandler(),
      ColumnDragStatePlugin,
    ];
  },
});
