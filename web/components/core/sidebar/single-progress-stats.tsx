import React from "react";

import { ProgressBar } from "@plane/ui";

type TSingleProgressStatsProps = {
  title: any;
  completed: number;
  total: number;
  onClick?: () => void;
  selected?: boolean;
};

export const SingleProgressStats: React.FC<TSingleProgressStatsProps> = ({
  title,
  completed,
  total,
  onClick,
  selected = false,
}) => (
  <div
    className={`flex w-full items-center gap-4 justify-between rounded-sm p-1 text-xs ${
      onClick ? "cursor-pointer hover:bg-custom-background-90" : ""
    } ${selected ? "bg-custom-background-90" : ""}`}
    onClick={onClick}
  >
    <div className="w-1/2">{title}</div>
    <div className="flex w-1/2 items-center justify-end gap-1 px-2">
      <div className="flex h-5 items-center justify-center gap-1">
        <span className="h-4 w-4">
          <ProgressBar value={completed} maxValue={total} />
        </span>
        <span className="w-8 text-right">
          {isNaN(Math.floor((completed / total) * 100)) ? "0" : Math.floor((completed / total) * 100)}%
        </span>
      </div>
      <span>of {total}</span>
    </div>
  </div>
);
