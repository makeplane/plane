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
    <div className="w-full overflow-hidden rounded-xl border border-subtle bg-surface-1 shadow-sm">
      <div className="w-full overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-max text-13 text-left border-separate border-spacing-0">
          <thead className="bg-surface-2/60 backdrop-blur-md text-12 font-semibold text-secondary sticky top-0 z-20">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 sticky left-0 z-30 bg-surface-2 border-b border-r border-subtle min-w-[220px] transition-all"
              >
                {t("capacity_member")}
              </th>
              <th scope="col" className="px-4 py-3 text-right border-b border-r border-subtle min-w-[120px]">
                {t("capacity_total_logged")}
              </th>
              {days.map((day) => (
                <th
                  key={day.toISOString()}
                  scope="col"
                  className="px-3 py-3 text-center min-w-[80px] border-b border-subtle font-bold text-tertiary tracking-tight"
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-11 font-bold text-accent-primary uppercase opacity-70">
                      {format(day, "EEE")}
                    </span>
                    <span className="text-13">{format(day, "MMM dd")}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle/40">
            {members.length === 0 ? (
              <tr>
                <td colSpan={2 + days.length} className="px-6 py-12 text-center text-14 text-tertiary italic">
                  {t("capacity_no_data")}
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const memberDays = member.days || {};

                return (
                  <tr key={member.member_id} className="group hover:bg-surface-2/30 transition-all duration-300">
                    <td className="px-4 py-3 font-medium text-primary sticky left-0 z-10 bg-surface-1 group-hover:bg-surface-2/30 transition-all duration-300 border-r border-subtle shadow-[2px_0_8px_-4px_rgba(0,0,0,0.1)] min-w-[220px]">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          name={member.display_name}
                          src={member.avatar_url}
                          size="md"
                          className="ring-2 ring-surface-2"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate max-w-[200px] font-bold text-primary group-hover:text-accent-primary transition-colors">
                            {member.display_name}
                          </span>
                          <span className="text-11 text-tertiary font-medium">Member</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-primary font-bold border-r border-subtle/20 bg-surface-2/10">
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
            <tfoot className="bg-surface-2/40 border-t border-subtle text-primary sticky bottom-0 z-20 backdrop-blur-sm">
              <tr>
                <td className="px-4 py-3 sticky left-0 z-10 bg-surface-2 border-r border-subtle text-12 font-bold text-secondary uppercase tracking-widest min-w-[220px]">
                  {t("total_logged_time")}
                </td>
                <td className="px-4 py-3 text-right text-14 font-extrabold border-r border-subtle bg-surface-2/20">
                  {formatHours(members.reduce((acc, m) => acc + m.total_logged_minutes, 0))}h
                </td>
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dailyMinutes = projectDailyTotals?.[dateStr]?.minutes ?? 0;
                  return (
                    <td key={dateStr} className="px-3 py-3 text-center text-13 font-bold text-accent-primary">
                      {dailyMinutes > 0 ? `${formatHours(dailyMinutes)}h` : <span className="opacity-20">-</span>}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
});
