import * as React from "react";
import { useState } from "react";
import { ICustomSearchSelectOption } from "@plane/types";
import { cn } from "../../helpers";
import { CustomSearchSelect } from "../dropdowns";
import { Tooltip } from "../tooltip";
import { Breadcrumbs } from "./breadcrumbs";

type TBreadcrumbNavigationSearchDropdownProps = {
  icon?: React.JSX.Element;
  title?: string;
  selectedItem: string;
  navigationItems: ICustomSearchSelectOption[];
  onChange?: (value: string) => void;
  navigationDisabled?: boolean;
  isLast?: boolean;
  handleOnClick?: () => void;
  disableRootHover?: boolean;
};

export const BreadcrumbNavigationSearchDropdown: React.FC<TBreadcrumbNavigationSearchDropdownProps> = (props) => {
  const {
    icon,
    title,
    selectedItem,
    navigationItems,
    onChange,
    navigationDisabled = false,
    isLast = false,
    handleOnClick,
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
                "group h-full flex items-center gap-2 px-1.5 py-1 text-sm font-medium text-custom-text-300 cursor-pointer rounded rounded-r-none",
                {
                  "hover:bg-custom-background-80 hover:text-custom-text-100": !isLast,
                }
              )}
            >
              {icon && <Breadcrumbs.Icon>{icon}</Breadcrumbs.Icon>}
              <Breadcrumbs.Label>{title}</Breadcrumbs.Label>
            </button>
          </Tooltip>
          <Breadcrumbs.Separator
            className={cn("rounded-r", {
              "bg-custom-background-80": isDropdownOpen && !isLast,
              "hover:bg-custom-background-80": !isLast,
            })}
            containerClassName="p-0"
            iconClassName={cn("group-hover:rotate-90 hover:text-custom-text-100", {
              "text-custom-text-100": isDropdownOpen,
              "rotate-90": isDropdownOpen || isLast,
            })}
            showDivider={!isLast}
          />
        </>
      }
      disabled={navigationDisabled}
      className="h-full rounded"
      customButtonClassName={cn(
        "group flex items-center gap-0.5 rounded hover:bg-custom-background-90 outline-none cursor-pointer h-full rounded",
        {
          "bg-custom-background-90": isDropdownOpen,
        }
      )}
    />
  );
};
