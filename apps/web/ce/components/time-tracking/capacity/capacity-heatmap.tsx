/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Capacity heatmap table — one row per member, one column per day in the date range.
 * Cells are always clickable — in cross-workspace mode they fetch day details across
 * all user workspaces; in project mode they fetch project-scoped day details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Avatar } from "@plane/ui";
import { Tooltip } from "@plane/propel/tooltip";
import { eachDayOfInterval, parseISO, format } from "date-fns";
import type { ICapacityMember } from "@plane/types";
import { CapacityDayDetailsPopover } from "./capacity-day-details-popover";

interface ICapacityHeatmapProps {
  members: ICapacityMember[];
  dateFrom: string;
  dateTo: string;
  projectDailyTotals?: Record<string, { minutes: number; issue_count: number }>;
  workspaceSlug: string;
  projectId: string;
  isCrossWorkspace?: boolean;
  /** When true, popover uses workspace day-details endpoint instead of project-scoped */
  isWorkspaceMode?: boolean;
}

export const CapacityHeatmap = observer((props: ICapacityHeatmapProps) => {
  const { members, dateFrom, dateTo, projectDailyTotals, workspaceSlug, projectId, isCrossWorkspace, isWorkspaceMode } =
    props;
  const { t } = useTranslation();

  const formatHours = (minutes: number) => (minutes / 60).toFixed(1);

  const days =
    !dateFrom || !dateTo
      ? []
      : eachDayOfInterval({
          start: parseISO(dateFrom),
          end: parseISO(dateTo),
        });

  const getDailyCellInfo = (minutes: number = 0) => {
    if (minutes > 480) {
      return {
        className: "bg-error/10 text-error border-error",
        tooltipKey: "capacity_overloaded",
      };
    }
    if (minutes >= 420 && minutes <= 480) {
      return {
        className: "bg-success/10 text-success border-success",
        tooltipKey: "capacity_normal",
      };
    }
    if (minutes > 0 && minutes < 420) {
      return {
        className: "bg-warning/10 text-warning border-warning",
        tooltipKey: "capacity_under_capacity",
      };
    }
    return {
      className: "bg-surface-2 text-secondary border-transparent",
      tooltipKey: "",
    };
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-subtle bg-surface-1 shadow-sm horizontal-scrollbar scrollbar-sm">
      <table className="w-full min-w-max text-13 text-left border-collapse">
        <thead className="bg-surface-2/80 backdrop-blur-sm uppercase text-12 font-medium text-tertiary border-b border-subtle sticky top-0 z-[21]">
          <tr>
            <th
              scope="col"
              className="px-3 py-2 sticky left-0 z-[22] bg-surface-2 border-r border-subtle shadow-[1px_0_0_0_var(--color-border-subtle)] min-w-[200px]"
            >
              {t("capacity_member")}
            </th>
            <th scope="col" className="px-3 py-2 text-right border-r border-subtle">
              {t("capacity_total_logged")}
            </th>
            {days.map((day) => (
              <th key={day.toISOString()} scope="col" className="px-2 py-2 text-center min-w-[70px]">
                {format(day, "MMM dd")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle/50">
          {members.length === 0 ? (
            <tr>
              <td colSpan={2 + days.length} className="px-4 py-8 text-center text-13 text-secondary">
                {t("capacity_no_data")}
              </td>
            </tr>
          ) : (
            members.map((member) => {
              const memberDays = member.days || {};

              return (
                <tr key={member.member_id} className="group hover:bg-surface-2/50 transition-colors duration-200">
                  <td className="px-3 py-2 font-medium text-primary sticky left-0 z-[21] bg-surface-1 group-hover:bg-surface-2/50 transition-colors duration-200 border-r border-subtle shadow-[1px_0_0_0_var(--color-border-subtle)] min-w-[200px]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={member.display_name} src={member.avatar_url} size="sm" />
                      <span className="truncate max-w-[250px] font-semibold">{member.display_name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-primary font-bold border-r border-subtle/30">
                    {formatHours(member.total_logged_minutes)}h
                  </td>

                  {days.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const loggedMinutes = memberDays[dateStr] || 0;
                    const cellInfo = getDailyCellInfo(loggedMinutes);
                    const cellVal = loggedMinutes > 0 ? `${formatHours(loggedMinutes)}h` : "-";

                    return (
                      <td key={dateStr} className="px-1 py-1 text-center">
                        {/* Clickable popover — project-scoped or cross-workspace */}
                        <Tooltip
                          tooltipContent={cellInfo.tooltipKey ? t(cellInfo.tooltipKey) : undefined}
                          disabled={!cellInfo.tooltipKey}
                        >
                          <CapacityDayDetailsPopover
                            memberId={member.member_id}
                            date={dateStr}
                            loggedMinutes={loggedMinutes}
                            workspaceSlug={workspaceSlug}
                            projectId={projectId}
                            cellClassName={cellInfo.className}
                            cellLabel={cellVal}
                            isCrossWorkspace={isCrossWorkspace}
                            isWorkspaceMode={isWorkspaceMode}
                          />
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
        {members.length > 0 && (
          <tfoot className="bg-surface-2/50 border-t border-subtle font-bold text-primary">
            <tr>
              <td className="px-3 py-2 sticky left-0 z-[22] bg-surface-2 border-r border-subtle text-12 font-medium text-tertiary uppercase min-w-[200px]">
                {t("total_logged_time")}
              </td>
              <td className="px-3 py-2 text-right text-13 font-bold border-r border-subtle">
                {formatHours(members.reduce((acc, m) => acc + m.total_logged_minutes, 0))}h
              </td>
              {days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dailyMinutes = projectDailyTotals?.[dateStr]?.minutes ?? 0;
                return (
                  <td key={dateStr} className="px-3 py-2 text-center text-13 font-bold text-primary">
                    {dailyMinutes > 0 ? `${formatHours(dailyMinutes)}h` : "-"}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
});
