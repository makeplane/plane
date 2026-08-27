/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
// plane internal packages
import { ChevronRightIcon } from "@plane/propel/icons";
// helpers
import { cn } from "@plane/utils";

type BreadcrumbsProps = {
  className?: string;
  children: React.ReactNode;
};

function BreadcrumbsRoot({ className, children }: BreadcrumbsProps) {
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
            <ChevronRightIcon className="h-3.5 w-3.5 flex-shrink-0 text-placeholder" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2.5 p-1">
            {React.isValidElement(childrenArray[childrenArray.length - 1])
              ? React.cloneElement(childrenArray[childrenArray.length - 1] as React.ReactElement<BreadcrumbItemProps>, {
                  isLast: true,
                })
              : childrenArray[childrenArray.length - 1]}
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

// breadcrumb separator
type BreadcrumbSeparatorProps = {
  className?: string;
  containerClassName?: string;
  iconClassName?: string;
};

function BreadcrumbSeparator(props: BreadcrumbSeparatorProps) {
  const { className, containerClassName, iconClassName } = props;
  return (
    <div className={cn("relative flex h-full items-center justify-center px-1.5 py-1", className)}>
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

const Breadcrumbs = Object.assign(BreadcrumbsRoot, {
  Item: BreadcrumbItem,
  Separator: BreadcrumbSeparator,
});

export { Breadcrumbs };
