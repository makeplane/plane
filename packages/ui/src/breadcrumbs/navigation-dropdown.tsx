import { CheckIcon } from "lucide-react";
import * as React from "react";
// ui
import { Tooltip } from "@plane/propel/tooltip";
import type { TContextMenuItem } from "../dropdowns";
import { CustomMenu } from "../dropdowns";
import { cn } from "../utils";
import { Breadcrumbs } from "./breadcrumbs";

type TBreadcrumbNavigationDropdownProps = {
  selectedItemKey: string;
  navigationItems: TContextMenuItem[];
  navigationDisabled?: boolean;
  handleOnClick?: () => void;
  isLast?: boolean;
};

export function BreadcrumbNavigationDropdown(props: TBreadcrumbNavigationDropdownProps) {
  const { selectedItemKey, navigationItems, navigationDisabled = false, handleOnClick, isLast = false } = props;
  const [isOpen, setIsOpen] = React.useState(false);
  // derived values
  const selectedItem = navigationItems.find((item) => item.key === selectedItemKey);
  const selectedItemIcon = selectedItem?.icon ? (
    <selectedItem.icon className={cn("size-4", selectedItem.iconClassName)} />
  ) : undefined;

  // if no selected item, return null
  if (!selectedItem) return null;

  function NavigationButton() {
    return (
      <Tooltip tooltipContent={selectedItem?.title} position="bottom" disabled={isOpen}>
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
          <div className="flex @4xl:hidden text-tertiary">...</div>
          <div className="hidden @4xl:flex gap-2 items-center">
            {selectedItemIcon && <Breadcrumbs.Icon>{selectedItemIcon}</Breadcrumbs.Icon>}
            <Breadcrumbs.Label>{selectedItem?.title}</Breadcrumbs.Label>
          </div>
        </button>
      </Tooltip>
    );
  }

  if (navigationDisabled) {
    return <NavigationButton />;
  }

  return (
    <CustomMenu
      customButton={
        <>
          <NavigationButton />
          <Breadcrumbs.Separator
            className={cn("rounded-r-sm", {
              "bg-layer-1": isOpen && !isLast,
              "hover:bg-layer-1": !isLast,
            })}
            containerClassName="p-0"
            iconClassName={cn("group-hover:rotate-90 hover:text-primary", {
              "text-primary": isOpen,
              "rotate-90": isOpen || isLast,
            })}
            showDivider={!isLast}
          />
        </>
      }
      placement="bottom-start"
      className="h-full rounded-sm"
      customButtonClassName={cn(
        "group flex items-center gap-0.5 rounded-sm hover:bg-surface-2 outline-none cursor-pointer h-full rounded-sm",
        {
          "bg-surface-2": isOpen,
        }
      )}
      closeOnSelect
      menuButtonOnClick={() => {
        setIsOpen(!isOpen);
      }}
      onMenuClose={() => {
        setIsOpen(false);
      }}
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
                "text-placeholder": item.disabled,
              },
              item.className
            )}
            disabled={item.disabled}
          >
            {item.icon && <item.icon className={cn("size-4 flex-shrink-0", item.iconClassName)} />}
            <div className="w-full">
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
            {item.key === selectedItemKey && <CheckIcon className="flex-shrink-0 size-3.5" />}
          </CustomMenu.MenuItem>
        );
      })}
    </CustomMenu>
  );
}
