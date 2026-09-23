/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { useState } from "react";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { ChevronRightOutline } from "@makeplane/propel/icons";
import type { ICustomSearchSelectOption } from "@plane/types";
import { CustomSearchSelect } from "../dropdowns/custom-search-select";
import { cn } from "@plane/utils";

// Legacy crumb parts, kept local to this dropdown until it is replaced by `BreadcrumbNavigationSelect`
// from `@plane/blocks/breadcrumb`. The `Breadcrumbs` compound itself lives there now.
function CrumbIcon({ children }: { children: React.ReactNode }) {
  return <div className="flex size-4 items-center justify-start overflow-hidden">{children}</div>;
}

function CrumbLabel({ children }: { children: React.ReactNode }) {
  return <div className="relative line-clamp-1 block max-w-[150px] truncate overflow-hidden">{children}</div>;
}

type TCrumbChevronProps = {
  className?: string;
  containerClassName?: string;
  iconClassName?: string;
  showDivider?: boolean;
};

function CrumbChevron(props: TCrumbChevronProps) {
  const { className, containerClassName, iconClassName, showDivider = false } = props;
  return (
    <div className={cn("relative flex h-full items-center justify-center px-1.5 py-1", className)}>
      {showDivider && <span className="absolute top-0 -left-0.5 h-full w-[1.8px] bg-surface-1" />}
      <div
        className={cn(
          "flex flex-shrink-0 items-center justify-center rounded-sm text-placeholder transition-all",
          containerClassName
        )}
      >
        <ChevronRightOutline className={cn("h-3.5 w-3.5 flex-shrink-0", iconClassName)} />
      </div>
    </div>
  );
}

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
          <Tooltip label={title ?? ""} side="bottom" disabled={!title}>
            <button
              onClick={(e) => {
                if (!isLast) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOnClick?.();
                }
              }}
              className={cn(
                "group flex h-full cursor-pointer items-center gap-2 rounded-sm rounded-r-none px-1.5 py-1 text-13 font-medium text-tertiary",
                {
                  "hover:bg-layer-1 hover:text-primary": !isLast,
                }
              )}
            >
              {shouldTruncate && <div className="flex text-tertiary @4xl:hidden">...</div>}
              <div
                className={cn("flex gap-2", {
                  "hidden items-center gap-2 @4xl:flex": shouldTruncate,
                })}
              >
                {icon && <CrumbIcon>{icon}</CrumbIcon>}
                <CrumbLabel>{title}</CrumbLabel>
              </div>
            </button>
          </Tooltip>
          <CrumbChevron
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
        "group flex h-full cursor-pointer items-center gap-0.5 rounded-sm outline-none hover:bg-surface-2",
        {
          "bg-surface-2": isDropdownOpen,
        }
      )}
    />
  );
}
