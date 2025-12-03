import type { FC } from "react";
import React from "react";
import { observer } from "mobx-react";
import { Circle } from "lucide-react";
import { ChevronDownIcon, ChevronUpIcon } from "@plane/propel/icons";
// Plane
import type { TIssueGroupByOptions, TIssueKanbanFilters } from "@plane/types";
// Plane-web
import { WorkFlowGroupTree } from "@/plane-web/components/workflow";
// mobx

interface IHeaderSubGroupByCard {
  icon?: React.ReactNode;
  title: string;
  count: number;
  column_id: string;
  collapsedGroups: TIssueKanbanFilters;
  sub_group_by: TIssueGroupByOptions | undefined;
  handleCollapsedGroups: (toggle: "group_by" | "sub_group_by", value: string) => void;
}

export const HeaderSubGroupByCard = observer(function HeaderSubGroupByCard(props: IHeaderSubGroupByCard) {
  const { icon, title, count, column_id, collapsedGroups, sub_group_by, handleCollapsedGroups } = props;
  return (
    <div
      className={`relative flex w-full flex-shrink-0 flex-row items-center gap-1 rounded-xs py-1.5 cursor-pointer`}
      onClick={() => handleCollapsedGroups("sub_group_by", column_id)}
    >
      <div className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center overflow-hidden rounded-xs transition-all hover:bg-layer-1">
        {collapsedGroups?.sub_group_by.includes(column_id) ? (
          <ChevronDownIcon width={14} strokeWidth={2} />
        ) : (
          <ChevronUpIcon width={14} strokeWidth={2} />
        )}
      </div>

      <div className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center overflow-hidden rounded-xs">
        {icon ? icon : <Circle width={14} strokeWidth={2} />}
      </div>

      <div className="flex flex-shrink-0 items-center gap-1 text-13">
        <div className="line-clamp-1 text-primary">{title}</div>
        <div className="pl-2 text-13 font-medium text-tertiary">{count || 0}</div>
      </div>

      <WorkFlowGroupTree groupBy={sub_group_by} groupId={column_id} />
    </div>
  );
});
