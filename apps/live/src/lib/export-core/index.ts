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

export type {
  TipTapMark,
  TipTapNode,
  TipTapDocument,
  ExportMetadata,
  ExportWorkItemEmbed,
  ExportWorkItemMention,
  ExportUserMention,
  ExportPageEmbed,
  ExportFileAsset,
  WalkerState,
  NodeRenderer,
  NodeRendererRegistry,
  MarkRenderer,
  MarkRendererRegistry,
} from "./types";
export { walkTipTapNode, walkTipTapDocument } from "./tiptap-walker";
export type { WalkOptions } from "./tiptap-walker";
export { applyMarks } from "./marks";
export {
  EDITOR_TEXT_COLORS,
  EDITOR_BACKGROUND_COLORS,
  EDITOR_BACKGROUND_COLORS_LIGHT,
  EDITOR_BACKGROUND_COLORS_DARK,
  NEUTRAL_COLORS,
  BRAND_COLORS,
  TEXT_COLORS,
  BACKGROUND_COLORS,
  BORDER_COLORS,
  CODE_COLORS,
  LINK_COLORS,
  MENTION_COLORS,
  SUCCESS_COLORS,
  WARNING_COLORS,
  DANGER_COLORS,
  resolveColorForPdf,
  resolveColor,
  resolveColorForDocx,
  hexToDocxColor,
  getTextColorHex,
  getBackgroundColorHex,
  isCssVariable,
  extractColorKeyFromCssVariable,
} from "./colors";
export type { EditorColorKey } from "./colors";
