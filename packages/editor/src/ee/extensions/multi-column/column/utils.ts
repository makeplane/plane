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

import type { ResolvedPos, Node as ProseMirrorNode } from "@tiptap/pm/model";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";

/**
 * Find the column node containing the selection
 * @returns Column node info or null if not found
 */
export function findColumnNodeAtSelection($from: ResolvedPos): {
  node: ProseMirrorNode;
  pos: number;
  depth: number;
} | null {
  const columnType = ADDITIONAL_EXTENSIONS.COLUMN as string;

  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === columnType) {
      return {
        node,
        pos: $from.before(depth),
        depth,
      };
    }
  }

  return null;
}

/**
 * Find both column and columnList containing the selection
 * @returns Depth values for column and columnList (-1 if not found)
 */
export function findColumnStructure($from: ResolvedPos): {
  columnDepth: number;
  columnListDepth: number;
} {
  const columnType = ADDITIONAL_EXTENSIONS.COLUMN as string;
  const columnListType = ADDITIONAL_EXTENSIONS.COLUMN_LIST as string;

  let columnDepth = -1;
  let columnListDepth = -1;

  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    const nodeType = node.type.name;

    if (nodeType === columnType && columnDepth === -1) {
      columnDepth = depth;
    }

    if (nodeType === columnListType && columnListDepth === -1) {
      columnListDepth = depth;
    }

    // Early exit if both found
    if (columnDepth !== -1 && columnListDepth !== -1) {
      break;
    }
  }

  return { columnDepth, columnListDepth };
}

/**
 * Check if column contains only an empty paragraph
 */
export function isColumnEmpty(column: ProseMirrorNode): boolean {
  const paragraphType = CORE_EXTENSIONS.PARAGRAPH as string;

  return (
    column.childCount === 1 && column.firstChild?.type.name === paragraphType && column.firstChild.content.size === 0
  );
}

/**
 * Check if cursor is at the start of a column
 */
export function isCursorAtColumnStart($from: ResolvedPos, columnDepth: number): boolean {
  const positionInColumn = $from.pos - $from.start(columnDepth);
  return positionInColumn === 1;
}

/**
 * Get the index of the current column within the columnList
 */
export function getColumnIndex($from: ResolvedPos, columnListDepth: number, columnDepth: number): number {
  const columnList = $from.node(columnListDepth);
  const columnPos = $from.before(columnDepth);
  const columnListStart = $from.start(columnListDepth);

  let currentPos = columnListStart;

  for (let i = 0; i < columnList.childCount; i++) {
    if (currentPos === columnPos) {
      return i;
    }
    currentPos += columnList.child(i).nodeSize;
  }

  return 0;
}
