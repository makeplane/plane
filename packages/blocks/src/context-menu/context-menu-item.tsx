/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/*
 * CE deviation from EE: EE routes `description` into the leaf row's `trailing` slot
 * because Propel's context-menu row was single-line when it was written. Propel 0.7.3's
 * `ContextMenuItem` has a native `description` second line, so the leaf row uses it — parity with
 * the legacy CE menu, which rendered the description as a second line. The submenu trigger has no
 * `description` prop and keeps the `trailing` slot.
 */

import type * as React from "react";
// plane imports
import {
  ContextMenuItem as PropelContextMenuItem,
  ContextMenuSubmenu,
  ContextMenuSubmenuContent,
  ContextMenuSubmenuTrigger,
} from "@makeplane/propel/components/context-menu";
import type { ContextMenuItemVariant } from "@makeplane/propel/components/context-menu";
import { Icon } from "@makeplane/propel/components/icon";
// local imports
import { getRenderableItems, resolveItemVariant } from "./helpers";
import type { TContextMenuItem } from "./types";

type ContextMenuItemProps = {
  item: TContextMenuItem;
};

/**
 * Propel's context-menu row is `neutral | danger` only — the `accent` look lives on `MenuItem`, not
 * here — so an `accent` row reads as neutral on this surface.
 */
function toPropelVariant(item: TContextMenuItem): ContextMenuItemVariant {
  return resolveItemVariant(item) === "danger" ? "danger" : "neutral";
}

/** The submenu trigger's inline-end slot. The trigger has no `description` line, so it lands here. */
function getTrailingSlot(item: TContextMenuItem): React.ReactElement | undefined {
  return item.description ? <span>{item.description}</span> : undefined;
}

function getLeadingSlot(item: TContextMenuItem): React.ReactNode {
  // `customContent` replaced the whole row body in the legacy menu. Propel's row owns its own
  // layout and takes no children, so the node rides in the leading slot instead.
  if (item.customContent) return item.customContent;
  if (!item.icon) return undefined;
  const Glyph = item.icon;
  return <Icon icon={Glyph} />;
}

/**
 * One `TContextMenuItem` rendered as a Propel row — a submenu when it carries renderable
 * `nestedMenuItems`, a plain action row otherwise.
 */
export function ContextMenuItem(props: ContextMenuItemProps) {
  const { item } = props;
  // derived values
  const nestedItems = getRenderableItems(item.nestedMenuItems);
  const leading = getLeadingSlot(item);
  const trailing = getTrailingSlot(item);
  const variant = toPropelVariant(item);
  const label = item.title ?? "";

  if (item.shouldRender === false) return null;

  if (nestedItems.length > 0) {
    return (
      <ContextMenuSubmenu>
        <ContextMenuSubmenuTrigger
          variant={variant}
          label={label}
          icon={leading}
          trailing={trailing}
          disabled={item.disabled}
        />
        <ContextMenuSubmenuContent sizing="auto">
          {nestedItems.map((nestedItem) => (
            <ContextMenuItem key={nestedItem.key} item={nestedItem} />
          ))}
        </ContextMenuSubmenuContent>
      </ContextMenuSubmenu>
    );
  }

  return (
    <PropelContextMenuItem
      variant={variant}
      label={label}
      icon={leading}
      description={item.description || undefined}
      disabled={item.disabled}
      closeOnClick={item.closeOnClick !== false}
      onClick={() => item.action()}
    />
  );
}

ContextMenuItem.displayName = "blocks.ContextMenuItem";
