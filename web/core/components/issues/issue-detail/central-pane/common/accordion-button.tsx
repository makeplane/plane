import React, { FC } from "react";
import { ChevronRight } from "lucide-react";
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
    <div className="flex items-center justify-between gap-3 h-12 px-2.5 py-3 border-b border-custom-border-100">
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-3">
          {!hideChevron && (
            <ChevronRight
              className={cn("size-4 text-custom-text-300 hover:text-custom-text-400 duration-300", {
                "rotate-90 ": isOpen,
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
