import React from "react";

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
    className={`flex w-full items-center justify-between gap-4 rounded-sm p-1 text-xs ${
      onClick ? "cursor-pointer hover:bg-custom-background-90" : ""
    } ${selected ? "bg-custom-background-90" : ""}`}
    onClick={onClick}
  >
    <div className="w-4/6">{title}</div>
    <div className="flex w-2/6 items-center justify-end gap-1 px-2">
      <div className="flex h-5 items-center justify-center gap-1">
        <span className="w-8 text-right">
          {isNaN(Math.round((completed / total) * 100)) ? "0" : Math.round((completed / total) * 100)}%
        </span>
      </div>
      <span>of {total}</span>
    </div>
  </div>
);
