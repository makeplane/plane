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

import { mergeAttributes, Node } from "@tiptap/core";
// constants
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
import type { TPiEmbedBlockAttributes } from "./types";
import { EPiEmbedBlockAttributeNames, EPiEmbedBlockNodeType, EPiEmbedTag } from "./types";
import { DEFAULT_PI_EMBED_BLOCK_ATTRIBUTES } from "./utils";

/**
 * Extension for pi-utility-embed elements from the API (e.g. charts, analytics).
 * Parses and renders the element as-is, preserving all data attributes.
 */
export const PiUtilityEmbedExtensionConfig = Node.create({
  name: ADDITIONAL_EXTENSIONS.PI_UTILITY_EMBED,
  group: "block",
  atom: true,
  selectable: true,

  addAttributes() {
    const attributes = {
      ...Object.values(EPiEmbedBlockAttributeNames).reduce(
        (acc, value) => {
          acc[value] = {
            default: DEFAULT_PI_EMBED_BLOCK_ATTRIBUTES[value],
          };
          return acc;
        },
        {} as Record<EPiEmbedBlockAttributeNames, { default: TPiEmbedBlockAttributes[EPiEmbedBlockAttributeNames] }>
      ),
    };
    return attributes;
  },

  parseHTML() {
    return [{ tag: `div[${EPiEmbedTag.NODE_TYPE}="${EPiEmbedBlockNodeType.PI_UTILITY_EMBED}"]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes)];
  },
});
