import React from "react";
// lucide icons
import { ChevronDown, ChevronUp } from "lucide-react";

interface IFilterHeader {
  title: string;
  isPreviewEnabled: boolean;
  handleIsPreviewEnabled: () => void;
}

export const FilterHeader = ({ title, isPreviewEnabled, handleIsPreviewEnabled }: IFilterHeader) => (
  <div className="sticky top-0 flex items-center justify-between gap-2 bg-custom-background-100">
    <div className="flex-grow truncate text-xs font-medium text-custom-text-400">{title}</div>
    <button
      type="button"
      className="grid h-5 w-5 flex-shrink-0 place-items-center rounded hover:bg-custom-background-80"
      onClick={handleIsPreviewEnabled}
    >
      {isPreviewEnabled ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
  </div>
);
