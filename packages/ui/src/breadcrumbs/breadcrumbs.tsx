/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { ChevronRightIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "../utils";

type BreadcrumbsProps = {
  className?: string;
  children: React.ReactNode;
  onBack?: () => void;
  isLoading?: boolean;
};

export function BreadcrumbItemLoader() {
  return (
    <div className="flex h-7 animate-pulse items-center gap-2">
      <div className="group flex h-full items-center gap-2 rounded-sm px-2 py-1 text-13 font-medium">
        <span className="h-full w-5 rounded-sm bg-layer-1" />
        <span className="h-full w-16 rounded-sm bg-layer-1" />
      </div>
    </div>
  );
}

function Breadcrumbs({ className, children, onBack, isLoading = false }: BreadcrumbsProps) {
  const [isSmallScreen, setIsSmallScreen] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 640); // Adjust this value as per your requirement
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call it initially to set the correct state
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const childrenArray = React.Children.toArray(children);

  return (
    <div className={cn("flex flex-grow items-center gap-0.5 overflow-hidden", className)}>
      {!isSmallScreen && (
        <>
          {childrenArray.map((child, index) => {
            if (isLoading) {
              return (
                <>
                  <BreadcrumbItemLoader />
                </>
              );
            }
            if (React.isValidElement<BreadcrumbItemProps>(child)) {
              return React.cloneElement(child, {
                isLast: index === childrenArray.length - 1,
              });
            }
            return child;
          })}
        </>
      )}

      {isSmallScreen && childrenArray.length > 1 && (
        <>
          <div className="flex items-center gap-2.5 p-1">
            {onBack && (
              <span onClick={onBack} className="text-secondary">
                ...
              </span>
            )}
            <ChevronRightIcon className="h-3.5 w-3.5 flex-shrink-0 text-placeholder" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2.5 p-1">
            {isLoading ? (
              <BreadcrumbItemLoader />
            ) : React.isValidElement(childrenArray[childrenArray.length - 1]) ? (
              React.cloneElement(childrenArray[childrenArray.length - 1] as React.ReactElement, {
                isLast: true,
              })
            ) : (
              childrenArray[childrenArray.length - 1]
            )}
          </div>
        </>
      )}
      {isSmallScreen && childrenArray.length === 1 && childrenArray}
    </div>
  );
}

// breadcrumb item
type BreadcrumbItemProps = {
  component?: React.ReactNode;
  showSeparator?: boolean;
  isLast?: boolean;
};

function BreadcrumbItem(props: BreadcrumbItemProps) {
  const { component, showSeparator = true, isLast = false } = props;
  return (
    <div className="flex h-6 items-center gap-0.5">
      {component}
      {showSeparator && !isLast && <BreadcrumbSeparator />}
    </div>
  );
}

// breadcrumb icon
type BreadcrumbIconProps = {
  children: React.ReactNode;
  className?: string;
};

function BreadcrumbIcon(props: BreadcrumbIconProps) {
  const { children, className } = props;
  return <div className={cn("flex size-4 items-center justify-start overflow-hidden", className)}>{children}</div>;
}

// breadcrumb label
type BreadcrumbLabelProps = {
  children: React.ReactNode;
  className?: string;
};

function BreadcrumbLabel(props: BreadcrumbLabelProps) {
  const { children, className } = props;
  return (
    <div className={cn("relative line-clamp-1 block max-w-[150px] truncate overflow-hidden", className)}>
      {children}
    </div>
  );
}

// breadcrumb separator
type BreadcrumbSeparatorProps = {
  className?: string;
  containerClassName?: string;
  iconClassName?: string;
  showDivider?: boolean;
};

function BreadcrumbSeparator(props: BreadcrumbSeparatorProps) {
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
        <ChevronRightIcon className={cn("h-3.5 w-3.5 flex-shrink-0", iconClassName)} />
      </div>
    </div>
  );
}

// breadcrumb wrapper
type BreadcrumbItemWrapperProps = {
  label?: string;
  disableTooltip?: boolean;
  children: React.ReactNode;
  className?: string;
  type?: "link" | "text";
  isLast?: boolean;
};

function BreadcrumbItemWrapper(props: BreadcrumbItemWrapperProps) {
  const { label, disableTooltip = false, children, className, type = "link", isLast = false } = props;
  return (
    <Tooltip tooltipContent={label} position="bottom" disabled={!label || label === "" || disableTooltip}>
      <div
        className={cn(
          "group flex h-full cursor-default items-center gap-2 rounded-sm px-1.5 py-1 text-13 font-medium",
          {
            "text-primary": isLast,
            "text-tertiary": !isLast,
            "cursor-pointer hover:bg-layer-transparent-hover hover:text-primary": type === "link" && !isLast,
          },
          className
        )}
      >
        {children}
      </div>
    </Tooltip>
  );
}

Breadcrumbs.Item = BreadcrumbItem;
Breadcrumbs.Icon = BreadcrumbIcon;
Breadcrumbs.Label = BreadcrumbLabel;
Breadcrumbs.Separator = BreadcrumbSeparator;
Breadcrumbs.ItemWrapper = BreadcrumbItemWrapper;

export { Breadcrumbs, BreadcrumbItem, BreadcrumbIcon, BreadcrumbLabel, BreadcrumbSeparator, BreadcrumbItemWrapper };
