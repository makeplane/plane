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

import { ADDITIONAL_EXTENSIONS as ADDITIONAL_EXTENSIONS_UTILS } from "@plane/utils";
export enum ADDITIONAL_EXTENSIONS {
  PAGE_EMBED_COMPONENT = "pageEmbedComponent",
  COLLABORATION_CARET = "collaborationCursor",
  ATTACHMENT = "attachmentComponent",
  COMMENTS = "commentMark",
  MATHEMATICS = "mathematics",
  INLINE_MATH = "inlineMath",
  BLOCK_MATH = "blockMath",
  EXTERNAL_EMBED = "externalEmbedComponent",
  PAGE_LINK_COMPONENT = "pageLinkComponent",
  DRAWIO = "drawIoComponent",
  AI_BLOCK = "aiBlockComponent",
}

export const ADDITIONAL_BLOCK_NODE_TYPES = [
  ADDITIONAL_EXTENSIONS.PAGE_EMBED_COMPONENT,
  ADDITIONAL_EXTENSIONS.ATTACHMENT,
  ADDITIONAL_EXTENSIONS.BLOCK_MATH,
  ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED,
  ADDITIONAL_EXTENSIONS.PAGE_LINK_COMPONENT,
  ADDITIONAL_EXTENSIONS.DRAWIO,
  ADDITIONAL_EXTENSIONS.AI_BLOCK,
  ADDITIONAL_EXTENSIONS_UTILS.MULTI_COLUMN,
  ADDITIONAL_EXTENSIONS_UTILS.COLUMN,
  ADDITIONAL_EXTENSIONS_UTILS.COLUMN_LIST,
];
