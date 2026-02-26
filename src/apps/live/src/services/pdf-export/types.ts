/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TipTapDocument, PDFUserMention } from "@/lib/pdf";

export interface PdfExportInput {
  readonly pageId: string;
  readonly workspaceSlug: string;
  readonly projectId?: string;
  readonly title?: string;
  readonly author?: string;
  readonly subject?: string;
  readonly pageSize?: "A4" | "A3" | "A2" | "LETTER" | "LEGAL" | "TABLOID";
  readonly pageOrientation?: "portrait" | "landscape";
  readonly fileName?: string;
  readonly noAssets?: boolean;
  readonly cookie: string;
  readonly requestId: string;
}

export interface PdfExportResult {
  readonly pdfBuffer: Buffer;
  readonly outputFileName: string;
  readonly pageId: string;
}

export interface PageContent {
  readonly contentJSON: TipTapDocument;
  readonly titleHTML: string | null;
  readonly descriptionBinary: Buffer;
}

/**
 * Metadata - includes user mentions
 */
export interface MetadataResult {
  readonly userMentions: PDFUserMention[];
  readonly resolvedImageUrls?: Record<string, string>;
}
