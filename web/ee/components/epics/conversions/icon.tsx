"use client";
import React, { FC } from "react";
import { ArrowRight } from "lucide-react";
// plane imports
import { EWorkItemConversionType } from "@plane/constants";
import { EpicIcon, LayersIcon, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";

interface ConvertWorkItemIconProps {
  handleOnClick: () => void;
  conversionType: EWorkItemConversionType;
  disabled?: boolean;
}

export const ConvertWorkItemIcon: FC<ConvertWorkItemIconProps> = (props) => {
  const { handleOnClick, conversionType, disabled = false } = props;
  // derived values
  const IconComponent = conversionType === EWorkItemConversionType.WORK_ITEM ? LayersIcon : EpicIcon;
  const tooltipContent =
    conversionType === EWorkItemConversionType.WORK_ITEM ? "Convert to Work item" : "Convert to Epic";
  const commonIconClasses = "size-4 text-current";

  return (
    <Tooltip tooltipContent={tooltipContent}>
      <button
        type="button"
        className={cn(
          "flex items-center justify-center gap-[1px]",
          "text-custom-text-300 hover:text-custom-text-100",
          "hover:cursor-pointer",
          disabled && "cursor-not-allowed text-custom-text-400"
        )}
        onClick={handleOnClick}
        disabled={disabled}
        aria-label={tooltipContent}
      >
        <ArrowRight className={commonIconClasses} />
        <IconComponent className={commonIconClasses} />
      </button>
    </Tooltip>
  );
};
