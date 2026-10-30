/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { MouseEvent } from "react";
import React from "react";
import { useLinkClickHandler } from "react-router";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import type { IconGlyph } from "@makeplane/propel/components/icon";
import { ListItem, ListItemButton, ListItemLink } from "@makeplane/propel/components/list";
import type { ISvgIcons } from "@plane/blocks/icons";
// helpers
import { ensureTrailingSlash } from "@/app/compat/next/helper";

type Props = {
  isActive: boolean;
  label: string;
} & ({ as: "button"; onClick: () => void } | { as: "link"; href: string }) &
  (
    | {
        icon: IconGlyph | React.FC<ISvgIcons>;
      }
    | { iconNode: React.ReactElement }
  );

/** A roving list link that routes client-side, so the row stays a real `<a>` for new-tab clicks. */
function SettingsSidebarLink(props: { href: string; label: string; startIcon: React.ReactNode; isActive: boolean }) {
  const { href, label, startIcon, isActive } = props;
  const to = ensureTrailingSlash(href);
  const handleClick = useLinkClickHandler<HTMLAnchorElement>(to);

  return (
    <ListItemLink
      href={to}
      label={label}
      startIcon={startIcon}
      aria-current={isActive ? "page" : undefined}
      onClick={(e) => handleClick(e as MouseEvent<HTMLAnchorElement>)}
    />
  );
}

/** One settings sidebar row; render inside a `List` so arrow keys move between rows. */
export function SettingsSidebarItem(props: Props) {
  const { as, isActive, label } = props;
  const startIcon = "icon" in props ? <Icon icon={<props.icon />} size="md" /> : props.iconNode;

  return (
    <ListItem density="comfortable">
      {as === "button" ? (
        <ListItemButton
          label={label}
          startIcon={startIcon}
          aria-current={isActive ? "page" : undefined}
          onClick={props.onClick}
        />
      ) : (
        <SettingsSidebarLink href={props.href} label={label} startIcon={startIcon} isActive={isActive} />
      )}
    </ListItem>
  );
}
