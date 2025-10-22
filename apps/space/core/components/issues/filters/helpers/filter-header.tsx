"use client";
import React from "react";
// icons
import { ChevronDownIcon, ChevronUpIcon } from "@plane/propel/icons";

interface IFilterHeader {
  title: string;
  isPreviewEnabled: boolean;
  handleIsPreviewEnabled: () => void;
}

export const FilterHeader = ({ title, isPreviewEnabled, handleIsPreviewEnabled }: IFilterHeader) => (
  <div className="sticky top-0 flex items-center justify-between gap-2 bg-custom-background-100">
    <div className="flex-grow truncate text-xs font-medium text-custom-text-300">{title}</div>
    <button
      type="button"
      className="grid h-5 w-5 flex-shrink-0 place-items-center rounded hover:bg-custom-background-80"
      onClick={handleIsPreviewEnabled}
    >
      {isPreviewEnabled ? <ChevronUpIcon height={14} width={14} /> : <ChevronDownIcon height={14} width={14} />}
    </button>
  </div>
);
