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
import type { ReactNode } from "react";
import type {
  ExportMetadata,
  ExportWorkItemEmbed,
  ExportWorkItemMention,
  ExportUserMention,
  ExportPageEmbed,
  ExportFileAsset,
  TipTapMark,
  TipTapNode,
} from "@/lib/export-core";

// Re-export shared TipTap types for backward compatibility
export type { TipTapMark, TipTapNode, TipTapDocument } from "@/lib/export-core";

// PDF-specific types
export type KeyGenerator = () => string;

export type PDFRenderContext = {
  getKey: KeyGenerator;
  metadata?: PDFExportMetadata;
};

export type PDFNodeRenderer = (node: TipTapNode, children: ReactNode[], context: PDFRenderContext) => ReactNode;

export type PDFMarkRenderer = (mark: TipTapMark, currentStyle: Style) => Style;

export type NodeRendererRegistry = Record<string, PDFNodeRenderer>;

export type MarkRendererRegistry = Record<string, PDFMarkRenderer>;

export type PDFExportOptions = {
  title?: string;
  author?: string;
  subject?: string;
  pageSize?: "A4" | "A3" | "A2" | "LETTER" | "LEGAL" | "TABLOID";
  pageOrientation?: "portrait" | "landscape";
  metadata?: PDFExportMetadata;
  /** When true, images and other assets are excluded from the PDF */
  noAssets?: boolean;
  /**
   * Client hint: document contains CJK characters and needs Noto Sans CJK loaded.
   * If undefined, the renderer scans the document text as fallback.
   */
  containsCjk?: boolean;
};

export type PDFExportMetadata = ExportMetadata & {
  /** Available content width on the rendered PDF page after page padding */
  pageContentWidth?: number;
  workItemEmbeds?: PDFWorkItemEmbed[];
  workItemMentions?: PDFWorkItemMention[];
  userMentions?: PDFUserMention[];
  pageEmbeds?: PDFPageEmbed[];
  fileAssets?: PDFFileAsset[];
};

// Backward-compatible aliases to export-core types
export type PDFWorkItemEmbed = ExportWorkItemEmbed;
export type PDFWorkItemMention = ExportWorkItemMention;
export type PDFUserMention = ExportUserMention;
export type PDFPageEmbed = ExportPageEmbed;
export type PDFFileAsset = ExportFileAsset;
