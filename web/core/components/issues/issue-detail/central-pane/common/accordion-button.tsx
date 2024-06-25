import React, { FC } from "react";
import { ChevronDown } from "lucide-react";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  isOpen: boolean;
  title: string;
  hideChevron?: boolean;
  indicatorElement?: React.ReactNode;
  actionItemElement?: React.ReactNode;
};

export const AccordionButton: FC<Props> = (props) => {
  const { isOpen, title, hideChevron = false, indicatorElement, actionItemElement } = props;
  return (
    <div className="flex items-center justify-between gap-3 h-12 px-1.5 py-3">
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-3">
          {!hideChevron && (
            <ChevronDown
              className={cn("size-4 text-custom-text-300 hover:text-custom-text-400 duration-300", {
                "-rotate-180 ": isOpen,
              })}
            />
          )}
          <span className="text-base text-custom-text-100 font-medium">{title}</span>
        </div>
        {indicatorElement && indicatorElement}
      </div>
      {actionItemElement && isOpen && actionItemElement}
    </div>
  );
};
