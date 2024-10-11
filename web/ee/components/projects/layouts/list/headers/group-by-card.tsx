"use client";

import { observer } from "mobx-react";
import { CircleDashed } from "lucide-react";

interface IHeaderGroupByCard {
  groupID: string;
  icon?: React.ReactNode;
  title: string;
  count: number;
  toggleListGroup: (id: string) => void;
}

export const HeaderGroupByCard = observer((props: IHeaderGroupByCard) => {
  const { groupID, icon, title, count, toggleListGroup } = props;

  return (
    <>
      <div
        className="group/list-header relative w-full flex-shrink-0 flex items-center gap-2 py-1.5"
        onClick={() => toggleListGroup(groupID)}
      >
        <div className="flex-shrink-0 grid place-items-center overflow-hidden">
          {icon ?? <CircleDashed className="size-3.5" strokeWidth={2} />}
        </div>

        <div className="relative flex w-full flex-row items-center gap-1 overflow-hidden cursor-pointer">
          <div className="inline-block line-clamp-1 truncate font-medium text-custom-text-100">{title}</div>
          <div className="pl-2 text-sm font-medium text-custom-text-300">{count || 0}</div>
        </div>
      </div>
    </>
  );
});
