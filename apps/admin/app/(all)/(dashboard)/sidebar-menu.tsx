/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { MouseEvent } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { useHref, useLinkClickHandler } from "react-router";
// plane internal packages
import { Icon } from "@makeplane/propel/components/icon";
import { List, ListItem, ListItemLink } from "@makeplane/propel/components/list";
import { ScrollArea } from "@makeplane/propel/components/scroll-area";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { cn } from "@plane/utils";
// hooks
import { useTheme } from "@/hooks/store";
import { useSidebarMenu } from "@/hooks/use-sidebar-menu";
import type { TSidebarMenuItem } from "@/hooks/use-sidebar-menu/types";

type TAdminSidebarMenuItemProps = {
  item: TSidebarMenuItem;
  isActive: boolean;
  isCollapsed: boolean;
  onNavigate: () => void;
};

function AdminSidebarMenuItem(props: TAdminSidebarMenuItemProps) {
  const { item, isActive, isCollapsed, onNavigate } = props;
  // router: the row is a plain anchor, so client-side navigation is wired up by hand
  const href = useHref(item.href);
  const handleLinkClick = useLinkClickHandler<HTMLAnchorElement>(item.href);

  return (
    <ListItem
      density="comfortable"
      render={
        <div
          className={cn({
            // icon-only rail: center the glyph and drop the empty label slot
            "px-2 [&_[data-list-item-primary]]:justify-center [&_[data-list-item-primary]>span:empty]:hidden":
              isCollapsed,
          })}
        />
      }
    >
      <Tooltip label={isCollapsed ? item.name : item.description} side="right">
        <ListItemLink
          href={href}
          label={isCollapsed ? "" : item.name}
          startIcon={<Icon icon={item.Icon} />}
          aria-label={item.name}
          aria-current={isActive ? "page" : undefined}
          onClick={(event) => {
            handleLinkClick(event as MouseEvent<HTMLAnchorElement>);
            if (event.defaultPrevented) onNavigate();
          }}
        />
      </Tooltip>
    </ListItem>
  );
}

export const AdminSidebarMenu = observer(function AdminSidebarMenu() {
  // router
  const pathName = usePathname();
  // store hooks
  const { isSidebarCollapsed, toggleSidebar } = useTheme();
  // derived values
  const sidebarMenu = useSidebarMenu();

  // close the overlay sidebar after navigating on mobile
  const handleItemNavigate = () => {
    if (window.innerWidth < 768) toggleSidebar(true);
  };

  return (
    <ScrollArea orientation="vertical" size="sm">
      <nav aria-label="Instance settings" className="px-3 py-4">
        <List>
          {sidebarMenu.map((item) => (
            <AdminSidebarMenuItem
              key={item.href}
              item={item}
              isActive={item.href === pathName || !!pathName?.startsWith(item.href)}
              isCollapsed={!!isSidebarCollapsed}
              onNavigate={handleItemNavigate}
            />
          ))}
        </List>
      </nav>
    </ScrollArea>
  );
});
