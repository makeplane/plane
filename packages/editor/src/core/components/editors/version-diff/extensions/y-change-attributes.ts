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

import { Extension } from "@tiptap/core";
import { BLOCK_NODE_TYPES } from "@/constants/extension";
import { ADDITIONAL_BLOCK_NODE_TYPES } from "@/plane-editor/constants/extensions";

const ALL_BLOCK_TYPES = [...BLOCK_NODE_TYPES, ...ADDITIONAL_BLOCK_NODE_TYPES];

export type YChange = {
  user: string | null;
  type: "removed" | "added" | null;
  color: {
    solid: string;
    lightBg: string;
    darkBg: string;
    light: string;
    dark: string;
  };
};

/**
 * Build CSS variable string for per-user colors.
 * CSS uses these variables with fallback to default colors.
 */
const buildYChangeStyle = (ychange: YChange): string => {
  const parts: string[] = [];

  // Per-user colors via CSS variables (CSS handles fallbacks)
  if (ychange.color?.lightBg) {
    parts.push(`--ychange-color-light: ${ychange.color.lightBg}`);
  }
  if (ychange.color?.darkBg) {
    parts.push(`--ychange-color-dark: ${ychange.color.darkBg}`);
  }

  // Solid color for hatching pattern and borders
  if (ychange.color?.solid) {
    parts.push(`--ychange-color-solid: ${ychange.color.solid}`);
  }

  return parts.join("; ");
};

/**
 * Convert ychange attributes to DOM attributes for renderHTML.
 * Uses unified data-ychange-type attribute for CSS targeting.
 */
const calcYchangeDomAttrs = (
  attrs: { ychange?: YChange | null },
  domAttrs: Record<string, string> = {}
): Record<string, string> => {
  domAttrs = Object.assign({}, domAttrs);

  if (attrs.ychange !== null && attrs.ychange !== undefined && attrs.ychange.type) {
    // Primary attribute for CSS styling (unified selector)
    domAttrs["data-ychange-type"] = attrs.ychange.type;

    // User info for tooltip
    domAttrs["data-ychange-user"] = attrs.ychange.user || "";

    // CSS variables for per-user colors
    const style = buildYChangeStyle(attrs.ychange);
    if (style) {
      domAttrs.style = style;
    }
  }

  return domAttrs;
};

type Options = {
  /**
   * Node type names that should receive ychange attribute via GlobalAttributes.
   * Only for nodes using renderHTML (not NodeViews).
   */
  types: string[];
};

/**
 * Extension that adds ychange GlobalAttributes to block nodes.
 *
 * This extension targets nodes that use renderHTML (paragraphs, headings,
 * blockquotes, lists, etc.). NodeView-based nodes (tables, images, callouts,
 * code blocks, embeds) are handled by YChangeDecorations instead.
 *
 * Output DOM attributes:
 * - data-ychange-type="added|removed" - for CSS styling
 * - data-ychange-user="..." - for tooltip
 * - style with --ychange-color-light/dark CSS variables
 */
export const YChangeGlobalAttributes = Extension.create<Options>({
  name: "ychangeGlobalAttributes",

  addOptions() {
    return {
      types: ALL_BLOCK_TYPES,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          ychange: {
            default: null,
            parseHTML: () => null, // ychange is managed by y-prosemirror
            renderHTML: (attributes: any) => calcYchangeDomAttrs(attributes),
          },
        },
      },
    ];
  },
});
