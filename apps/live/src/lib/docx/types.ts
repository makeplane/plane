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

import type { Paragraph, Table, TableRow, TableCell } from "docx";
import type {
  ExportMetadata,
  ExportWorkItemEmbed,
  ExportWorkItemMention,
  ExportUserMention,
  ExportPageEmbed,
  ExportFileAsset,
} from "@/lib/export-core";

export type { TipTapMark, TipTapNode, TipTapDocument } from "@/lib/export-core";

export type DocxRenderContext = {
  metadata?: DocxExportMetadata;
};

export type DocxExportOptions = {
  title?: string;
  author?: string;
  subject?: string;
  metadata?: DocxExportMetadata;
  noAssets?: boolean;
};

export type DocxExportMetadata = ExportMetadata & {
  workItemEmbeds?: DocxWorkItemEmbed[];
  workItemMentions?: DocxWorkItemMention[];
  userMentions?: DocxUserMention[];
  pageEmbeds?: DocxPageEmbed[];
  fileAssets?: DocxFileAsset[];
};

export type DocxWorkItemEmbed = ExportWorkItemEmbed;
export type DocxWorkItemMention = ExportWorkItemMention;
export type DocxUserMention = ExportUserMention;
export type DocxPageEmbed = ExportPageEmbed;
export type DocxFileAsset = ExportFileAsset;

export type DocxBlockOutput = (Paragraph | Table | TableRow | TableCell)[];
