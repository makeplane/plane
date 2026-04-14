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

import { AlignmentType, BorderStyle, LevelFormat, ShadingType, UnderlineType, convertInchesToTwip } from "docx";

export const numberingConfig = {
  config: [
    {
      reference: "plane-numbered-list",
      levels: Array.from({ length: 9 }, (_, i) => ({
        level: i,
        format: LevelFormat.DECIMAL,
        text: `%${i + 1}.`,
        alignment: AlignmentType.START,
        style: {
          paragraph: {
            indent: {
              left: convertInchesToTwip(0.5 * (i + 1)),
              hanging: convertInchesToTwip(0.25),
            },
          },
        },
      })),
    },
    {
      reference: "plane-bullet-list",
      levels: Array.from({ length: 9 }, (_, i) => ({
        level: i,
        format: LevelFormat.BULLET,
        text: "\u2022",
        alignment: AlignmentType.START,
        style: {
          paragraph: {
            indent: {
              left: convertInchesToTwip(0.5 * (i + 1)),
              hanging: convertInchesToTwip(0.25),
            },
          },
        },
      })),
    },
  ],
};

export const HEADING_SIZES = {
  1: 40,
  2: 32,
  3: 28,
  4: 24,
  5: 22,
  6: 20,
} as const;

export const HEADING_SPACING = {
  1: { before: 320, after: 160 },
  2: { before: 280, after: 120 },
  3: { before: 240, after: 80 },
  4: { before: 200, after: 80 },
  5: { before: 160, after: 80 },
  6: { before: 120, after: 80 },
} as const;

export const DEFAULT_FONT = "Inter";
export const MONO_FONT = "Courier New";
export const DEFAULT_FONT_SIZE = 22;

export const headingStyles = [
  {
    id: "Heading1",
    name: "Heading 1",
    basedOn: "Normal",
    next: "Normal",
    run: { bold: true, size: HEADING_SIZES[1] },
    paragraph: { spacing: HEADING_SPACING[1] },
  },
  {
    id: "Heading2",
    name: "Heading 2",
    basedOn: "Normal",
    next: "Normal",
    run: { bold: true, size: HEADING_SIZES[2] },
    paragraph: { spacing: HEADING_SPACING[2] },
  },
  {
    id: "Heading3",
    name: "Heading 3",
    basedOn: "Normal",
    next: "Normal",
    run: { bold: true, size: HEADING_SIZES[3] },
    paragraph: { spacing: HEADING_SPACING[3] },
  },
  {
    id: "Heading4",
    name: "Heading 4",
    basedOn: "Normal",
    next: "Normal",
    run: { bold: true, size: HEADING_SIZES[4] },
    paragraph: { spacing: HEADING_SPACING[4] },
  },
  {
    id: "Heading5",
    name: "Heading 5",
    basedOn: "Normal",
    next: "Normal",
    run: { bold: true, size: HEADING_SIZES[5] },
    paragraph: { spacing: HEADING_SPACING[5] },
  },
  {
    id: "Heading6",
    name: "Heading 6",
    basedOn: "Normal",
    next: "Normal",
    run: { bold: true, size: HEADING_SIZES[6] },
    paragraph: { spacing: HEADING_SPACING[6] },
  },
];

export const paragraphStyles = [
  ...headingStyles,
  {
    id: "SourceCode",
    name: "Source Code",
    basedOn: "Normal",
    run: { font: { name: MONO_FONT }, size: 19 },
    paragraph: {
      shading: { type: ShadingType.CLEAR, fill: "f0f0f0" },
      indent: { left: 180 },
    },
  },
  {
    id: "BlockQuote",
    name: "Block Quote",
    basedOn: "Normal",
    run: {},
    paragraph: {
      indent: { left: 180 },
      border: {
        left: { style: BorderStyle.SINGLE, size: 6, color: "cccccc", space: 8 },
      },
    },
  },
];

export const characterStyles = [
  {
    id: "VerbatimChar",
    name: "Verbatim Char",
    basedOn: "DefaultParagraphFont",
    run: { font: { name: MONO_FONT }, size: 20 },
  },
  {
    id: "Hyperlink",
    name: "Hyperlink",
    basedOn: "DefaultParagraphFont",
    run: { color: "3f76ff", underline: { type: UnderlineType.SINGLE } },
  },
];
