import React from "react";
// lucide icons
import { ChevronDown, ChevronUp } from "lucide-react";

interface IFilterHeader {
  title: string;
  isPreviewEnabled: boolean;
  handleIsPreviewEnabled: () => void;
}

export const FilterHeader = ({ title, isPreviewEnabled, handleIsPreviewEnabled }: IFilterHeader) => (
  <div className="flex items-center justify-between gap-2 bg-custom-background-100 sticky top-0">
    <div className="text-custom-text-300 text-xs font-medium flex-grow truncate">{title}</div>
    <button
      type="button"
      className="flex-shrink-0 w-5 h-5 grid place-items-center rounded hover:bg-custom-background-80"
      onClick={handleIsPreviewEnabled}
    >
      {isPreviewEnabled ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
  </div>
);
