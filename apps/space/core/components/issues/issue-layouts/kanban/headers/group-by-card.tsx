"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { Circle } from "lucide-react";
// types
import { TIssueGroupByOptions } from "@plane/types";

interface IHeaderGroupByCard {
  groupBy: TIssueGroupByOptions | undefined;
  icon?: React.ReactNode;
  title: string;
  count: number;
}

export const HeaderGroupByCard: FC<IHeaderGroupByCard> = observer((props) => {
  const { icon, title, count } = props;

  return (
    <>
      <div className={`relative flex flex-shrink-0 gap-2 p-1.5 w-full flex-row items-center`}>
        <div className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center overflow-hidden rounded-sm">
          {icon ? icon : <Circle width={14} strokeWidth={2} />}
        </div>

        <div className={`relative flex items-center gap-1 w-full flex-row overflow-hidden`}>
          <div className={`line-clamp-1 inline-block overflow-hidden truncate font-medium text-custom-text-100`}>
            {title}
          </div>
          <div className={`flex-shrink-0 text-sm font-medium text-custom-text-300 pl-2`}>{count || 0}</div>
        </div>
      </div>
    </>
  );
});
