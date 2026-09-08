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
import { serializeMathInlineToMarkdown } from "@plane/utils";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import { EMathInlineAttributeNames } from "./types";
import type { TMathInlineAttributes, TMathInlineExtensionOptions, TMathInlineExtensionStorage } from "./types";
// utils
import { MATH_INLINE_TAG_NAME, mathInlineMarkdownPlugin } from "./utils";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.MATH_INLINE]: {
      /**
       * Insert an inline math node
       */
      insertMathInline: (attributes?: Partial<TMathInlineAttributes>) => ReturnType;
    };
  }
}

export const MathInlineExtensionConfig = Node.create<TMathInlineExtensionOptions, TMathInlineExtensionStorage>({
  name: CORE_EXTENSIONS.MATH_INLINE,
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      [EMathInlineAttributeNames.ID]: {
        default: null,
      },
      [EMathInlineAttributeNames.LATEX]: {
        default: "",
      },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
          const attrs = node.attrs as TMathInlineAttributes;
          const latex = attrs[EMathInlineAttributeNames.LATEX];
          if (!latex) return;
          state.write(serializeMathInlineToMarkdown(latex));
        },
        parse: {
          setup(md: MarkdownIt) {
            mathInlineMarkdownPlugin(md);
          },
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: MATH_INLINE_TAG_NAME,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [MATH_INLINE_TAG_NAME, mergeAttributes(HTMLAttributes)];
  },

  renderText({ node }) {
    const attrs = node.attrs as TMathInlineAttributes;
    const latex = attrs[EMathInlineAttributeNames.LATEX];
    if (!latex) return "";
    return serializeMathInlineToMarkdown(latex);
  },
});
