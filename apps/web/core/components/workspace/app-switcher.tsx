/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// components/WorkspaceAppSwitcher.tsx

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Grip } from "lucide-react";
import { CheckIcon } from "@plane/propel/icons";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
import type { AppSidebarItemData } from "@/components/sidebar/sidebar-item";
import { useAppRailVisibility } from "@/lib/app-rail/context";
import { withDockItems } from "@/components/app-rail/app-rail-hoc";

type Props = {
  dockItems: (AppSidebarItemData & { shouldRender: boolean })[];
};

function Component({ dockItems }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toggleAppRail } = useAppRailVisibility();
  const router = useRouter();

  return (
    <CustomMenu
      customButton={
        <button
          type="button"
          className={cn("flex items-center justify-center size-7 rounded-sm bg-layer-1 hover:bg-layer-1 outline-none", {
            "bg-layer-1": isMenuOpen,
          })}
        >
          <Grip className="size-5 text-tertiary" />
        </button>
      }
      menuButtonOnClick={() => !isMenuOpen && setIsMenuOpen(true)}
      onMenuClose={() => setIsMenuOpen(false)}
      placement="bottom-start"
      closeOnSelect
      optionsClassName="min-w-48 rounded-lg"
    >
      <div className="flex flex-col">
        <div className="flex flex-col gap-0.5 pb-1">
          {dockItems
            .filter((item) => item.shouldRender)
            .map((item) => (
              <CustomMenu.MenuItem
                key={item.label}
                onClick={() => item.href && router.push(item.href)}
                className={cn("group flex items-center justify-between gap-2 rounded-md hover:bg-layer-1", {
                  "text-secondary": item.isActive,
                })}
              >
                <div className="flex items-center gap-2">
                  {item.icon && (
                    <div className="flex items-center justify-center size-8 rounded-md bg-layer-1">
                      <span className="size-5 text-tertiary">{item.icon}</span>
                    </div>
                  )}
                  <span className="text-11 font-medium">{item.label}</span>
                </div>
                {/* check icon */}
                {item.isActive && (
                  <span className="flex items-center justify-center px-2">
                    <CheckIcon className="size-4 text-tertiary" />
                  </span>
                )}
              </CustomMenu.MenuItem>
            ))}
        </div>
        <div className="border-t border-subtle-1 pt-1">
          <CustomMenu.MenuItem onClick={toggleAppRail}>
            <span className="text-11">Dock App Rail</span>
          </CustomMenu.MenuItem>
        </div>
      </div>
    </CustomMenu>
  );
}

export const WorkspaceAppSwitcher = withDockItems(Component);
