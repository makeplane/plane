import React from "react";
// lucide icons
import { Plus, Minimize2, Maximize2, Circle } from "lucide-react";

interface IHeaderSubGroupByCard {
  icon?: React.ReactNode;
  title: string;
}

export const HeaderSubGroupByCard = ({ icon, title }: IHeaderSubGroupByCard) => {
  const position = false;

  return (
    <div
      className={`flex-shrink-0 relative flex gap-0.5 rounded-sm ${
        position
          ? `flex-col items-center w-[44px] border border-custom-border-100 bg-custom-background-80 shadow-custom-shadow-sm`
          : `flex-row items-center w-full`
      }`}
    >
      <div className="flex-shrink-0 w-[26px] h-[26px] rounded-sm overflow-hidden flex justify-center items-center hover:bg-custom-background-80 cursor-pointer transition-all">
        {icon ? icon : <Circle width={14} strokeWidth={2} />}
      </div>

      <div className={`capitalize flex items-center gap-1 ${position ? `flex-col` : `flex-row w-full`}`}>
        <div className={`font-medium line-clamp-1 ${position ? `vertical-lr` : ``}`}>{title}</div>
        <div className="text-xs">(0)</div>
      </div>
    </div>
  );
};
