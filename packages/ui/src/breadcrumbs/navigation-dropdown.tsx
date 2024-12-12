"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
// ui
import { CustomMenu, TContextMenuItem } from "../dropdowns";
// helpers
import { cn } from "../../helpers";

type TBreadcrumbNavigationDropdownProps = {
  selectedItemKey: string;
  navigationItems: TContextMenuItem[];
  navigationDisabled?: boolean;
};

export const BreadcrumbNavigationDropdown = (props: TBreadcrumbNavigationDropdownProps) => {
  const { selectedItemKey, navigationItems, navigationDisabled = false } = props;
  // derived values
  const selectedItem = navigationItems.find((item) => item.key === selectedItemKey);
  const selectedItemIcon = selectedItem?.icon ? (
    <selectedItem.icon className={cn("size-3.5", selectedItem.iconClassName)} />
  ) : undefined;

  // if no selected item, return null
  if (!selectedItem) return null;

  const NavigationButton = ({ className }: { className?: string }) => (
    <li
      className={cn(
        "flex items-center justify-center cursor-default text-sm font-medium text-custom-text-200 group-hover:text-custom-text-100 outline-none",
        className
      )}
      tabIndex={-1}
    >
      {selectedItemIcon && (
        <div className="flex h-5 w-5 items-center justify-start overflow-hidden">{selectedItemIcon}</div>
      )}
      <div className="relative line-clamp-1 block max-w-[150px] overflow-hidden truncate">{selectedItem.title}</div>
    </li>
  );

  if (navigationDisabled) {
    return <NavigationButton />;
  }

  return (
    <CustomMenu
      customButton={
        <div className="group flex items-center gap-1.5">
          <NavigationButton className="cursor-pointer" />
          <ChevronDownIcon className="size-4 text-custom-text-200 group-hover:text-custom-text-100" />
        </div>
      }
      placement="bottom-start"
      closeOnSelect
    >
      {navigationItems.map((item) => {
        if (item.shouldRender === false) return null;
        return (
          <CustomMenu.MenuItem
            key={item.key}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (item.key === selectedItemKey) return;
              item.action();
            }}
            className={cn(
              "flex items-center gap-2",
              {
                "text-custom-text-400": item.disabled,
              },
              item.className
            )}
            disabled={item.disabled}
          >
            {item.icon && <item.icon className={cn("size-3.5", item.iconClassName)} />}
            <div className="w-full">
              <h5>{item.title}</h5>
              {item.description && (
                <p
                  className={cn("text-custom-text-300 whitespace-pre-line", {
                    "text-custom-text-400": item.disabled,
                  })}
                >
                  {item.description}
                </p>
              )}
            </div>
            {item.key === selectedItemKey && <CheckIcon className="flex-shrink-0 size-3.5" />}
          </CustomMenu.MenuItem>
        );
      })}
    </CustomMenu>
  );
};
