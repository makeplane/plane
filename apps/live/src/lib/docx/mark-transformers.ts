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

import type { IRunPropertiesOptions } from "docx";
import { ShadingType, UnderlineType } from "docx";
import type { TipTapMark } from "@/lib/export-core";
import { MONO_FONT } from "./styles";
import {
  resolveColorForDocx,
  hexToDocxColor,
  EDITOR_TEXT_COLORS,
  EDITOR_BACKGROUND_COLORS,
} from "@/lib/export-core/colors";

export const docxMarkTransformers: Record<
  string,
  (mark: TipTapMark, state: IRunPropertiesOptions) => IRunPropertiesOptions
> = {
  bold: (_mark: TipTapMark, state: IRunPropertiesOptions): IRunPropertiesOptions => ({
    ...state,
    bold: true,
  }),

  italic: (_mark: TipTapMark, state: IRunPropertiesOptions): IRunPropertiesOptions => ({
    ...state,
    italics: true,
  }),

  underline: (_mark: TipTapMark, state: IRunPropertiesOptions): IRunPropertiesOptions => ({
    ...state,
    underline: { type: UnderlineType.SINGLE },
  }),

  strike: (_mark: TipTapMark, state: IRunPropertiesOptions): IRunPropertiesOptions => ({
    ...state,
    strike: true,
  }),

  code: (_mark: TipTapMark, state: IRunPropertiesOptions): IRunPropertiesOptions => ({
    ...state,
    font: { name: MONO_FONT },
    size: 20,
  }),

  link: (_mark: TipTapMark, state: IRunPropertiesOptions): IRunPropertiesOptions => state,

  textStyle: (mark: TipTapMark, state: IRunPropertiesOptions): IRunPropertiesOptions => {
    const attrs = mark.attrs || {};
    return {
      ...state,
      ...(attrs.color && typeof attrs.color === "string" ? { color: hexToDocxColor(attrs.color) } : {}),
      ...(attrs.backgroundColor && typeof attrs.backgroundColor === "string"
        ? { shading: { type: ShadingType.CLEAR, fill: hexToDocxColor(attrs.backgroundColor) } }
        : {}),
    };
  },

  highlight: (mark: TipTapMark, state: IRunPropertiesOptions): IRunPropertiesOptions => {
    const attrs = mark.attrs || {};
    return {
      ...state,
      shading: {
        type: ShadingType.CLEAR,
        fill: hexToDocxColor((attrs.color as string) || "#e3d8fd"),
      },
    };
  },

  subscript: (_mark: TipTapMark, state: IRunPropertiesOptions): IRunPropertiesOptions => ({
    ...state,
    subScript: true,
  }),

  superscript: (_mark: TipTapMark, state: IRunPropertiesOptions): IRunPropertiesOptions => ({
    ...state,
    superScript: true,
  }),

  customColor: (mark: TipTapMark, state: IRunPropertiesOptions): IRunPropertiesOptions => {
    const attrs = mark.attrs || {};

    const textColor = attrs.color as string | undefined;
    let colorProp: string | undefined;
    if (textColor) {
      const resolvedColor = resolveColorForDocx(textColor, "text");
      if (resolvedColor) {
        colorProp = resolvedColor;
      } else if (textColor.startsWith("#")) {
        colorProp = hexToDocxColor(textColor);
      } else if (textColor in EDITOR_TEXT_COLORS) {
        colorProp = hexToDocxColor(EDITOR_TEXT_COLORS[textColor as keyof typeof EDITOR_TEXT_COLORS]);
      }
    }

    const backgroundColor = attrs.backgroundColor as string | undefined;
    let shadingProp: IRunPropertiesOptions["shading"] | undefined;
    if (backgroundColor) {
      const resolvedColor = resolveColorForDocx(backgroundColor, "background");
      if (resolvedColor) {
        shadingProp = { type: ShadingType.CLEAR, fill: resolvedColor };
      } else if (backgroundColor.startsWith("#")) {
        shadingProp = { type: ShadingType.CLEAR, fill: hexToDocxColor(backgroundColor) };
      } else if (backgroundColor in EDITOR_BACKGROUND_COLORS) {
        shadingProp = {
          type: ShadingType.CLEAR,
          fill: hexToDocxColor(EDITOR_BACKGROUND_COLORS[backgroundColor as keyof typeof EDITOR_BACKGROUND_COLORS]),
        };
      }
    }

    return {
      ...state,
      ...(colorProp ? { color: colorProp } : {}),
      ...(shadingProp ? { shading: shadingProp } : {}),
    };
  },

  commentMark: (_mark: TipTapMark, state: IRunPropertiesOptions): IRunPropertiesOptions => state,
};
