import React from "react";
// lucide icons
import { ChevronDown, ChevronUp } from "lucide-react";

interface IFilterHeader {
  title: string;
  isPreviewEnabled: boolean;
  handleIsPreviewEnabled: (isPreviewEnabled: boolean) => void;
}

export const FilterHeader = ({
  title,
  isPreviewEnabled,
  handleIsPreviewEnabled,
}: IFilterHeader) => (
  <div className="flex items-center justify-between gap-2 p-[6px] pb-2 bg-custom-background-80 sticky top-0">
    <div className="text-gray-500 text-sm text-custom-text-300 font-medium">{title}</div>
    <div
      className="flex-shrink-0 w-[20px] h-[20px] flex justify-center items-center rounded-sm transition-all hover:bg-custom-border-100 cursor-pointer"
      onClick={() => handleIsPreviewEnabled(!isPreviewEnabled)}
    >
      {isPreviewEnabled ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </div>
  </div>
);
