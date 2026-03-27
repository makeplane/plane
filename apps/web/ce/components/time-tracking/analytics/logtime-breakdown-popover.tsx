/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Popover that shows per-user worklog breakdown for a single analytics table cell.
 */

import type { FC } from "react";
import { Avatar } from "@plane/propel/avatar";
import { Popover } from "@plane/propel/popover";
import type { IAnalyticsTimesheetUserBreakdown } from "@plane/types";
import { formatMinutes } from "../utils/time-format";

interface LogtimeBreakdownPopoverProps {
  /** Total minutes logged across all users for this cell */
  totalMinutes: number;
  /** Per-user breakdown from the analytics row */
  byUser: IAnalyticsTimesheetUserBreakdown[];
  /** ISO date string of the column being clicked */
  date: string;
}

/**
 * Renders the cell value as a clickable trigger; popover lists each user's
 * contribution on that specific day.
 */
export const LogtimeBreakdownPopover: FC<LogtimeBreakdownPopoverProps> = ({ totalMinutes, byUser, date }) => {
  if (totalMinutes === 0) {
    return <span className="text-13 text-tertiary">-</span>;
  }

  const usersForDate = byUser
    .map((u) => ({ ...u, minutes: u.days[date] ?? 0 }))
    .filter((u) => u.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  return (
    <Popover>
      <Popover.Button className="text-13 font-medium text-primary hover:text-accent-primary transition-colors cursor-pointer">
        {formatMinutes(totalMinutes)}
      </Popover.Button>
      <Popover.Panel className="z-30 w-52 rounded-lg border border-subtle bg-surface-1 shadow-lg p-2">
        <div className="flex flex-col gap-1">
          {usersForDate.map((u) => (
            <div
              key={u.user_id}
              className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-surface-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Avatar name={u.display_name} src={u.avatar_url} size="xs" />
                <span className="text-12 text-primary truncate">{u.display_name}</span>
              </div>
              <span className="text-12 font-medium text-secondary shrink-0">{formatMinutes(u.minutes)}</span>
            </div>
          ))}
        </div>
      </Popover.Panel>
    </Popover>
  );
};
