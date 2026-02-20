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

import type { RawCommands } from "@tiptap/core";
import type { NodeType } from "@tiptap/pm/model";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import type {
  ColumnPositionCommandOptions,
  InsertColumnListCommandOptions,
  MultiColumnExtensionOptions,
} from "../types";
import { EColumnAttributeNames } from "../types";
// utils
import { findColumnAtPos, findColumnList } from "../utils";
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [ADDITIONAL_EXTENSIONS.COLUMN_LIST]: {
      /** Insert a new multi-column layout */
      insertColumnList: (options?: InsertColumnListCommandOptions) => ReturnType;
      /** Insert a column to the left of the current column */
      insertColumnLeft: (options?: ColumnPositionCommandOptions) => ReturnType;
      /** Insert a column to the right of the current column */
      insertColumnRight: (options?: ColumnPositionCommandOptions) => ReturnType;
      /** Duplicate the current column */
      duplicateColumn: (options?: ColumnPositionCommandOptions) => ReturnType;
      /** Clear all content from the current column */
      clearColumnContents: (options?: ColumnPositionCommandOptions) => ReturnType;
      /** Delete the current column (unwraps if only 2 columns remain) */
      deleteMultiColumn: (options?: ColumnPositionCommandOptions) => ReturnType;
    };
  }
}

// Helper function to get isFlagged from editor extension options
const getIsFlagged = (editor: {
  extensionManager: { extensions: Array<{ name: string; options?: MultiColumnExtensionOptions }> };
}): boolean => {
  const multiColumnExt = editor.extensionManager.extensions.find(
    (ext) => ext.name === ADDITIONAL_EXTENSIONS.MULTI_COLUMN
  );
  return multiColumnExt?.options?.isFlagged ?? false;
};

export const columnListCommands = (nodeType: NodeType): Partial<RawCommands> => ({
  insertColumnList:
    (options: InsertColumnListCommandOptions = {}) =>
    ({ commands, editor, chain, tr }) => {
      if (getIsFlagged(editor)) return false;

      const { columns = 2 } = options;

      if (columns < 2) return false;

      const currentPos = tr.selection.from;
      const success = commands.insertContent({
        type: nodeType.name,
        content: Array.from({ length: columns }, () => ({
          type: ADDITIONAL_EXTENSIONS.COLUMN,
          content: [{ type: CORE_EXTENSIONS.PARAGRAPH }],
        })),
      });

      if (success) {
        const firstColumnStart = currentPos + 1;
        const firstParagraphPos = firstColumnStart + 1;
        chain().setTextSelection(firstParagraphPos).run();
      }

      return success;
    },

  insertColumnLeft:
    (options?: ColumnPositionCommandOptions) =>
    ({ tr, state, dispatch, editor }) => {
      // Prevent column manipulation when flagged
      if (getIsFlagged(editor)) return false;

      const pos = options?.columnPos ?? state.selection.from;
      const columnInfo = findColumnAtPos(state, pos);
      if (!columnInfo) return false;

      const columnListInfo = findColumnList(state, pos);
      if (!columnListInfo) return false;

      if (dispatch) {
        const newColumn = state.schema.nodes[ADDITIONAL_EXTENSIONS.COLUMN].create(
          { [EColumnAttributeNames.WIDTH]: 1 },
          state.schema.nodes[CORE_EXTENSIONS.PARAGRAPH].create()
        );

        tr.insert(columnInfo.pos, newColumn);
      }

      return true;
    },

  insertColumnRight:
    (options?: ColumnPositionCommandOptions) =>
    ({ tr, state, dispatch, editor }) => {
      // Prevent column manipulation when flagged
      if (getIsFlagged(editor)) return false;

      const pos = options?.columnPos ?? state.selection.from;
      const columnInfo = findColumnAtPos(state, pos);
      if (!columnInfo) return false;

      const columnListInfo = findColumnList(state, pos);
      if (!columnListInfo) return false;

      if (dispatch) {
        const newColumn = state.schema.nodes[ADDITIONAL_EXTENSIONS.COLUMN].create(
          { [EColumnAttributeNames.WIDTH]: 1 },
          state.schema.nodes[CORE_EXTENSIONS.PARAGRAPH].create()
        );

        tr.insert(columnInfo.pos + columnInfo.node.nodeSize, newColumn);
      }

      return true;
    },

  duplicateColumn:
    (options?: ColumnPositionCommandOptions) =>
    ({ tr, state, dispatch, editor }) => {
      // Prevent column manipulation when flagged
      if (getIsFlagged(editor)) return false;

      const pos = options?.columnPos ?? state.selection.from;
      const columnInfo = findColumnAtPos(state, pos);
      if (!columnInfo) return false;

      if (dispatch) {
        const clonedColumn = columnInfo.node.copy(columnInfo.node.content);
        tr.insert(columnInfo.pos + columnInfo.node.nodeSize, clonedColumn);
      }

      return true;
    },

  clearColumnContents:
    (options?: ColumnPositionCommandOptions) =>
    ({ tr, state, dispatch, editor }) => {
      if (getIsFlagged(editor)) return false;

      const pos = options?.columnPos ?? state.selection.from;
      const columnInfo = findColumnAtPos(state, pos);
      if (!columnInfo) return false;

      if (dispatch) {
        const emptyParagraph = state.schema.nodes[CORE_EXTENSIONS.PARAGRAPH].create();
        tr.replaceWith(columnInfo.pos + 1, columnInfo.pos + columnInfo.node.nodeSize - 1, emptyParagraph);
      }

      return true;
    },

  deleteMultiColumn:
    (options?: ColumnPositionCommandOptions) =>
    ({ tr, state, dispatch, editor }) => {
      // Prevent column manipulation when flagged
      if (getIsFlagged(editor)) return false;

      const pos = options?.columnPos ?? state.selection.from;
      const columnInfo = findColumnAtPos(state, pos);
      if (!columnInfo) return false;

      const columnListInfo = findColumnList(state, pos);
      if (!columnListInfo) return false;

      // Collect all columns (columnList can only have columns as children)
      const columns: { node: typeof columnListInfo.node; pos: number }[] = [];
      let currentPos = columnListInfo.pos + 1;

      columnListInfo.node.forEach((child) => {
        columns.push({ node: child, pos: currentPos });
        currentPos += child.nodeSize;
      });

      // If only 2 columns remain, unwrap the remaining column
      if (columns.length === 2) {
        if (dispatch) {
          // Find the remaining column content
          const remainingColumn = columns.find((col) => col.pos !== columnInfo.pos);

          if (remainingColumn) {
            // Replace entire columnList with the remaining column's content
            tr.replaceWith(
              columnListInfo.pos,
              columnListInfo.pos + columnListInfo.node.nodeSize,
              remainingColumn.node.content
            );
          }
        }
        return true;
      }

      // For more than 2 columns, just delete the specified column
      if (dispatch) {
        tr.delete(columnInfo.pos, columnInfo.pos + columnInfo.node.nodeSize);
      }

      return true;
    },
});
