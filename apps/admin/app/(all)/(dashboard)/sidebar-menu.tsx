/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// plane internal packages
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { cn } from "@plane/utils";
// hooks
import { useTheme } from "@/hooks/store";
import { useSidebarMenu } from "@/hooks/use-sidebar-menu";

export const AdminSidebarMenu = observer(function AdminSidebarMenu() {
  // router
  const pathName = usePathname();
  // store hooks
  const { isSidebarCollapsed, toggleSidebar } = useTheme();
  // derived values
  const sidebarMenu = useSidebarMenu();

  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar(!isSidebarCollapsed);
    }
  };

  return (
    <nav
      aria-label="Instance settings"
      className="vertical-scrollbar scrollbar-sm flex h-full w-full flex-col gap-2.5 overflow-y-scroll px-4 py-4"
    >
      {sidebarMenu.map((item) => {
        const isActive = item.href === pathName || pathName?.startsWith(item.href);
        return (
          <Tooltip key={item.href} label={item.name} side="right" disabled={!isSidebarCollapsed}>
            <Link
              href={item.href}
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
              onClick={handleItemClick}
              className={cn(
                "group flex w-full items-center gap-3 rounded-md px-3 py-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-strong",
                {
                  "!bg-layer-transparent-active text-primary": isActive,
                  "text-secondary hover:bg-layer-transparent-hover active:bg-layer-transparent-active": !isActive,
                },
                isSidebarCollapsed ? "justify-center" : "w-[260px]"
              )}
            >
              <item.Icon className="h-4 w-4 flex-shrink-0" />
              {!isSidebarCollapsed && (
                <div className="w-full">
                  <div className="text-body-xs-medium transition-colors">{item.name}</div>
                  <div className="text-caption-sm-regular transition-colors">{item.description}</div>
                </div>
              )}
            </Link>
          </Tooltip>
        );
      })}
    </nav>
  );
});
