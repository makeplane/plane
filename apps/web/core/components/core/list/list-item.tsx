/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// ui
import { Tooltip } from "@plane/propel/tooltip";
import { ControlLink, Row } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";

interface IListItemProps {
  id?: string;
  title: string;
  itemLink: string;
  onItemClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  prependTitleElement?: React.ReactNode;
  appendTitleElement?: React.ReactNode;
  actionableItems?: React.ReactNode;
  isMobile?: boolean;
  parentRef: React.RefObject<HTMLDivElement>;
  disableLink?: boolean;
  className?: string;
  itemClassName?: string;
  actionItemContainerClassName?: string;
  isSidebarOpen?: boolean;
  quickActionElement?: React.ReactNode;
  preventDefaultProgress?: boolean;
  leftElementClassName?: string;
  rightElementClassName?: string;
}

export function ListItem(props: IListItemProps) {
  const {
    id,
    title,
    prependTitleElement,
    appendTitleElement,
    actionableItems,
    itemLink,
    onItemClick,
    isMobile = false,
    parentRef,
    disableLink = false,
    className = "",
    actionItemContainerClassName = "",
    isSidebarOpen = false,
    quickActionElement,
    itemClassName = "",
    preventDefaultProgress = false,
    leftElementClassName = "",
    rightElementClassName = "",
  } = props;

  // router
  const router = useAppRouter();

  // handlers
  const handleControlLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onItemClick) onItemClick(e);
    else router.push(itemLink);
  };

  return (
    <div ref={parentRef} className="relative">
      <Row
        className={cn(
          "group flex min-h-[52px] w-full flex-col items-center justify-between gap-3 border-b border-subtle bg-layer-transparent py-4 text-13 hover:bg-layer-transparent-hover",
          { "xl:flex-row xl:gap-5 xl:py-0": isSidebarOpen, "lg:flex-row lg:gap-5 lg:py-0": !isSidebarOpen },
          className
        )}
      >
        <div className={cn("relative flex w-full items-center justify-between gap-3 truncate", itemClassName)}>
          <ControlLink
            id={id}
            className="relative flex w-full items-center gap-3 overflow-hidden"
            href={itemLink}
            target="_self"
            onClick={handleControlLinkClick}
            disabled={disableLink}
            data-prevent-progress={preventDefaultProgress}
          >
            <div className={cn("flex items-center gap-4 truncate", leftElementClassName)}>
              {prependTitleElement && <span className="flex flex-shrink-0 items-center">{prependTitleElement}</span>}
              <Tooltip tooltipContent={title} position="top" isMobile={isMobile}>
                <span className="truncate text-13">{title}</span>
              </Tooltip>
            </div>
            {appendTitleElement && (
              <span className={cn("flex flex-shrink-0 items-center", rightElementClassName)}>{appendTitleElement}</span>
            )}
          </ControlLink>
          {quickActionElement && quickActionElement}
        </div>
        {actionableItems && (
          <div
            className={cn(
              "relative flex w-full flex-shrink-0 flex-wrap items-center justify-start gap-4",
              {
                "xl:w-auto xl:flex-shrink-0 xl:flex-nowrap": isSidebarOpen,
                "lg:w-auto lg:flex-shrink-0 lg:flex-nowrap": !isSidebarOpen,
              },
              actionItemContainerClassName
            )}
          >
            {actionableItems}
          </div>
        )}
      </Row>
    </div>
  );
}
