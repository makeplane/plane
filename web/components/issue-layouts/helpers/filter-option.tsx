import React from "react";
// lucide icons
import { Check } from "lucide-react";

interface IFilterOption {
  isChecked: boolean;
  icon?: React.ReactNode;
  title: string;
  multiple?: boolean;
}

export const FilterOption = ({ isChecked, icon, title, multiple = true }: IFilterOption) => (
  <div className="flex items-center gap-3 cursor-pointer rounded p-[6px] py-[5px] transition-all hover:bg-custom-border-100">
    <div
      className={`flex-shrink-0 w-[14px] h-[14px] flex justify-center items-center border border-custom-border-300 bg-custom-background-90 ${
        isChecked ? `bg-custom-primary-300 text-white` : ``
      } ${multiple ? `rounded-sm` : `rounded-full`}`}
    >
      {isChecked && <Check size={10} strokeWidth={2} />}
    </div>
    {icon}
    <div className="hyphens-auto line-clamp-1 text-custom-text-200 text-xs w-full">{title}</div>
  </div>
);
