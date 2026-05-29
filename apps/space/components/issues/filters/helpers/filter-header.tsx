import React from "react";
// icons
import { ChevronDownIcon, ChevronUpIcon } from "@plane/propel/icons";

interface IFilterHeader {
  title: string;
  isPreviewEnabled: boolean;
  handleIsPreviewEnabled: () => void;
}

export function FilterHeader({ title, isPreviewEnabled, handleIsPreviewEnabled }: IFilterHeader) {
  return (
    <div className="sticky top-0 flex items-center justify-between gap-2">
      <div className="grow truncate text-11 font-medium text-tertiary">{title}</div>
      <button
        type="button"
        className="grid h-5 w-5 shrink-0 place-items-center rounded-sm hover:bg-layer-transparent-hover"
        onClick={handleIsPreviewEnabled}
      >
        {isPreviewEnabled ? <ChevronUpIcon height={14} width={14} /> : <ChevronDownIcon height={14} width={14} />}
      </button>
    </div>
  );
}
