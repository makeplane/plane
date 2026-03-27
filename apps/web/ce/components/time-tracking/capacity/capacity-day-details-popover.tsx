/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Heatmap cell wrapped in a popover — clicking reveals tasks logged by a member on that day.
 * Fetches on-demand when the popover opens.
 */

import { useState } from "react";
import type { FC } from "react";
import { useTranslation } from "@plane/i18n";
import { Popover } from "@plane/propel/popover";
import type { ICapacityDayTask } from "@plane/types";
import { useWorklog } from "@/hooks/store/use-worklog";
import { formatMinutes } from "../utils/time-format";

interface CapacityDayDetailsPopoverProps {
  memberId: string;
  date: string;
  loggedMinutes: number;
  workspaceSlug: string;
  projectId: string;
  /** Tailwind classes for the cell color state (overloaded / normal / under) */
  cellClassName: string;
  /** Formatted label shown inside the cell (e.g. "7.5h") */
  cellLabel: string;
}

export const CapacityDayDetailsPopover: FC<CapacityDayDetailsPopoverProps> = ({
  memberId,
  date,
  loggedMinutes,
  workspaceSlug,
  projectId,
  cellClassName,
  cellLabel,
}) => {
  const { t } = useTranslation();
  const worklogStore = useWorklog();
  const [tasks, setTasks] = useState<ICapacityDayTask[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = async () => {
    if (loggedMinutes === 0) return;
    setIsLoading(true);
    try {
      const res = await worklogStore.fetchCapacityDayDetails(workspaceSlug, projectId, memberId, date);
      setTasks(res.tasks);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) void handleOpen();
      }}
    >
      <Popover.Button
        className={`mx-auto flex h-8 w-[50px] items-center justify-center rounded-md border shadow-sm transition-all hover:scale-[1.15] hover:shadow-md cursor-pointer ${cellClassName} font-medium text-12 tracking-wide`}
      >
        {cellLabel}
      </Popover.Button>
      <Popover.Panel className="z-30 w-64 rounded-lg border border-subtle bg-surface-1 shadow-lg p-2 max-h-60 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="py-4 text-center text-12 text-tertiary animate-pulse">{t("common.loading")}</div>
        ) : tasks && tasks.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {tasks.map((task) => (
              <div
                key={task.issue_id}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-surface-2"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-11 font-mono text-tertiary shrink-0">{task.issue_identifier}</span>
                  <span className="text-12 text-primary truncate">{task.issue_name}</span>
                </div>
                <span className="text-12 font-medium text-secondary shrink-0">{formatMinutes(task.total_minutes)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-12 text-tertiary">{t("capacity_no_data")}</div>
        )}
      </Popover.Panel>
    </Popover>
  );
};
