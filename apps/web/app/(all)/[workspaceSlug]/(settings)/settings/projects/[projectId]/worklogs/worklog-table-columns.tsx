/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { format as formatDateTime } from "date-fns";
import type { IWorkLog } from "@plane/types";
import { Avatar } from "@plane/propel/avatar";

// Format minutes to human-readable hours/minutes string
export const formatMinutesToHours = (totalMinutes: number): string => {
  if (!totalMinutes) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
};

// Table column definitions for worklog settings table
export const getWorklogColumns = (projectName?: string) => [
  {
    key: "project",
    content: "Project",
    tdRender: (log: IWorkLog) => (
      <div className="text-13 line-clamp-1 max-w-sm">{log.project_detail?.name || projectName || "Unknown"}</div>
    ),
  },
  {
    key: "work_item",
    content: "Work item",
    tdRender: (log: IWorkLog) => (
      <div className="text-13 line-clamp-1 max-w-[200px]" title={log.issue_detail?.name || ""}>
        {log.issue_detail ? (
          <span className="flex items-center gap-1.5 font-medium">
            <span className="text-color-tertiary font-normal">{log.issue_detail.identifier}</span>
            {log.issue_detail.name}
          </span>
        ) : (
          <span className="text-color-tertiary">-</span>
        )}
      </div>
    ),
  },
  {
    key: "logged",
    content: "Logged",
    tdRender: (log: IWorkLog) => (
      <div className="flex items-center gap-2 text-13">
        <Avatar
          name={log.logged_by_detail?.display_name || ""}
          src={log.logged_by_detail?.avatar_url || ""}
          size="sm"
          shape="circle"
        />
        <span className="text-color-secondary">
          {log.logged_by_detail?.display_name || "Unknown"} on{" "}
          {log.logged_at ? formatDateTime(new Date(log.logged_at), "MMM dd, yyyy") : "-"}
        </span>
      </div>
    ),
  },
  {
    key: "time",
    content: "Time",
    tdRender: (log: IWorkLog) => (
      <span className="text-13 font-medium text-color-primary">{formatMinutesToHours(log.duration_minutes)}</span>
    ),
  },
];
