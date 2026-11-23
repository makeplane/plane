/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { NestedSubmenuGroup } from "./nested-submenu-group";
import { NestedSubmenuRoot } from "./nested-submenu-root";

export type { NestedSubmenuProps } from "./nested-submenu-root";

/** See `nested-submenu-root.tsx` for the submenu policy this compound implements. */
export const NestedSubmenu = Object.assign(NestedSubmenuRoot, {
  Group: NestedSubmenuGroup,
});
