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

import { useState } from "react";
import { observer } from "mobx-react";
import { MoreHorizontal } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import type { TContextMenuItem } from "@plane/ui";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
import { SidebarNavItem } from "@/components/sidebar/sidebar-navigation";

type TProps = {
  isActive: boolean;
  title: string | undefined;
  onClickItem: () => void;
};

export const SidebarItem = observer(function SidebarItem(props: TProps) {
  const { isActive, title, onClickItem } = props;
  // state
  const [isMenuActive, setIsMenuActive] = useState(false);
  // translation
  const { t } = useTranslation();
  // hooks

  const MENU_ITEMS: TContextMenuItem[] = [];
  return (
    <>
      <div className="group/script-modal-sidebar-item w-full">
        <SidebarNavItem isActive={isActive} className="gap-0">
          <button
            className="w-full overflow-hidden"
            onClick={() => {
              onClickItem();
            }}
          >
            <div className="flex gap-1 items-center text-body-sm-medium text-secondary truncate capitalize text-start">
              <span>{title || "No title"}</span>
            </div>
          </button>
          <CustomMenu
            customButton={
              <button
                className={cn(
                  "opacity-0 w-0 grid place-items-center p-0.5 text-placeholder bg-layer-transparent hover:bg-layer-transparent-hover rounded group-hover/recent-chat:w-auto group-hover/recent-chat:opacity-100 group-hover/recent-chat:ml-1 outline-none",
                  {
                    "w-auto opacity-100 ml-1": isMenuActive,
                  }
                )}
                onClick={() => setIsMenuActive(!isMenuActive)}
              >
                <MoreHorizontal className="size-4" />
              </button>
            }
            className={cn(
              "opacity-0 pointer-events-none flex-shrink-0 group-hover/recent-chat:opacity-100 group-hover/recent-chat:pointer-events-auto",
              {
                "opacity-100 pointer-events-auto": isMenuActive,
              }
            )}
            customButtonClassName="grid place-items-center"
            placement="bottom-start"
            useCaptureForOutsideClick
            closeOnSelect
            onMenuClose={() => setIsMenuActive(false)}
          >
            {MENU_ITEMS.map((item) => {
              if (item.shouldRender === false) return null;
              return (
                <CustomMenu.MenuItem
                  key={item.key}
                  onClick={() => {
                    item.action();
                  }}
                  className={cn(
                    "flex items-center gap-2",
                    {
                      "text-placeholder": item.disabled,
                    },
                    item.className
                  )}
                  disabled={item.disabled}
                >
                  {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
                  <div>
                    <h5 className="capitalize">{item.title}</h5>
                    {item.description && (
                      <p
                        className={cn("text-tertiary whitespace-pre-line", {
                          "text-placeholder": item.disabled,
                        })}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                </CustomMenu.MenuItem>
              );
            })}
          </CustomMenu>
        </SidebarNavItem>
      </div>
    </>
  );
});
