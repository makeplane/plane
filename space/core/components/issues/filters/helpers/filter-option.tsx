"use client";

import React from "react";
// lucide icons
import { Check } from "lucide-react";

type Props = {
  icon?: React.ReactNode;
  isChecked: boolean;
  title: React.ReactNode;
  onClick?: () => void;
  multiple?: boolean;
};

export const FilterOption: React.FC<Props> = (props) => {
  const { icon, isChecked, multiple = true, onClick, title } = props;

  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded p-1.5 hover:bg-custom-background-80"
      onClick={onClick}
    >
      <div
        className={`grid h-3 w-3 flex-shrink-0 place-items-center border bg-custom-background-90 ${
          isChecked ? "border-custom-primary-100 bg-custom-primary-100 text-white" : "border-custom-border-300"
        } ${multiple ? "rounded-sm" : "rounded-full"}`}
      >
        {isChecked && <Check size={10} strokeWidth={3} />}
      </div>
      <div className="flex items-center gap-2 truncate">
        {icon && <div className="grid w-5 flex-shrink-0 place-items-center">{icon}</div>}
        <div className="flex-grow truncate text-xs text-custom-text-200">{title}</div>
      </div>
    </button>
  );
};
