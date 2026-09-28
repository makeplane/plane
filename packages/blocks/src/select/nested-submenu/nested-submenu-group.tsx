/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
// local imports
import { SubmenuChildLevelContext, SubmenuGroupContext } from "./nested-submenu.context";
import type { SubmenuGroupContextValue } from "./nested-submenu.context";

type NestedSubmenuGroupProps = {
  children: ReactNode;
  /** Controlled active submenu id — pass with `onActiveIdChange` when a parent must drive it
   * (e.g. opening a flyout from keyboard selection). Omit for internal state. */
  activeId?: string | null;
  onActiveIdChange?: (id: string | null) => void;
};

/**
 * Scopes exclusive-open to one sibling level. Every `NestedSubmenu` must live inside one.
 * Inside a flyout panel the level state lives on the enclosing flyout (which needs it to read
 * descendant-open); a top-level group owns its own. Either way changes are reported upward so
 * ancestor flyouts always see their child level's state.
 */
export function NestedSubmenuGroup(props: NestedSubmenuGroupProps) {
  const { children, activeId: controlledActiveId, onActiveIdChange } = props;
  const parentLevel = useContext(SubmenuChildLevelContext);
  const [ownActiveId, setOwnActiveId] = useState<string | null>(null);
  const isControlled = controlledActiveId !== undefined;
  const activeId = isControlled ? controlledActiveId : (parentLevel?.activeId ?? ownActiveId);
  const parentSetActiveId = parentLevel?.setActiveId;

  const value = useMemo<SubmenuGroupContextValue>(
    () => ({
      activeId,
      setActiveId: (id, reason) => {
        // Report to the enclosing flyout even when controlled — its descendant-open read must
        // stay truthful regardless of who owns the visible state.
        parentSetActiveId?.(id, reason);
        if (!isControlled && !parentSetActiveId) setOwnActiveId(id);
        onActiveIdChange?.(id);
      },
    }),
    [activeId, isControlled, parentSetActiveId, onActiveIdChange]
  );

  return <SubmenuGroupContext.Provider value={value}>{children}</SubmenuGroupContext.Provider>;
}
