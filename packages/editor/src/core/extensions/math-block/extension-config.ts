/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Node, mergeAttributes } from "@tiptap/core";
import type MarkdownIt from "markdown-it";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { MarkdownSerializerState } from "@tiptap/pm/markdown";
// plane utils
import { serializeMathBlockToMarkdown } from "@plane/utils";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import { EMathBlockAttributeNames } from "./types";
import type { TMathBlockAttributes, TMathBlockExtensionOptions, TMathBlockExtensionStorage } from "./types";
// utils
import { MATH_BLOCK_TAG_NAME, mathBlockMarkdownPlugin } from "./utils";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.MATH_BLOCK]: {
      /**
       * Insert a math block
       */
      insertMathBlock: (attributes?: Partial<TMathBlockAttributes>) => ReturnType;
    };
  }
}

export const MathBlockExtensionConfig = Node.create<TMathBlockExtensionOptions, TMathBlockExtensionStorage>({
  name: CORE_EXTENSIONS.MATH_BLOCK,
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      [EMathBlockAttributeNames.ID]: {
        default: null,
      },
      [EMathBlockAttributeNames.LATEX]: {
        default: "",
      },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
          const attrs = node.attrs as TMathBlockAttributes;
          const latex = attrs[EMathBlockAttributeNames.LATEX];
          if (!latex) return;
          state.write(serializeMathBlockToMarkdown(latex));
          state.closeBlock(node);
        },
        parse: {
          setup(md: MarkdownIt) {
            mathBlockMarkdownPlugin(md);
          },
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: MATH_BLOCK_TAG_NAME,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [MATH_BLOCK_TAG_NAME, mergeAttributes(HTMLAttributes)];
  },

  renderText({ node }) {
    const attrs = node.attrs as TMathBlockAttributes;
    const latex = attrs[EMathBlockAttributeNames.LATEX];
    if (!latex) return "";
    return serializeMathBlockToMarkdown(latex);
  },
});
