"use client";

import { FC } from "react";
import { ChevronRight } from "lucide-react";
// ui
import { PlaneAIIcon } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";

type TDeDupeIssueButtonLabelProps = {
  isOpen: boolean;
  buttonLabel: string;
};

export const DeDupeIssueButtonLabel: FC<TDeDupeIssueButtonLabelProps> = (props) => {
  const { isOpen, buttonLabel } = props;
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-0.5 h-6 p-1 rounded border border-transparent bg-custom-primary-100/10 shadow-sm",
        {
          "border-custom-primary-100/10 shadow-md": isOpen,
        }
      )}
    >
      <div className="flex-shrink-0 mt-1">
        <PlaneAIIcon className="size-4" />
      </div>
      <span className="flex items-baseline">
        <p className="text-sm text-custom-text-200">{buttonLabel}</p>
      </span>
      <ChevronRight className="size-4 text-custom-text-400" />
    </div>
  );
};
