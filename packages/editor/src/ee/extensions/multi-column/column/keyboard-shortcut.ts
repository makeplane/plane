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

import type { Dispatch, Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import type { Transaction } from "@tiptap/pm/state";
// utils
import { findColumnStructure, getColumnIndex, isColumnEmpty, isCursorAtColumnStart } from "./utils";

/**
 * Handle backspace key in column.
 * When only 2 columns remain and one is empty, unwrap the remaining column's content.
 * Always move cursor to the end of the previous column (or start of next column if deleting first).
 * @returns true if handled, false otherwise
 */
export function handleBackspaceInColumn(editor: Editor): boolean {
  const { state } = editor;
  const { selection } = state;
  const { $from, empty } = selection;

  // Only handle empty selections (no text selected)
  if (!empty) return false;

  const { columnDepth, columnListDepth } = findColumnStructure($from);

  // Not in a column structure
  if (columnDepth === -1 || columnListDepth === -1) return false;

  const column = $from.node(columnDepth);
  const columnList = $from.node(columnListDepth);

  // Only handle empty columns at the start
  if (!isColumnEmpty(column) || !isCursorAtColumnStart($from, columnDepth)) {
    return false;
  }

  const columnCount = columnList.childCount;
  const columnListPos = $from.before(columnListDepth);
  const columnPos = $from.before(columnDepth);
  const currentColumnIndex = getColumnIndex($from, columnListDepth, columnDepth);

  return editor.commands.command(({ tr, dispatch }: { tr: Transaction; dispatch: Dispatch }) => {
    if (!dispatch) return true;

    // When only 2 columns remain, unwrap the columnList
    if (columnCount === 2) {
      const otherColumnIndex = currentColumnIndex === 0 ? 1 : 0;
      const otherColumn = columnList.child(otherColumnIndex);

      if (!otherColumn) return false;

      // Collect content from the remaining column
      const content: ProseMirrorNode[] = [];
      otherColumn.forEach((child) => content.push(child));

      // If both columns are empty, delete the columnList
      if (content.length === 0) {
        tr.delete(columnListPos, columnListPos + columnList.nodeSize);
        const $target = tr.doc.resolve(tr.mapping.map(columnListPos));
        tr.setSelection(TextSelection.near($target, 1));
        return true;
      }

      // Replace columnList with content from remaining column
      const columnListEndPos = columnListPos + columnList.nodeSize;
      tr.replaceWith(columnListPos, columnListEndPos, content);

      // Calculate cursor position at end of inserted content
      let endPos = columnListPos;
      content.forEach((node) => {
        endPos += node.nodeSize;
      });

      const $end = tr.doc.resolve(endPos - 1);
      tr.setSelection(TextSelection.near($end, -1));

      return true;
    }

    // For more than 2 columns, delete the empty column
    const columnEndPos = columnPos + column.nodeSize;
    tr.delete(columnPos, columnEndPos);

    // Move cursor to appropriate position
    if (currentColumnIndex === 0) {
      // Deleted first column: move to start of new first column
      const newFirstColumnPos = tr.mapping.map(columnPos);
      const $target = tr.doc.resolve(newFirstColumnPos + 1);
      tr.setSelection(TextSelection.near($target, 1));
    } else {
      // Deleted non-first column: move to end of previous column
      const prevColumnEndPos = tr.mapping.map(columnPos - 1);
      const $target = tr.doc.resolve(prevColumnEndPos);
      tr.setSelection(TextSelection.near($target, -1));
    }

    return true;
  });
}
