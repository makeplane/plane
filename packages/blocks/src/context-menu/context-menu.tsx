/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
// plane imports
import { ContextMenu as PropelContextMenu, ContextMenuContent } from "@makeplane/propel/components/context-menu";
import { usePlatformOS } from "@plane/hooks";
// local imports
import { ContextMenuItem } from "./context-menu-item";
import { getRenderableItems } from "./helpers";
import type { TContextMenuItem } from "./types";

export type ContextMenuProps = {
  /** The element whose right clicks open the menu. Owned by the consumer, not by this component. */
  parentRef: React.RefObject<HTMLElement | null>;
  /** The rows to render, top to bottom. */
  items: TContextMenuItem[];
};

/**
 * The right-click menu Plane's boards, lists and tables share. Takes the same `{ parentRef, items }`
 * contract as the retired UI package's `ContextMenu` and renders it with Propel's context-menu parts.
 *
 * Propel's `ContextMenuTrigger` wants to own its right-click target, but this contract hands us a
 * ref to an element the consumer already rendered — so the `contextmenu` listener and the
 * cursor-pinned virtual anchor stay here, and the surface is driven as a controlled menu.
 */
export function ContextMenu(props: ContextMenuProps) {
  const { parentRef, items } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  // ref
  // A virtual anchor pinned to the cursor position of the latest right click — Base UI's positioner
  // reads `getBoundingClientRect` to place the popup.
  const cursorRef = useRef({ x: 0, y: 0 });
  // derived values
  const anchor = useMemo(
    () => ({
      getBoundingClientRect: () => new DOMRect(cursorRef.current.x, cursorRef.current.y, 0, 0),
    }),
    []
  );
  const renderedItems = getRenderableItems(items);
  const { isMobile } = usePlatformOS();

  // The consumers own the right-click target (passed as `parentRef`), so capture its `contextmenu`
  // events to record the cursor position and open the menu.
  useEffect(() => {
    const parentElement = parentRef.current;
    if (!parentElement) return;

    const handleContextMenu = (e: MouseEvent) => {
      if (isMobile) return;

      e.preventDefault();
      e.stopPropagation();

      cursorRef.current = { x: e.clientX, y: e.clientY };
      setIsOpen(true);
    };

    parentElement.addEventListener("contextmenu", handleContextMenu);

    return () => {
      parentElement.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isMobile, parentRef]);

  return (
    <PropelContextMenu open={isOpen} onOpenChange={setIsOpen}>
      <ContextMenuContent anchor={anchor} side="bottom" align="start" sideOffset={0}>
        {renderedItems.map((item) => (
          <ContextMenuItem key={item.key} item={item} />
        ))}
      </ContextMenuContent>
    </PropelContextMenu>
  );
}

ContextMenu.displayName = "blocks.ContextMenu";
