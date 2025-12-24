import type { FC } from "react";
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
      className="cursor-pointer group flex items-center bg-surface-1 px-4 w-[230px] h-[56px] border-[0.5px] border-subtle rounded-md gap-4"
    >
      <div className="flex-shrink-0 size-8 rounded-sm p-2 bg-surface-2 grid place-items-center">
        <Icon className="size-4 stroke-2 text-tertiary group-hover:text-primary" />
      </div>
      <div className="flex-1 truncate">
        <div className="text-13 font-medium truncate">{title}</div>
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
                className={cn("flex items-center gap-2 w-full ", {
                  "text-placeholder": item.disabled,
                })}
                disabled={item.disabled}
              >
                {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
                <div>
                  <h5>{item.title}</h5>
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
            ))}
          </CustomMenu>
        </div>
      )}
    </div>
  );
}
