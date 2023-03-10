import React from "react";

import { ProgressBar } from "components/ui";

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
    className={`flex w-full items-center justify-between py-3 text-xs ${
      onClick ? "cursor-pointer hover:bg-gray-100" : ""
    } ${selected ? "bg-gray-100" : ""}`}
    onClick={onClick}
  >
    <div className="flex w-1/2 items-center justify-start gap-2">{title}</div>
    <div className="flex w-1/2 items-center justify-end gap-1 px-2">
      <div className="flex h-5 items-center justify-center gap-1 ">
        <span className="h-4 w-4 ">
          <ProgressBar value={completed} maxValue={total} />
        </span>
        <span className="w-8 text-right">{Math.floor((completed / total) * 100)}%</span>
      </div>
      <span>of</span>
      <span>{total}</span>
    </div>
  </div>
);
