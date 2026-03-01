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

import type { Style } from "@react-pdf/types";
import {
  BACKGROUND_COLORS,
  CODE_COLORS,
  EDITOR_BACKGROUND_COLORS,
  EDITOR_TEXT_COLORS,
  LINK_COLORS,
  resolveColorForPdf,
} from "./colors";
import type { MarkRendererRegistry, TipTapMark } from "./types";

export const markRenderers: MarkRendererRegistry = {
  bold: (_mark: TipTapMark, style: Style): Style => ({
    ...style,
    fontWeight: "bold",
  }),

  italic: (_mark: TipTapMark, style: Style): Style => ({
    ...style,
    fontStyle: "italic",
  }),

  underline: (_mark: TipTapMark, style: Style): Style => ({
    ...style,
    textDecoration: "underline",
  }),

  strike: (_mark: TipTapMark, style: Style): Style => ({
    ...style,
    textDecoration: "line-through",
  }),

  code: (_mark: TipTapMark, style: Style): Style => ({
    ...style,
    fontFamily: "Courier",
    fontSize: 10,
    backgroundColor: BACKGROUND_COLORS.layer1,
    color: CODE_COLORS.text,
  }),

  link: (_mark: TipTapMark, style: Style): Style => ({
    ...style,
    color: LINK_COLORS.primary,
    textDecoration: "underline",
  }),

  textStyle: (mark: TipTapMark, style: Style): Style => {
    const attrs = mark.attrs || {};
    const newStyle: Style = { ...style };

    if (attrs.color && typeof attrs.color === "string") {
      newStyle.color = attrs.color;
    }

    if (attrs.backgroundColor && typeof attrs.backgroundColor === "string") {
      newStyle.backgroundColor = attrs.backgroundColor;
    }

    return newStyle;
  },

  highlight: (mark: TipTapMark, style: Style): Style => {
    const attrs = mark.attrs || {};
    return {
      ...style,
      backgroundColor: (attrs.color as string) || EDITOR_BACKGROUND_COLORS.purple,
    };
  },

  subscript: (_mark: TipTapMark, style: Style): Style => ({
    ...style,
    fontSize: 8,
  }),

  superscript: (_mark: TipTapMark, style: Style): Style => ({
    ...style,
    fontSize: 8,
  }),

  /**
   * Custom color mark handler
   * Handles the customColor extension which stores colors as data-text-color and data-background-color attributes
   * The colors can be either:
   * 1. Color keys like "gray", "peach", "pink", etc. (from COLORS_LIST)
   * 2. Direct hex values for custom colors
   * 3. CSS variable references like "var(--editor-colors-gray-text)"
   */
  customColor: (mark: TipTapMark, style: Style): Style => {
    const attrs = mark.attrs || {};
    const newStyle: Style = { ...style };

    // Handle text color (stored in 'color' attribute)
    const textColor = attrs.color as string | undefined;
    if (textColor) {
      const resolvedColor = resolveColorForPdf(textColor, "text");
      if (resolvedColor) {
        newStyle.color = resolvedColor;
      } else if (textColor.startsWith("#") || textColor.startsWith("rgb")) {
        // Direct color value
        newStyle.color = textColor;
      } else if (textColor in EDITOR_TEXT_COLORS) {
        // Color key lookup
        newStyle.color = EDITOR_TEXT_COLORS[textColor as keyof typeof EDITOR_TEXT_COLORS];
      }
    }

    // Handle background color (stored in 'backgroundColor' attribute)
    const backgroundColor = attrs.backgroundColor as string | undefined;
    if (backgroundColor) {
      const resolvedColor = resolveColorForPdf(backgroundColor, "background");
      if (resolvedColor) {
        newStyle.backgroundColor = resolvedColor;
      } else if (backgroundColor.startsWith("#") || backgroundColor.startsWith("rgb")) {
        // Direct color value
        newStyle.backgroundColor = backgroundColor;
      } else if (backgroundColor in EDITOR_BACKGROUND_COLORS) {
        // Color key lookup
        newStyle.backgroundColor = EDITOR_BACKGROUND_COLORS[backgroundColor as keyof typeof EDITOR_BACKGROUND_COLORS];
      }
    }

    return newStyle;
  },
};

export const applyMarks = (marks: TipTapMark[] | undefined, baseStyle: Style = {}): Style => {
  if (!marks || marks.length === 0) {
    return baseStyle;
  }

  return marks.reduce((style, mark) => {
    const renderer = markRenderers[mark.type];
    if (renderer) {
      return renderer(mark, style);
    }
    return style;
  }, baseStyle);
};
