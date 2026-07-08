/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// The block is serialized as a generic, sanitizer-safe <div> carrying only
// attributes that the backend nh3 allowlist already permits (data-block-type,
// data-id, data-name) — mirroring the callout node so it survives every write.
export enum EPageEmbedAttributeNames {
  BLOCK_TYPE = "data-block-type",
  PAGE_ID = "data-id",
  PAGE_TITLE = "data-name",
}

export const PAGE_EMBED_BLOCK_TYPE = "page-embed-component";

export type TPageEmbedAttributes = {
  [EPageEmbedAttributeNames.BLOCK_TYPE]: string;
  [EPageEmbedAttributeNames.PAGE_ID]: string | null;
  [EPageEmbedAttributeNames.PAGE_TITLE]: string | null;
};

export type TPageEmbedWidgetCallbackProps = {
  pageId: string;
  pageTitle: string;
};

export type TPageEmbedWidgetCallback = (props: TPageEmbedWidgetCallbackProps) => React.ReactNode;
