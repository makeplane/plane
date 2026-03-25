/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import useSWR from "swr";
import { Tooltip } from "@plane/propel/tooltip";
import { UserWorklogService } from "@/plane-web/services/user-worklog.service";

const userWorklogService = new UserWorklogService();

const MAX_MINUTES = 720; // 12 hours
const CIRCUMFERENCE = 97.4; // 2π × r where r = 15.5

function getProgressColor(totalMinutes: number): string {
  const hours = totalMinutes / 60;
  if (hours >= 10) return "#ef4444"; // red
  if (hours >= 8) return "#f59e0b"; // amber
  return "#22c55e"; // green
}

function formatLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (totalMinutes === 0) return "0h";
  if (hours === 0) return `${mins}m`;
  return `${hours}h`;
}

function formatTooltip(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  return `Today: ${parts.length ? parts.join(" ") : "0m"} / 12h`;
}

export function DailyLogtimeIndicator() {
  const { data } = useSWR("USER_DAILY_WORKLOG_TOTAL", () => userWorklogService.getUserDailyTotal(), {
    refreshInterval: 60_000,
  });

  const totalMinutes = data?.total_minutes ?? 0;
  const progress = Math.min(totalMinutes / MAX_MINUTES, 1);
  const offset = CIRCUMFERENCE * (1 - progress);
  const color = getProgressColor(totalMinutes);
  const label = formatLabel(totalMinutes);
  const tooltip = formatTooltip(totalMinutes);

  return (
    <Tooltip tooltipContent={tooltip} position="bottom">
      <div className="flex items-center justify-center size-8 rounded-md hover:bg-layer-1-hover cursor-default">
        <svg viewBox="0 0 36 36" className="size-[22px]">
          {/* Background track — white when unfilled */}
          <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="4.5" stroke="white" />
          {/* Progress arc */}
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            strokeWidth="4.5"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
            style={{ stroke: color, transition: "stroke-dashoffset 0.5s ease" }}
          />
          {/* Center time label */}
          <text
            x="18"
            y="18"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-custom-text-200"
            style={{ fontSize: "8px", fontWeight: 500 }}
          >
            {label}
          </text>
        </svg>
      </div>
    </Tooltip>
  );
}
