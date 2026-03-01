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
import type { ReactElement } from "react";

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

export type PDFNodeRenderer = (node: TipTapNode, children: ReactElement[], context: PDFRenderContext) => ReactElement;

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
  /** Base URL for generating absolute links (e.g., "https://app.plane.so") */
  baseUrl?: string;
  /** Workspace slug for generating links */
  workspaceSlug?: string;
  /** Work item embeds (issue-embed-component) */
  workItemEmbeds?: PDFWorkItemEmbed[];
  /** Work item mentions (issue_mention in mention node) */
  workItemMentions?: PDFWorkItemMention[];
  /** User mentions (user_mention in mention node) */
  userMentions?: PDFUserMention[];
  /** Page embeds (pageEmbedComponent) */
  pageEmbeds?: PDFPageEmbed[];
  /** File assets for attachments/images */
  fileAssets?: PDFFileAsset[];
  /** Resolved image URLs: Map of asset ID to presigned URL */
  resolvedImageUrls?: Record<string, string>;
  /** When true, images and other assets are excluded from the PDF */
  noAssets?: boolean;
};

export type PDFWorkItemEmbed = {
  id: string;
  name: string;
  sequence_id: number;
  project_id: string;
  project__identifier: string;
  priority?: string | null;
  type_id?: string | null;
  state__group?: string;
  state__name?: string;
  state__color?: string;
};

export type PDFWorkItemMention = {
  id: string;
  name: string;
  sequence_id: number;
  project_id: string;
  project__identifier: string;
  type_id?: string | null;
  state__group?: string;
  state__name?: string;
  state__color?: string;
};

export type PDFUserMention = {
  id: string;
  display_name: string;
  avatar_url?: string;
};

export type PDFPageEmbed = {
  id: string;
  name: string;
  project_id?: string;
  teamspace_id?: string;
};

export type PDFFileAsset = {
  id: string;
  name: string;
  url?: string;
};
