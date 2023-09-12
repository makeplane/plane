import React from "react";
// lucide icons
import { Check } from "lucide-react";

interface IFilterCard {
  isChecked: boolean;
  icon?: React.ReactNode;
  title: string;
}

export const FilterCard = ({ isChecked, icon, title }: IFilterCard) => (
  <div className="flex items-center gap-3 cursor-pointer rounded-sm p-[6px] py-[5px] transition-all hover:bg-custom-border-100">
    <div
      className={`flex-shrink-0 w-[14px] h-[14px] flex justify-center items-center rounded-sm border border-custom-border-300 bg-custom-background-90 ${
        isChecked ? `bg-custom-primary-300 text-white` : ``
      }`}
    >
      {isChecked && <Check size={10} strokeWidth={2} />}
    </div>
    {icon}
    <div className="hyphens-auto line-clamp-2 text-custom-text-200 text-sm w-full">{title}</div>
  </div>
);
