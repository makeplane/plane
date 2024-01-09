import React from "react";
import { Circle, ChevronDown, ChevronUp } from "lucide-react";
// mobx
import { observer } from "mobx-react-lite";
import { TIssueKanbanFilters } from "@plane/types";

interface IHeaderSubGroupByCard {
  icon?: React.ReactNode;
  title: string;
  count: number;
  column_id: string;
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: (toggle: "group_by" | "sub_group_by", value: string) => void;
}

export const HeaderSubGroupByCard = observer(
  ({ icon, title, count, column_id, kanbanFilters, handleKanbanFilters }: IHeaderSubGroupByCard) => (
    <div className={`relative flex w-full flex-shrink-0 flex-row items-center gap-2 rounded-sm p-1.5`}>
      <div
        className="flex h-[20px] w-[20px] flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-all hover:bg-custom-background-80"
        onClick={() => handleKanbanFilters("sub_group_by", column_id)}
      >
        {kanbanFilters?.sub_group_by.includes(column_id) ? (
          <ChevronDown width={14} strokeWidth={2} />
        ) : (
          <ChevronUp width={14} strokeWidth={2} />
        )}
      </div>

      <div className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center overflow-hidden rounded-sm">
        {icon ? icon : <Circle width={14} strokeWidth={2} />}
      </div>

      <div className="flex flex-shrink-0 items-center gap-1 text-sm">
        <div className="line-clamp-1 text-custom-text-100">{title}</div>
        <div className="pl-2 text-sm font-medium text-custom-text-300">{count || 0}</div>
      </div>
    </div>
  )
);
