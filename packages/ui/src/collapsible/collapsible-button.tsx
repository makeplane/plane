import type { FC } from "react";
import React from "react";
import type { ISvgIcons } from "@plane/propel/icons";
import { DropdownIcon } from "@plane/propel/icons";
import { cn } from "../utils";

type Props = {
  isOpen: boolean;
  title: React.ReactNode;
  hideChevron?: boolean;
  indicatorElement?: React.ReactNode;
  actionItemElement?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  ChevronIcon?: React.FC<ISvgIcons>;
};

export function CollapsibleButton(props: Props) {
  const {
    isOpen,
    title,
    hideChevron = false,
    indicatorElement,
    actionItemElement,
    className = "",
    titleClassName = "",
    ChevronIcon = DropdownIcon,
  } = props;
  return (
    <div className={cn("flex items-center justify-between gap-3 h-12 px-2.5 py-3 border-b border-subtle", className)}>
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-3">
          {!hideChevron && (
            <ChevronIcon
              className={cn("size-2 text-tertiary hover:text-secondary duration-300", {
                "-rotate-90": !isOpen,
              })}
            />
          )}
          <span className={cn("text-14 text-primary font-medium", titleClassName)}>{title}</span>
        </div>
        {indicatorElement && indicatorElement}
      </div>
      {actionItemElement && isOpen && actionItemElement}
    </div>
  );
}
