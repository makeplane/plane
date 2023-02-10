import React from "react";

import { CircularProgressbar } from "react-circular-progressbar";

type TSingleProgressStatsProps = {
  title: any;
  completed: number;
  total: number;
};

export const SingleProgressStats: React.FC<TSingleProgressStatsProps> = ({
  title,
  completed,
  total,
}) => (
  <div className="flex items-center justify-between w-full py-3 text-xs border-b-[1px] border-gray-200">
    <div className="flex items-center justify-start w-1/2 gap-2">{title}</div>
    <div className="flex items-center justify-end w-1/2 gap-1 px-2">
      <div className="flex h-5 justify-center items-center gap-1 ">
        <span className="h-4 w-4 ">
          <CircularProgressbar value={completed} maxValue={total} strokeWidth={10} />
        </span>
        <span className="w-8 text-right">{Math.floor((completed / total) * 100)}%</span>
      </div>
      <span>of</span>
      <span>{total}</span>
    </div>
  </div>
);
