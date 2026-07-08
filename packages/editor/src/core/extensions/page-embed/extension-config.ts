/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Node, mergeAttributes } from "@tiptap/core";
import type { MarkdownSerializerState } from "@tiptap/pm/markdown";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local imports
import { EPageEmbedAttributeNames, PAGE_EMBED_BLOCK_TYPE } from "./types";
import type { TPageEmbedAttributes } from "./types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.PAGE_EMBED]: {
      setPageEmbed: (attributes: { pageId: string; pageTitle: string }) => ReturnType;
    };
  }
}

export const PageEmbedExtensionConfig = Node.create({
  name: CORE_EXTENSIONS.PAGE_EMBED,
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      [EPageEmbedAttributeNames.BLOCK_TYPE]: {
        default: PAGE_EMBED_BLOCK_TYPE,
      },
      [EPageEmbedAttributeNames.PAGE_ID]: {
        default: null,
      },
      [EPageEmbedAttributeNames.PAGE_TITLE]: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `div[${EPageEmbedAttributeNames.BLOCK_TYPE}="${PAGE_EMBED_BLOCK_TYPE}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        [EPageEmbedAttributeNames.BLOCK_TYPE]: PAGE_EMBED_BLOCK_TYPE,
      }),
    ];
  },

  addCommands() {
    return {
      setPageEmbed:
        (attributes) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              [EPageEmbedAttributeNames.PAGE_ID]: attributes.pageId,
              [EPageEmbedAttributeNames.PAGE_TITLE]: attributes.pageTitle,
            },
          }),
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
          const attrs = node.attrs as TPageEmbedAttributes;
          const title = attrs[EPageEmbedAttributeNames.PAGE_TITLE] || "Untitled";
          state.write(`[${title}]`);
          state.closeBlock(node);
        },
      },
    };
  },
});
