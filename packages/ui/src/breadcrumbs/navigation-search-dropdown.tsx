/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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

  // The navigation button and the dropdown trigger are SIBLINGS, never nested:
  // CustomSearchSelect always wraps `customButton` in a <button>, so passing another
  // <button> in there produced `<button> cannot appear as a descendant of <button>`.
  // Keeping them side by side also gives each action its own keyboard-reachable control.
  return (
    <div
      className={cn("group flex h-full items-center gap-0.5 rounded-sm hover:bg-surface-2", {
        "bg-surface-2": isDropdownOpen,
      })}
    >
      <Tooltip tooltipContent={title} position="bottom">
        <button
          type="button"
          onClick={() => {
            if (!isLast) handleOnClick?.();
          }}
          className={cn(
            "flex h-full cursor-pointer items-center gap-2 rounded-sm rounded-r-none px-1.5 py-1 text-13 font-medium text-tertiary",
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
            {icon && <Breadcrumbs.Icon>{icon}</Breadcrumbs.Icon>}
            <Breadcrumbs.Label>{title}</Breadcrumbs.Label>
          </div>
        </button>
      </Tooltip>
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
        }
        disabled={navigationDisabled}
        className="h-full rounded-sm"
        customButtonClassName="flex h-full w-auto cursor-pointer items-center rounded-sm rounded-l-none outline-none"
      />
    </div>
  );
}
