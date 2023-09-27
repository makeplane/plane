import React from "react";
// lucide icons
import { Circle, ChevronDown, ChevronUp } from "lucide-react";

interface IHeaderSubGroupByCard {
  icon?: React.ReactNode;
  title: string;
}

export const HeaderSubGroupByCard = ({ icon, title }: IHeaderSubGroupByCard) => (
  <div className={`flex-shrink-0 relative flex gap-0.5 rounded-sm flex-row items-center w-full`}>
    <div className="flex-shrink-0 w-[24px] h-[24px] rounded-sm overflow-hidden flex justify-center items-center hover:bg-custom-background-80 cursor-pointer transition-all">
      <ChevronUp width={14} strokeWidth={2} />
      {/* <ChevronDown width={14} strokeWidth={2} /> */}
    </div>

    <div className="flex-shrink-0 w-[24px] h-[24px] rounded-sm overflow-hidden flex justify-center items-center hover:bg-custom-background-80 cursor-pointer transition-all">
      {icon ? icon : <Circle width={14} strokeWidth={2} />}
    </div>

    <div className="flex-shrink-0 flex items-center gap-1">
      <div className="font-medium line-clamp-1 text-lg">{title}</div>
      <div className="text-xs">(0)</div>
    </div>
  </div>
);
