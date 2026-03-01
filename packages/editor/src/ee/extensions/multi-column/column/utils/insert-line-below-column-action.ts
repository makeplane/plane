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

import { ADDITIONAL_EXTENSIONS } from "@plane/utils";
import type { KeyboardShortcutCommand } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";

export const insertLineBelowColumnAction: KeyboardShortcutCommand = ({ editor }) => {
  // Check if the current selection or the closest node is a column
  if (!editor.isActive(ADDITIONAL_EXTENSIONS.COLUMN)) return false;

  try {
    const { selection } = editor.state;
    const $anchor = selection.$anchor;

    // Find column and columnList depths
    let columnDepth = -1;
    let columnListDepth = -1;
    for (let d = $anchor.depth; d > 0; d--) {
      const node = $anchor.node(d);
      if (node.type.name === (ADDITIONAL_EXTENSIONS.COLUMN as string) && columnDepth === -1) {
        columnDepth = d;
      }
      if (node.type.name === (ADDITIONAL_EXTENSIONS.COLUMN_LIST as string) && columnListDepth === -1) {
        columnListDepth = d;
      }
      if (columnDepth !== -1 && columnListDepth !== -1) break;
    }

    if (columnDepth === -1 || columnListDepth === -1) return false;

    const column = $anchor.node(columnDepth);

    // Check if cursor is in the last child block of the column
    const indexInColumn = $anchor.index(columnDepth);
    if (indexInColumn !== column.childCount - 1) return false;

    // Calculate position after the entire columnList
    const columnList = $anchor.node(columnListDepth);
    const columnListPos = $anchor.before(columnListDepth);
    const nextNodePos = columnListPos + columnList.nodeSize;

    // Check for an existing node immediately after the columnList
    const nextNode = editor.state.doc.nodeAt(nextNodePos);

    if (nextNode && nextNode.type.name === CORE_EXTENSIONS.PARAGRAPH) {
      const endOfParagraphPos = nextNodePos + nextNode.nodeSize - 1;
      editor.chain().setTextSelection(endOfParagraphPos).run();
    } else if (!nextNode) {
      editor.chain().insertContentAt(nextNodePos, { type: CORE_EXTENSIONS.PARAGRAPH }).run();
      editor
        .chain()
        .setTextSelection(nextNodePos + 1)
        .run();
    } else {
      return false;
    }

    return true;
  } catch (e) {
    console.error("failed to insert line below column", e);
    return false;
  }
};
