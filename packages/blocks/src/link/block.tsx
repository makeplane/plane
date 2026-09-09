/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// plane utils
import { calculateTimeAgo, cn, getIconForLink } from "@plane/utils";
// plane ui
import type { TContextMenuItem } from "../dropdowns/context-menu/root";
import { CustomMenu } from "../dropdowns/custom-menu";

export type TLinkItemBlockProps = {
  title: string;
  url: string;
  createdAt?: Date | string;
  menuItems?: TContextMenuItem[];
  onClick?: () => void;
};

export function LinkItemBlock(props: TLinkItemBlockProps) {
  // props
  const { title, url, createdAt, menuItems, onClick } = props;
  // icons
  const Icon = getIconForLink(url);
  return (
    <div
      onClick={onClick}
      className="group flex h-[56px] w-[230px] cursor-pointer items-center gap-4 rounded-md border-[0.5px] border-subtle bg-surface-1 px-4"
    >
      <div className="grid size-8 flex-shrink-0 place-items-center rounded-sm bg-surface-2 p-2">
        <Icon className="size-4 stroke-2 text-tertiary group-hover:text-primary" />
      </div>
      <div className="flex-1 truncate">
        <div className="truncate text-13 font-medium">{title}</div>
        {createdAt && <div className="text-11 font-medium text-placeholder">{calculateTimeAgo(createdAt)}</div>}
      </div>
      {menuItems && (
        <div className="hidden group-hover:block">
          <CustomMenu placement="bottom-end" menuItemsClassName="z-20" closeOnSelect verticalEllipsis>
            {menuItems.map((item) => (
              <CustomMenu.MenuItem
                key={item.key}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  item.action();
                }}
                className={cn("flex w-full items-center gap-2", {
                  "text-placeholder": item.disabled,
                })}
                disabled={item.disabled}
              >
                {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
                <div>
                  <h5>{item.title}</h5>
                  {item.description && (
                    <p
                      className={cn("whitespace-pre-line text-tertiary", {
                        "text-placeholder": item.disabled,
                      })}
                    >
                      {item.description}
                    </p>
                  )}
                </div>
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
        </div>
      )}
    </div>
  );
}
