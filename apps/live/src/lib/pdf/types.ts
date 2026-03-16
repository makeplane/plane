/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Style } from "@react-pdf/types";

export type TipTapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: TipTapMark[];
};

export type TipTapDocument = {
  type: "doc";
  content?: TipTapNode[];
};

export type KeyGenerator = () => string;

export type PDFRenderContext = {
  getKey: KeyGenerator;
  metadata?: PDFExportMetadata;
};

export type PDFNodeRenderer = (
  node: TipTapNode,
  children: React.ReactElement[],
  context: PDFRenderContext
) => React.ReactElement;

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
};

/**
 * Metadata for resolving entity references in PDF export
 */
export type PDFExportMetadata = {
  /** User mentions (user_mention in mention node) */
  userMentions?: PDFUserMention[];
  /** Resolved image URLs: Map of asset ID to presigned URL */
  resolvedImageUrls?: Record<string, string>;
  /** When true, images and other assets are excluded from the PDF */
  noAssets?: boolean;
};

export type PDFUserMention = {
  id: string;
  display_name: string;
  avatar_url?: string;
};
