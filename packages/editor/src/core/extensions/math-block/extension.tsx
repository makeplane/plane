/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { nodeInputRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// plane utils
import { MATH_BLOCK_DELIMITER } from "@plane/utils";
// types
import { EMathBlockAttributeNames } from "./types";
import { MathBlockExtensionConfig } from "./extension-config";
// components
import { MathBlockNodeView } from "./node-view";

export const MathBlockExtension = MathBlockExtensionConfig.extend({
  addCommands() {
    return {
      insertMathBlock:
        (attributes) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              [EMathBlockAttributeNames.LATEX]: "",
              ...attributes,
            },
          }),
    };
  },

  addInputRules() {
    return [
      // typing `$$ ` at the start of a block creates an empty math block
      nodeInputRule({
        find: /^\$\$\s$/,
        type: this.type,
        getAttributes: () => ({
          [EMathBlockAttributeNames.LATEX]: "",
        }),
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      // pressing Enter right after typing `$$` at the start of a block converts it to a math block
      Enter: ({ editor }) => {
        try {
          const { $from, empty } = editor.state.selection;
          if (!empty || $from.parent.type.name !== CORE_EXTENSIONS.PARAGRAPH) return false;
          if ($from.parent.textContent.trim() !== MATH_BLOCK_DELIMITER) return false;

          const nodePos = $from.before();
          return editor
            .chain()
            .focus()
            .deleteRange({ from: nodePos, to: nodePos + $from.parent.nodeSize })
            .insertMathBlock()
            .run();
        } catch (error) {
          console.error("Error converting paragraph to math block:", error);
          return false;
        }
      },
      ArrowDown: insertEmptyParagraphAtNodeBoundaries("down", this.name),
      ArrowUp: insertEmptyParagraphAtNodeBoundaries("up", this.name),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockNodeView, {
      // ProseMirror turns a click on a selectable node into a node selection
      // (and, for this draggable block, a drag gesture on slight pointer
      // movement), which interferes with click-to-edit; the node view handles
      // its own events, only drag & drop stay with ProseMirror
      stopEvent: ({ event }) => !event.type.startsWith("drag") && event.type !== "drop",
    });
  },
});
