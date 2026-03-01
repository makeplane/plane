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

import { Plugin, PluginKey, Selection } from "@tiptap/pm/state";
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";
import { CORE_EXTENSIONS } from "@/constants/extension";

export const ColumnClickHandler = () => {
  return new Plugin({
    key: new PluginKey("column-click-handler"),
    props: {
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement;
        if (!target) return false;

        // Check if the clicked element is the column container itself
        // This is crucial to ensure we don't intercept clicks on paragraphs/content
        if (!target.classList.contains("editor-column")) {
          return false;
        }

        const { doc, tr, schema } = view.state;
        const $pos = doc.resolve(pos);

        // Expect the parent to be the column
        if ($pos.parent.type.name !== ADDITIONAL_EXTENSIONS.COLUMN) {
          return false;
        }

        const columnNode = $pos.parent;
        // $pos.end() gives us the position at the end of the node's content
        // This is always the correct place to append new content or find the last child
        const endPos = $pos.end();

        const lastChild = columnNode.lastChild;

        // Condition 1: If the last child is already a paragraph, just focus it
        if (lastChild && lastChild.type.name === CORE_EXTENSIONS.PARAGRAPH) {
          // Focus at the end of the existing paragraph.
          // endPos is the boundary after the last child.
          // Using -1 bias searches backwards into the paragraph content.
          const selection = Selection.near(doc.resolve(endPos), -1);
          tr.setSelection(selection);
          view.dispatch(tr.scrollIntoView());
          return true;
        }

        // Condition 2: Last child is not a paragraph (or column is empty), create one
        // We append the new paragraph at the end of the column
        const node = schema.nodes[CORE_EXTENSIONS.PARAGRAPH].create();
        tr.insert(endPos, node);

        // Focus the new paragraph
        // The new node is inserted at endPos.
        // Its content starts at endPos + 1.
        const selection = Selection.near(tr.doc.resolve(endPos + 1));
        tr.setSelection(selection);
        view.dispatch(tr.scrollIntoView());
        return true;
      },
    },
  });
};
