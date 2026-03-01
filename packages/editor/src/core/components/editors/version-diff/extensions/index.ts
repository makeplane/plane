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

import type { Extensions } from "@tiptap/core";
import { YChangeMark } from "./y-change-mark";
import { YChangeGlobalAttributes } from "./y-change-attributes";
import { YChangeDecorations } from "./ychange-decorations";

export const getVersionDiffExtensions = (): Extensions => {
  return [
    // Inject ychange attributes onto all block nodes (works for non-NodeView nodes)
    YChangeGlobalAttributes,

    // Decorations for NodeView nodes (tables, images, embeds, etc.)
    YChangeDecorations,

    // Inline diffs
    YChangeMark,
  ];
};

export { YChangeMark } from "./y-change-mark";
export { YChangeGlobalAttributes } from "./y-change-attributes";
export { YChangeDecorations, YCHANGE_DECORATIONS_KEY } from "./ychange-decorations";
export { applyYChangeDecorationsToDom } from "./ychange-nodeview-utils";
export {
  useYChangeDecorations,
  getYChangeDecorationInfo,
  hasYChangeDecorations,
  type YChangeDecorationInfo,
} from "./use-ychange-decorations";
export { YChangeNodeViewWrapper } from "./ychange-node-view-wrapper";
