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

import { mergeAttributes, Mark } from "@tiptap/core";

type YChange = {
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
 * Build inline style for ychange marks.
 * CSS variables for per-user colors - CSS handles actual styling based on ychange_type.
 */
const buildYChangeStyle = (ychange: YChange): string => {
  const parts: string[] = [];

  // Per-user background colors via CSS variables
  if (ychange.color?.lightBg) {
    parts.push(`--ychange-color-light: ${ychange.color.lightBg}`);
  }
  if (ychange.color?.darkBg) {
    parts.push(`--ychange-color-dark: ${ychange.color.darkBg}`);
  }

  // Solid color for strikethrough (CSS uses this for text-decoration-color on removed marks)
  if (ychange.color?.solid) {
    parts.push(`--ychange-color-solid: ${ychange.color.solid}`);
  }

  return parts.join("; ");
};

/**
 * Mark extension for inline text changes in version diff.
 *
 * y-prosemirror creates <ychange> elements via attributesToMarks() when
 * snapshot diffing is active. This extension defines the schema mark.
 *
 * Output DOM attributes:
 * - ychange_type="added|removed" - for CSS styling (required by y-prosemirror)
 * - data-ychange-user="..." - for tooltip
 * - style with --ychange-color-light/dark CSS variables
 */
export const YChangeMark = Mark.create({
  name: "ychange",

  addAttributes() {
    return {
      user: {
        default: null,
      },
      type: {
        default: null,
      },
      color: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "ychange",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as unknown as YChange;

    const domAttrs: Record<string, string> = {
      // y-prosemirror expects ychange_type attribute (underscored)
      ychange_type: attrs.type || "",
      // User info for tooltip
      "data-ychange-user": attrs.user || "",
    };

    // Build style with CSS variables for per-user colors
    const style = buildYChangeStyle(attrs);
    if (style) {
      domAttrs.style = style;
    }

    return ["ychange", mergeAttributes(domAttrs), 0];
  },

  inclusive: false,
});
