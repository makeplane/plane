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
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorState, Transaction } from "@tiptap/pm/state";
// constants
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";

export type ColumnInfo = {
  node: ProseMirrorNode;
  pos: number;
  index: number;
  left: number;
  width: number;
};

/**
 * Find the columnList node containing the given position
 * @returns ColumnList node info or null if not found
 */
export function findColumnList(
  state: EditorState,
  pos: number
): { node: ProseMirrorNode; pos: number; depth: number } | null {
  if (pos < 0 || pos > state.doc.content.size) return null;

  const $pos = state.doc.resolve(pos);

  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    if (node.type.name === ADDITIONAL_EXTENSIONS.COLUMN_LIST) {
      return {
        node,
        pos: $pos.before(depth),
        depth,
      };
    }
  }

  return null;
}

/**
 * Find the column node at or containing the given position
 * @returns Column node info or null if not found
 */
export function findColumnAtPos(
  state: EditorState,
  pos: number
): { node: ProseMirrorNode; pos: number; depth: number } | null {
  if (pos < 0 || pos > state.doc.content.size) return null;

  const $pos = state.doc.resolve(pos);

  // Check if node at position is a column
  const nodeAtPos = state.doc.nodeAt(pos);
  if (nodeAtPos && nodeAtPos.type.name === ADDITIONAL_EXTENSIONS.COLUMN) {
    return {
      node: nodeAtPos,
      pos,
      depth: $pos.depth,
    };
  }

  // Search ancestors for column
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    if (node.type.name === ADDITIONAL_EXTENSIONS.COLUMN) {
      return {
        node,
        pos: $pos.before(depth),
        depth,
      };
    }
  }

  return null;
}

/**
 * Get column information for all columns in a columnList
 * Includes position, dimensions, and index information
 */
export function getColumnListColumns(columnList: { node: ProseMirrorNode; pos: number }, editor: Editor): ColumnInfo[] {
  const columns: ColumnInfo[] = [];
  let currentPos = columnList.pos + 1;
  let leftPx = 0;

  columnList.node.forEach((child, _offset, idx) => {
    const nodeDOM = editor.view.nodeDOM(currentPos);

    if (nodeDOM instanceof HTMLElement) {
      const rect = nodeDOM.getBoundingClientRect();
      const columnListDOM = editor.view.nodeDOM(columnList.pos) as HTMLElement;
      const gap = columnListDOM ? parseFloat(getComputedStyle(columnListDOM).gap || "0") : 0;

      columns.push({
        node: child,
        pos: currentPos,
        index: idx,
        left: leftPx,
        width: rect.width,
      });

      leftPx += rect.width + gap;
    }
    currentPos += child.nodeSize;
  });

  return columns;
}

/**
 * Move a column from one index to another within a columnList
 * Properly reorders (not swaps) the columns array
 * @returns Modified transaction
 */
export function moveColumn(
  tr: Transaction,
  columnListPos: number,
  fromIndex: number,
  toIndex: number,
  state: EditorState
): Transaction {
  // Validate inputs
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
    return tr;
  }

  const columnList = state.doc.nodeAt(columnListPos);

  if (!columnList || columnList.type.name !== ADDITIONAL_EXTENSIONS.COLUMN_LIST) {
    return tr;
  }

  // Extract column nodes (columnList can only have columns as children)
  const columns: ProseMirrorNode[] = [];
  columnList.forEach((child) => columns.push(child));

  // Validate indices
  if (fromIndex >= columns.length || toIndex >= columns.length) {
    return tr;
  }

  // Move column from fromIndex to toIndex (reorder, not swap)
  const [movedColumn] = columns.splice(fromIndex, 1);
  columns.splice(toIndex, 0, movedColumn);

  // Create new columnList with reordered columns
  const newColumnList = columnList.type.create(columnList.attrs, columns, columnList.marks);
  tr.replaceWith(columnListPos, columnListPos + columnList.nodeSize, newColumnList);

  return tr;
}

/**
 * Calculate the target drop index when dragging a column
 * Uses overlap detection to determine where the column should be placed
 * @returns Target column index for drop
 */
export function calculateColumnDropIndex(currentIndex: number, columns: ColumnInfo[], left: number): number {
  // Validate inputs
  if (columns.length === 0 || currentIndex < 0 || currentIndex >= columns.length) {
    return 0;
  }

  const currentColumn = columns[currentIndex];
  const draggedColumnLeft = left;
  const draggedColumnRight = draggedColumnLeft + currentColumn.width;
  const draggedColumnCenter = draggedColumnLeft + currentColumn.width / 2;

  const currentColumnLeft = currentColumn.left;
  const currentColumnRight = currentColumnLeft + currentColumn.width;

  // Prevent dragging beyond boundaries
  const isFirstColumn = currentIndex === 0;
  const isLastColumn = currentIndex === columns.length - 1;
  const isDraggingLeft = draggedColumnLeft < currentColumnLeft;
  const isDraggingRight = draggedColumnRight > currentColumnRight;

  if ((isFirstColumn && isDraggingLeft) || (isLastColumn && isDraggingRight)) {
    return currentIndex;
  }

  // Boundary checks
  const firstColumn = columns[0];
  if (isDraggingLeft && draggedColumnLeft <= firstColumn.left) {
    return 0;
  }

  const lastColumn = columns[columns.length - 1];
  if (isDraggingRight && draggedColumnRight >= lastColumn.left + lastColumn.width) {
    return columns.length - 1;
  }

  // Find best match using overlap detection
  let bestMatch = currentIndex;
  let maxOverlap = 0;

  for (let i = 0; i < columns.length; i++) {
    if (i === currentIndex) continue;

    const targetColumn = columns[i];
    const targetColumnLeft = targetColumn.left;
    const targetColumnRight = targetColumnLeft + targetColumn.width;

    // Calculate overlap
    const overlapLeft = Math.max(draggedColumnLeft, targetColumnLeft);
    const overlapRight = Math.min(draggedColumnRight, targetColumnRight);
    const overlap = Math.max(0, overlapRight - overlapLeft);

    // Check if center is within target column (more reliable than overlap)
    const isWithinColumn = draggedColumnCenter >= targetColumnLeft && draggedColumnCenter <= targetColumnRight;

    if (overlap > maxOverlap || isWithinColumn) {
      maxOverlap = overlap;
      bestMatch = i;
    }
  }

  return bestMatch;
}
