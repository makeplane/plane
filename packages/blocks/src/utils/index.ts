/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export { DotSeparator } from "./dot-separator";
export type { DotSeparatorProps } from "./dot-separator";
export { convertPlacementToSideAndAlign } from "./placement";
export type { Align, Placement, Side, TAlign, TPlacement, TSide } from "./placement";

/**
 * @deprecated Temporary re-export so the apps that still import `cn` from `@plane/blocks/utils`
 * keep compiling. Import `cn` from `@plane/utils` instead; removed once those importers move (F5).
 */
export { cn } from "@plane/utils";
