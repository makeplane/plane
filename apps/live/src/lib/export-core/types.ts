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

// TipTap document model types (single source of truth)
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

// Generic export metadata (format-agnostic)
export type ExportMetadata = {
  baseUrl?: string;
  workspaceSlug?: string;
  workItemEmbeds?: ExportWorkItemEmbed[];
  workItemMentions?: ExportWorkItemMention[];
  userMentions?: ExportUserMention[];
  pageEmbeds?: ExportPageEmbed[];
  fileAssets?: ExportFileAsset[];
  resolvedImageUrls?: Record<string, string>;
  noAssets?: boolean;
};

export type ExportWorkItemEmbed = {
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

export type ExportWorkItemMention = {
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

export type ExportUserMention = {
  id: string;
  display_name: string;
  avatar_url?: string;
};

export type ExportPageEmbed = {
  id: string;
  name: string;
  project_id?: string;
  teamspace_id?: string;
};

export type ExportFileAsset = {
  id: string;
  name: string;
  url?: string;
};

// Generic walker types
export type WalkerState = {
  parentType?: string;
  nestingLevel: number;
  listItemIndex: number;
  textAlign?: string | null;
};

// Node renderer: takes a node + its already-rendered children + context, returns output array
export type NodeRenderer<TOut, TCtx> = (node: TipTapNode, children: TOut[], ctx: TCtx) => TOut[];

// Node renderer registry: maps node type string to handler
export type NodeRendererRegistry<TOut, TCtx> = Record<string, NodeRenderer<TOut, TCtx>>;

// Mark renderer: reduces marks into a format-specific state
export type MarkRenderer<TState, TCtx = void> = (mark: TipTapMark, state: TState, ctx: TCtx) => TState;

// Mark renderer registry: maps mark type string to handler
export type MarkRendererRegistry<TState, TCtx = void> = Record<string, MarkRenderer<TState, TCtx>>;
