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

import type { Node, Schema } from "@tiptap/pm/model";
import type { EditorState, Transaction } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";
// types
import { EColumnAttributeNames, EColumnListAttributeNames } from "./types";

/**
 * Find the source node position in the document if it's a move operation
 * @returns Source position and size, or null if not found or not a move
 */
export function findSourceNodePosition(
  state: EditorState,
  draggedNode: Node,
  isMove: boolean
): { pos: number; size: number } | null {
  if (!isMove || !(draggedNode.attrs[EColumnAttributeNames.ID] || draggedNode.attrs[EColumnListAttributeNames.ID]))
    return null;

  let result: { pos: number; size: number } | null = null;
  const draggedNodeId = draggedNode.attrs[EColumnAttributeNames.ID] as string;
  state.doc.descendants((node: Node, pos: number) => {
    const nodeId = node.attrs[EColumnAttributeNames.ID] as string;
    if (nodeId === draggedNodeId) {
      result = { pos, size: node.nodeSize };
      return false; // Stop iteration
    }
  });

  return result;
}

/**
 * Unwrap column content into an array of nodes
 * Handles both individual columns and columnLists
 */
export function unwrapColumnContent(node: Node): Node[] {
  if (node.type.name === ADDITIONAL_EXTENSIONS.COLUMN) {
    const nodes: Node[] = [];
    node.content.forEach((child) => nodes.push(child));
    return nodes;
  }

  if (node.type.name === ADDITIONAL_EXTENSIONS.COLUMN_LIST) {
    const nodes: Node[] = [];
    node.forEach((column) => {
      column.content.forEach((child) => nodes.push(child));
    });
    return nodes;
  }

  return [node];
}

/**
 * Create a columnList from two blocks
 */
function createColumnListFromBlocks(
  schema: Schema,
  draggedNode: Node,
  targetNode: Node,
  position: "left" | "right"
): Node {
  const columnType = schema.nodes[ADDITIONAL_EXTENSIONS.COLUMN];
  const columnListType = schema.nodes[ADDITIONAL_EXTENSIONS.COLUMN_LIST];

  const [leftNode, rightNode] = position === "left" ? [draggedNode, targetNode] : [targetNode, draggedNode];

  const leftColumn = columnType.create(
    { [EColumnAttributeNames.WIDTH]: 1, [EColumnAttributeNames.ID]: null },
    unwrapColumnContent(leftNode)
  );
  const rightColumn = columnType.create(
    { [EColumnAttributeNames.WIDTH]: 1, [EColumnAttributeNames.ID]: null },
    unwrapColumnContent(rightNode)
  );

  return columnListType.create({ [EColumnListAttributeNames.ID]: null }, [leftColumn, rightColumn]);
}

/**
 * Remove source node from a column if it exists within that column
 */
function removeSourceFromColumn(
  schema: Schema,
  column: Node,
  sourceInfo: { pos: number; size: number },
  columnStart: number
): Node {
  const newContent: Node[] = [];
  let childPos = columnStart;

  column.content.forEach((child) => {
    const isSourceNode = sourceInfo.pos >= childPos && sourceInfo.pos < childPos + child.nodeSize;
    if (!isSourceNode) {
      newContent.push(child);
    }
    childPos += child.nodeSize;
  });

  // Ensure column has at least an empty paragraph
  if (newContent.length === 0) {
    newContent.push(schema.nodes[CORE_EXTENSIONS.PARAGRAPH].create());
  }

  return schema.nodes[ADDITIONAL_EXTENSIONS.COLUMN].create(column.attrs, newContent);
}

/**
 * Add a new column to an existing columnList
 */
function addColumnToList(
  schema: Schema,
  columnList: Node,
  draggedNode: Node,
  targetColumnIndex: number,
  position: "left" | "right",
  draggedNodeId?: string,
  sourceInfo?: { pos: number; size: number } | null,
  columnListPos?: number
): Node {
  const columnType = schema.nodes[ADDITIONAL_EXTENSIONS.COLUMN];
  const columnListType = schema.nodes[ADDITIONAL_EXTENSIONS.COLUMN_LIST];
  const columns: Node[] = [];
  let currentOffset = 1;

  columnList.forEach((column) => {
    // Skip if this is the source column being moved
    if (draggedNodeId && column.attrs[EColumnAttributeNames.ID] === draggedNodeId) {
      currentOffset += column.nodeSize;
      return;
    }

    // Remove source from column if it exists within
    if (sourceInfo && columnListPos !== undefined) {
      const columnStart = columnListPos + currentOffset + 1;
      const columnEnd = columnListPos + currentOffset + column.nodeSize - 1;
      if (sourceInfo.pos >= columnStart && sourceInfo.pos < columnEnd) {
        columns.push(removeSourceFromColumn(schema, column, sourceInfo, columnStart));
        currentOffset += column.nodeSize;
        return;
      }
    }

    // Unwrap nested columnLists
    const hasNestedColumnList = column.content.firstChild?.type.name === ADDITIONAL_EXTENSIONS.COLUMN_LIST;
    columns.push(hasNestedColumnList ? columnType.create(column.attrs, unwrapColumnContent(column)) : column);

    currentOffset += column.nodeSize;
  });

  // Create and insert new column
  const newColumn = columnType.create(
    { [EColumnAttributeNames.WIDTH]: 1, [EColumnAttributeNames.ID]: null },
    unwrapColumnContent(draggedNode)
  );
  const insertIndex = position === "left" ? targetColumnIndex : targetColumnIndex + 1;
  columns.splice(Math.max(0, Math.min(insertIndex, columns.length)), 0, newColumn);

  return columns.length < 2 ? columnList : columnListType.create(columnList.attrs, columns);
}

/**
 * Apply transaction to replace target with new columnList
 * Handles source node deletion if it's a move operation
 */
function applyColumnTransaction(
  tr: Transaction,
  sourceInfo: { pos: number; size: number } | null,
  targetPos: number,
  targetSize: number,
  newColumnList: Node
): void {
  // Simple replacement if no source to remove (copy operation)
  if (!sourceInfo) {
    tr.replaceWith(targetPos, targetPos + targetSize, newColumnList);
    return;
  }

  const { pos: sourcePos, size: sourceSize } = sourceInfo;

  // No-op if source and target are the same
  if (sourcePos === targetPos) return;

  if (sourcePos < targetPos) {
    tr.delete(sourcePos, sourcePos + sourceSize);
    const mappedTargetPos = tr.mapping.map(targetPos);
    tr.replaceWith(mappedTargetPos, mappedTargetPos + targetSize, newColumnList);
  } else {
    tr.replaceWith(targetPos, targetPos + targetSize, newColumnList);
    const mappedSourcePos = tr.mapping.map(sourcePos);
    tr.delete(mappedSourcePos, mappedSourcePos + sourceSize);
  }
}

/**
 * Check if two nodes can be used to create a column structure
 */
export function canCreateColumns(node1: Node | null | undefined, node2: Node | null | undefined): boolean {
  if (!node1 || !node2) return false;

  // Can't create columns from the same node
  const node1Id = node1.attrs?.[EColumnAttributeNames.ID] || node1.attrs?.[EColumnListAttributeNames.ID];
  const node2Id = node2.attrs?.[EColumnAttributeNames.ID] || node2.attrs?.[EColumnListAttributeNames.ID];
  if (node1Id && node1Id === node2Id) return false;

  // Can't nest columns or columnLists inside new columns
  if (
    [ADDITIONAL_EXTENSIONS.COLUMN, ADDITIONAL_EXTENSIONS.COLUMN_LIST].includes(node1.type.name as ADDITIONAL_EXTENSIONS)
  )
    return false;
  if (node2.type.name === ADDITIONAL_EXTENSIONS.COLUMN_LIST) return false;

  return true;
}

/**
 * Handle dropping a node to create or modify column structures
 * @param isFlagged - Whether multi-column is flagged (prevents column creation/manipulation)
 * @param sourceInfoOverride - Optional override for source node position (used for list items)
 * @returns true if the drop was handled, false otherwise
 */
export function handleColumnDrop(
  view: EditorView,
  draggedNode: Node,
  targetNode: Node,
  targetPos: number,
  position: "left" | "right",
  isMove: boolean,
  isFlagged: boolean,
  sourceInfoOverride?: { pos: number; size: number } | null
): boolean {
  // Prevent column creation/manipulation when flagged
  if (isFlagged) return false;

  const { state } = view;
  const { schema, tr } = state;

  try {
    const sourceInfo = sourceInfoOverride ?? findSourceNodePosition(state, draggedNode, isMove);
    const $targetPos = state.doc.resolve(targetPos);

    // Handle dropping on existing column/columnList
    const isTargetColumn = targetNode.type.name === ADDITIONAL_EXTENSIONS.COLUMN;
    const isTargetColumnList = targetNode.type.name === ADDITIONAL_EXTENSIONS.COLUMN_LIST;

    if (isTargetColumn || isTargetColumnList) {
      const columnListPos = isTargetColumn ? $targetPos.before() : targetPos;
      const columnList = isTargetColumn ? $targetPos.node() : targetNode;

      // Find target column index
      let targetColumnIndex = 0;
      if (isTargetColumn) {
        columnList.forEach((_node, offset, index) => {
          if (offset === targetPos - columnListPos - 1) {
            targetColumnIndex = index;
          }
        });
      } else {
        // Count columns to determine insertion point (columnList can only have columns as children)
        targetColumnIndex = position === "left" ? 0 : columnList.childCount;
      }

      const sourceInsideList =
        sourceInfo && sourceInfo.pos >= columnListPos && sourceInfo.pos < columnListPos + columnList.nodeSize;

      const draggedNodeId = isMove
        ? draggedNode.attrs[EColumnAttributeNames.ID] || (draggedNode.attrs[EColumnListAttributeNames.ID] as string)
        : undefined;
      const newColumnList = addColumnToList(
        schema,
        columnList,
        draggedNode,
        targetColumnIndex,
        position,
        draggedNodeId,
        sourceInsideList ? sourceInfo : null,
        sourceInsideList ? columnListPos : undefined
      );

      // Apply transaction
      if (sourceInsideList) {
        tr.replaceWith(columnListPos, columnListPos + columnList.nodeSize, newColumnList);
      } else {
        applyColumnTransaction(tr, sourceInfo, columnListPos, columnList.nodeSize, newColumnList);
      }

      tr.setMeta("addToHistory", true);
      view.dispatch(tr);
      return true;
    }

    // Create new columnList from two blocks
    if (!canCreateColumns(draggedNode, targetNode)) return false;

    const newColumnList = createColumnListFromBlocks(schema, draggedNode, targetNode, position);
    applyColumnTransaction(tr, sourceInfo, targetPos, targetNode.nodeSize, newColumnList);

    tr.setMeta("addToHistory", true);
    view.dispatch(tr);
    return true;
  } catch (error) {
    console.error("[Column Drop] Error:", error);
    return false;
  }
}
