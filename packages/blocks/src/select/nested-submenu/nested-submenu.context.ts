/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createContext, useContext } from "react";

export type SubmenuGroupContextValue = {
  activeId: string | null;
  /** `reason` rides along on closes (`id === null`) so an ancestor can tell a hover-away close
   * (which may need to cascade — see the deferred close in `NestedSubmenuRoot`) from an Escape
   * or programmatic one (which must collapse exactly one level). */
  setActiveId: (id: string | null, reason?: "hover-away") => void;
};

/** Scopes exclusive flyout open to one sibling level — provided by `NestedSubmenu.Group`. */
export const SubmenuGroupContext = createContext<SubmenuGroupContextValue | null>(null);

/** The enclosing group scope — every `NestedSubmenu` (and its group) lives inside one. */
export function useSubmenuGroup(): SubmenuGroupContextValue {
  const context = useContext(SubmenuGroupContext);
  if (context === null) {
    throw new Error("NestedSubmenu must be rendered inside NestedSubmenu.Group");
  }
  return context;
}

/**
 * State an OPEN flyout offers to the `NestedSubmenu.Group` rendered in its panel. The flyout
 * owns its child level's active id so it can read descendant-open state as plain render state —
 * open states cascade (a grandchild can only be open inside an open child), so "any descendant
 * open" is exactly "my child level has an active flyout".
 */
export const SubmenuChildLevelContext = createContext<SubmenuGroupContextValue | null>(null);

/**
 * The sibling-level state a panel's rows share — the enclosing flyout's child level. Panel
 * bodies read it to react to their level's open flyout (e.g. pin its row visible, close it on
 * search) from their OWN render, since they cannot consume a context their nested
 * `NestedSubmenu.Group` provides below them. Null outside a flyout panel.
 */
export function useSubmenuLevel(): SubmenuGroupContextValue | null {
  return useContext(SubmenuChildLevelContext);
}

/**
 * The resolved side (after collision flips) of the enclosing flyout chain. Descendants prefer
 * it, so a cascade that flips at the viewport edge keeps flowing in one direction instead of
 * zig-zagging back over its parents.
 */
export const SubmenuSideContext = createContext<"left" | "right" | null>(null);
