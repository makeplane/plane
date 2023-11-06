import React from "react";
// lucide icons
import { Circle, ChevronDown, ChevronUp } from "lucide-react";
// mobx
import { observer } from "mobx-react-lite";

interface IHeaderSubGroupByCard {
  icon?: React.ReactNode;
  title: string;
  count: number;
  column_id: string;
  kanBanToggle: any;
  handleKanBanToggle: any;
}

export const HeaderSubGroupByCard = observer(
  ({ icon, title, count, column_id, kanBanToggle, handleKanBanToggle }: IHeaderSubGroupByCard) => (
    <div className={`flex-shrink-0 relative flex gap-2 rounded-sm flex-row items-center w-full p-1.5`}>
      <div
        className="flex-shrink-0 w-[20px] h-[20px] rounded-sm overflow-hidden flex justify-center items-center hover:bg-custom-background-80 cursor-pointer transition-all"
        onClick={() => handleKanBanToggle("subgroupByIssuesVisibility", column_id)}
      >
        {kanBanToggle?.subgroupByIssuesVisibility.includes(column_id) ? (
          <ChevronDown width={14} strokeWidth={2} />
        ) : (
          <ChevronUp width={14} strokeWidth={2} />
        )}
      </div>

      <div className="flex-shrink-0 w-[20px] h-[20px] rounded-sm overflow-hidden flex justify-center items-center">
        {icon ? icon : <Circle width={14} strokeWidth={2} />}
      </div>

      <div className="flex-shrink-0 flex items-center gap-1 text-sm">
        <div className="line-clamp-1 text-custom-text-100">{title}</div>
        <div className="pl-2 text-sm font-medium text-custom-text-300">{count || 0}</div>
      </div>
    </div>
  )
);
