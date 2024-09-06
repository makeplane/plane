"use client";
import React, { FC } from "react";
// ui
import { ControlLink, Row, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";

interface IListItemProps {
  title: string;
  itemLink: string;
  onItemClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  prependTitleElement?: JSX.Element;
  appendTitleElement?: JSX.Element;
  actionableItems?: JSX.Element;
  isMobile?: boolean;
  parentRef: React.RefObject<HTMLDivElement>;
  disableLink?: boolean;
  className?: string;
  actionItemContainerClassName?: string;
  isSidebarOpen?: boolean;
  quickActionElement?: JSX.Element;
}

export const ListItem: FC<IListItemProps> = (props) => {
  const {
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
          "group min-h-[52px] flex w-full flex-col items-center justify-between gap-3 py-4 text-sm border-b border-custom-border-200 bg-custom-background-100 hover:bg-custom-background-90 ",
          {
            "xl:gap-5 xl:py-0 xl:flex-row": isSidebarOpen,
            "lg:gap-5 lg:py-0 lg:flex-row": !isSidebarOpen,
          },
          className
        )}
      >
        <div className="relative flex w-full items-center justify-between gap-3 overflow-hidden">
          <ControlLink
            className="relative flex w-full items-center gap-3 overflow-hidden"
            href={itemLink}
            target="_self"
            onClick={handleControlLinkClick}
            disabled={disableLink}
          >
            <div className="flex items-center gap-4 truncate">
              {prependTitleElement && <span className="flex items-center flex-shrink-0">{prependTitleElement}</span>}
              <Tooltip tooltipContent={title} position="top" isMobile={isMobile}>
                <span className="truncate text-sm">{title}</span>
              </Tooltip>
            </div>
            {appendTitleElement && <span className="flex items-center flex-shrink-0">{appendTitleElement}</span>}
          </ControlLink>
          {quickActionElement && quickActionElement}
        </div>
        {actionableItems && (
          <div
            className={cn(
              "relative flex items-center justify-start gap-4 flex-wrap w-full",
              {
                "xl:flex-nowrap xl:w-auto xl:flex-shrink-0": isSidebarOpen,
                "lg:flex-nowrap lg:w-auto lg:flex-shrink-0": !isSidebarOpen,
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
};
