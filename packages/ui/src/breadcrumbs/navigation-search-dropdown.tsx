import * as React from "react";
import { useState } from "react";
import { Tooltip } from "@plane/propel/tooltip";
import type { ICustomSearchSelectOption } from "@plane/types";
import { CustomSearchSelect } from "../dropdowns";
import { cn } from "../utils";
import { Breadcrumbs } from "./breadcrumbs";

type TBreadcrumbNavigationSearchDropdownProps = {
  icon?: React.ReactNode;
  title?: string;
  selectedItem: string;
  navigationItems: ICustomSearchSelectOption[];
  onChange?: (value: string) => void;
  navigationDisabled?: boolean;
  isLast?: boolean;
  handleOnClick?: () => void;
  disableRootHover?: boolean;
  shouldTruncate?: boolean;
};

export function BreadcrumbNavigationSearchDropdown(props: TBreadcrumbNavigationSearchDropdownProps) {
  const {
    icon,
    title,
    selectedItem,
    navigationItems,
    onChange,
    navigationDisabled = false,
    isLast = false,
    handleOnClick,
    shouldTruncate = false,
  } = props;
  // state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <CustomSearchSelect
      onOpen={() => {
        setIsDropdownOpen(true);
      }}
      onClose={() => {
        setIsDropdownOpen(false);
      }}
      options={navigationItems}
      value={selectedItem}
      onChange={(value: string) => {
        if (value !== selectedItem) {
          onChange?.(value);
        }
      }}
      customButton={
        <>
          <Tooltip tooltipContent={title} position="bottom">
            <button
              onClick={(e) => {
                if (!isLast) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOnClick?.();
                }
              }}
              className={cn(
                "group h-full flex items-center gap-2 px-1.5 py-1 text-13 font-medium text-tertiary cursor-pointer rounded-sm rounded-r-none",
                {
                  "hover:bg-layer-1 hover:text-primary": !isLast,
                }
              )}
            >
              {shouldTruncate && <div className="flex @4xl:hidden text-tertiary">...</div>}
              <div
                className={cn("flex gap-2", {
                  "hidden @4xl:flex gap-2 items-center": shouldTruncate,
                })}
              >
                {icon && <Breadcrumbs.Icon>{icon}</Breadcrumbs.Icon>}
                <Breadcrumbs.Label>{title}</Breadcrumbs.Label>
              </div>
            </button>
          </Tooltip>
          <Breadcrumbs.Separator
            className={cn("rounded-r-sm", {
              "bg-layer-1": isDropdownOpen && !isLast,
              "hover:bg-layer-1": !isLast,
            })}
            containerClassName="p-0"
            iconClassName={cn("group-hover:rotate-90 hover:text-primary", {
              "text-primary": isDropdownOpen,
              "rotate-90": isDropdownOpen || isLast,
            })}
            showDivider={!isLast}
          />
        </>
      }
      disabled={navigationDisabled}
      className="h-full rounded-sm"
      customButtonClassName={cn(
        "group flex items-center gap-0.5 rounded-sm hover:bg-surface-2 outline-none cursor-pointer h-full rounded-sm",
        {
          "bg-surface-2": isDropdownOpen,
        }
      )}
    />
  );
}
