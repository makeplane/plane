import React, { FC } from "react";
import { useRouter } from "next/router";
// ui
import { ControlLink, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";

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
  } = props;

  // router
  const router = useRouter();

  // handlers
  const handleControlLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onItemClick) onItemClick(e);
    else router.push(itemLink);
  };

  return (
    <div ref={parentRef} className="relative">
      <ControlLink href={itemLink} onClick={handleControlLinkClick} disabled={disableLink}>
        <div
          className={cn(
            "group h-24 sm:h-[52px] flex w-full flex-col items-center justify-between gap-3 sm:gap-5 px-6 py-4 sm:py-0 text-sm border-b border-custom-border-200 bg-custom-background-100 hover:bg-custom-background-90 sm:flex-row",
            className
          )}
        >
          <div className="relative flex w-full items-center justify-between gap-3 overflow-hidden">
            <div className="relative flex w-full items-center gap-3 overflow-hidden">
              <div className="flex items-center gap-4 truncate">
                {prependTitleElement && <span className="flex items-center flex-shrink-0">{prependTitleElement}</span>}
                <Tooltip tooltipContent={title} position="top" isMobile={isMobile}>
                  <span className="truncate text-sm">{title}</span>
                </Tooltip>
              </div>
              {appendTitleElement && <span className="flex items-center flex-shrink-0">{appendTitleElement}</span>}
            </div>
          </div>
          <span className="h-6 w-96 flex-shrink-0" />
        </div>
      </ControlLink>
      {actionableItems && (
        <div className="absolute right-5 bottom-4 flex items-center gap-1.5">
          <div className="relative flex items-center gap-4 sm:w-auto sm:flex-shrink-0 sm:justify-end">
            {actionableItems}
          </div>
        </div>
      )}
    </div>
  );
};
