/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { mergeAttributes } from "@tiptap/core";
import type { MentionOptions } from "@tiptap/extension-mention";
import Mention from "@tiptap/extension-mention";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import type { TPageEmbedHandler } from "@/types";
// local types
import { EPageEmbedAttributeNames } from "./types";

export type TPageEmbedExtensionOptions = MentionOptions & {
  widgetCallback: TPageEmbedHandler["widgetCallback"];
};

export const PageEmbedExtensionConfig = Mention.extend<TPageEmbedExtensionOptions>({
  name: CORE_EXTENSIONS.PAGE_EMBED,

  addAttributes() {
    return {
      [EPageEmbedAttributeNames.ID]: {
        default: null,
      },
      [EPageEmbedAttributeNames.ENTITY_IDENTIFIER]: {
        default: null,
      },
      [EPageEmbedAttributeNames.PROJECT_IDENTIFIER]: {
        default: null,
      },
      [EPageEmbedAttributeNames.WORKSPACE_IDENTIFIER]: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "page-embed-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["page-embed-component", mergeAttributes(HTMLAttributes)];
  },

  renderText() {
    return "";
  },

  addStorage() {
    return {
      markdown: {
        serialize() {
          // page embeds are not representable in markdown, drop them
        },
      },
    };
  },
});
