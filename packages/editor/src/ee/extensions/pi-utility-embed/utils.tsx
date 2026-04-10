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
import type { TPiEmbedBlockAttributes } from "./types";
import { EPiEmbedBlockAttributeNames, EPiEmbedBlockNodeType } from "./types";

export const DEFAULT_PI_EMBED_BLOCK_ATTRIBUTES: Omit<TPiEmbedBlockAttributes, "node_type"> = {
  [EPiEmbedBlockAttributeNames.EMBED_ID]: null,
  [EPiEmbedBlockAttributeNames.EMBED_TYPE]: null,
  [EPiEmbedBlockAttributeNames.EMBED_SUB_TYPE]: null,
  [EPiEmbedBlockAttributeNames.EMBED_TITLE]: null,
  [EPiEmbedBlockAttributeNames.NODE_TYPE]: EPiEmbedBlockNodeType.PI_UTILITY_EMBED,
};
