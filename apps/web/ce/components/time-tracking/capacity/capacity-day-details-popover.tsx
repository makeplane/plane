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
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
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
  /** When true, time counts from all workspaces; popover shows all-workspace tasks */
  isCrossWorkspace?: boolean;
  /** When true, component is in workspace mode (no projectId); uses workspace day-details endpoint */
  isWorkspaceMode?: boolean;
}

export const CapacityDayDetailsPopover: FC<CapacityDayDetailsPopoverProps> = ({
  memberId,
  date,
  loggedMinutes,
  workspaceSlug,
  projectId,
  cellClassName,
  cellLabel,
  isCrossWorkspace,
  isWorkspaceMode,
}) => {
  const { t } = useTranslation();
  const worklogStore = useWorklog();
  const { setPeekIssue } = useIssueDetail();
  const [tasks, setTasks] = useState<ICapacityDayTask[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = async () => {
    if (loggedMinutes === 0) return;
    setIsLoading(true);
    try {
      let res;
      if (isWorkspaceMode) {
        // Workspace mode: use workspace day-details endpoint (supports cross_workspace flag)
        res = await worklogStore.fetchWorkspaceCapacityDayDetails(workspaceSlug, memberId, date, isCrossWorkspace);
      } else if (isCrossWorkspace) {
        // Project mode, cross-workspace: all workspaces for this member
        res = await worklogStore.fetchCrossWorkspaceCapacityDayDetails(workspaceSlug, memberId, date);
      } else {
        // Project mode, current project only
        res = await worklogStore.fetchCapacityDayDetails(workspaceSlug, projectId, memberId, date);
      }
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
        className={`shadow-sm hover:shadow-md mx-auto flex h-8 w-[50px] cursor-pointer items-center justify-center rounded-md border transition-all hover:scale-[1.15] ${cellClassName} text-12 font-medium tracking-wide`}
      >
        {cellLabel}
      </Popover.Button>
      <Popover.Panel className="shadow-lg vertical-scrollbar z-30 scrollbar-sm max-h-60 w-64 overflow-y-auto rounded-lg border border-subtle bg-surface-1 p-2">
        {isLoading ? (
          <div className="animate-pulse py-4 text-center text-12 text-tertiary">{t("common.loading")}</div>
        ) : tasks && tasks.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {tasks.map((task) => (
              <button
                key={task.issue_id}
                className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface-2"
                onClick={() =>
                  setPeekIssue({
                    workspaceSlug: task.workspace_slug,
                    projectId: task.project_id,
                    issueId: task.issue_id,
                    nestingLevel: 0,
                  })
                }
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="font-mono shrink-0 text-11 text-tertiary">{task.issue_identifier}</span>
                  <span className="truncate text-12 text-primary transition-colors group-hover:text-accent-primary">
                    {task.issue_name}
                  </span>
                </div>
                <span className="shrink-0 text-12 font-medium text-secondary">{formatMinutes(task.total_minutes)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-12 text-tertiary">{t("capacity_no_data")}</div>
        )}
      </Popover.Panel>
    </Popover>
  );
};
