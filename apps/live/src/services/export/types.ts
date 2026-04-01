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

import type { TipTapDocument, ExportMetadata } from "@/lib/export-core";
import type {
  TEditorWorkItemEmbed,
  TEditorWorkItemMention,
  TPageEmbed,
  TUserMention,
} from "@/services/page/core.service";

export type ExportInputBase = {
  readonly pageId: string;
  readonly workspaceSlug: string;
  readonly projectId?: string;
  readonly teamspaceId?: string;
  readonly title?: string;
  readonly author?: string;
  readonly subject?: string;
  readonly fileName?: string;
  readonly noAssets?: boolean;
  readonly cookie: string;
  readonly requestId: string;
};

export type PdfExportInput = ExportInputBase & {
  readonly format: "pdf";
  readonly pageSize?: "A4" | "A3" | "A2" | "LETTER" | "LEGAL" | "TABLOID";
  readonly pageOrientation?: "portrait" | "landscape";
};

export type DocxExportInput = ExportInputBase & {
  readonly format: "docx";
};

export type ExportInput = PdfExportInput | DocxExportInput;

export type PageContent = {
  readonly contentJSON: TipTapDocument;
  readonly titleHTML: string | null;
};

export type MetadataResult = {
  readonly workItemEmbeds: TEditorWorkItemEmbed[];
  readonly workItemMentions: TEditorWorkItemMention[];
  readonly userMentions: TUserMention[];
  readonly pageEmbeds: TPageEmbed[];
  readonly resolvedImageUrls?: Record<string, string>;
  readonly baseUrl?: string;
  readonly workspaceSlug?: string;
};

export type ExportPipelineResult = {
  readonly contentJSON: TipTapDocument;
  readonly metadata: ExportMetadata;
  readonly documentTitle: string;
  readonly input: ExportInput;
};
