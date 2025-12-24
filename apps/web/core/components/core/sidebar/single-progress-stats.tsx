import React from "react";

type TSingleProgressStatsProps = {
  title: any;
  completed: number;
  total: number;
  onClick?: () => void;
  selected?: boolean;
};

export function SingleProgressStats({ title, completed, total, onClick, selected = false }: TSingleProgressStatsProps) {
  return (
    <div
      className={`flex w-full items-center justify-between gap-4 rounded-xs p-1 text-11 ${
        onClick ? "cursor-pointer hover:bg-surface-2" : ""
      } ${selected ? "bg-layer-1" : ""}`}
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
}
