/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TContextMenuItem, TContextMenuItemVariant } from "./types";

/** Rows whose `shouldRender` is explicitly `false` never reach the surface. */
export function getRenderableItems(items: TContextMenuItem[] | undefined): TContextMenuItem[] {
  return items?.filter((item) => item.shouldRender !== false) ?? [];
}

/**
 * The row's look. `variant` wins; failing that, a legacy `className` carrying a `text-danger` token
 * still resolves to `danger`, which is how the ~15 quick-action files currently paint their Delete
 * row. Drop this fallback once those call sites pass `variant` instead.
 */
export function resolveItemVariant(item: TContextMenuItem): TContextMenuItemVariant {
  if (item.variant) return item.variant;
  if (item.className?.includes("text-danger")) return "danger";
  return "neutral";
}
