/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
      className={`flex w-full items-center justify-between gap-4 rounded-xs p-1 text-body-xs-regular ${
        onClick ? "cursor-pointer hover:bg-surface-2" : ""
      } ${selected ? "bg-layer-1" : ""}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="min-w-0 flex-1">{title}</div>
      <div className="flex shrink-0 items-center justify-end gap-1 px-2 whitespace-nowrap tabular-nums">
        <span>{isNaN(Math.round((completed / total) * 100)) ? "0" : Math.round((completed / total) * 100)}%</span>
        <span>of {total}</span>
      </div>
    </div>
  );
}
