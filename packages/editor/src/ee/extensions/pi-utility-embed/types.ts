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
export enum EPiEmbedBlockAttributeNames {
  EMBED_ID = "data-embed-id",
  EMBED_TYPE = "data-embed-type",
  EMBED_SUB_TYPE = "data-sub-type",
  EMBED_TITLE = "data-title",
}

export enum EPiEmbedTag {
  NODE_TYPE = "data-node-type",
}

export type TPiEmbedBlockAttributes = {
  [EPiEmbedBlockAttributeNames.EMBED_ID]: string | null;
  [EPiEmbedBlockAttributeNames.EMBED_TYPE]: string | null;
  [EPiEmbedBlockAttributeNames.EMBED_SUB_TYPE]: string | null;
  [EPiEmbedBlockAttributeNames.EMBED_TITLE]: string | null;
};

export enum EPiEmbedBlockNodeType {
  PI_UTILITY_EMBED = "pi-utility-embed",
}
