import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Avatar } from "@plane/ui";
import { Tooltip } from "@plane/propel/tooltip";
import { eachDayOfInterval, parseISO, format } from "date-fns";

import type { ICapacityMember } from "@plane/types";

interface ICapacityHeatmapProps {
  members: ICapacityMember[];
  dateFrom: string;
  dateTo: string;
  projectDailyTotals?: Record<string, { minutes: number; issue_count: number }>;
}

export const CapacityHeatmap = observer((props: ICapacityHeatmapProps) => {
  const { members, dateFrom, dateTo, projectDailyTotals } = props;
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
        className: "bg-color-error/10 text-color-error border-color-error",
        tooltipKey: "capacity_overloaded",
      };
    }
    if (minutes >= 420 && minutes <= 480) {
      return {
        className: "bg-color-success/10 text-color-success border-color-success",
        tooltipKey: "capacity_normal",
      };
    }
    if (minutes > 0 && minutes < 420) {
      return {
        className: "bg-color-warning/10 text-color-warning border-color-warning",
        tooltipKey: "capacity_under_capacity",
      };
    }
    return {
      className: "bg-surface-2 text-secondary border-transparent",
      tooltipKey: "",
    };
  };

  // Keep the entire table layout and 2D grid setup logic unchanged...
  return (
    <div className="w-full overflow-hidden rounded-xl border border-subtle bg-surface-1 shadow-sm">
      <div className="w-full overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-max text-xs text-left border-collapse">
          <thead className="bg-surface-2/80 backdrop-blur-sm uppercase text-[10px] font-bold text-tertiary border-b border-subtle sticky top-0 z-20">
            <tr>
              <th
                scope="col"
                className="px-3 py-2 sticky left-0 z-30 bg-surface-2 border-r border-subtle shadow-[1px_0_0_0_var(--color-border-subtle)]"
              >
                {t("capacity_member")}
              </th>
              <th scope="col" className="px-3 py-2 text-right">
                {t("capacity_total_estimated")}
              </th>
              <th scope="col" className="px-3 py-2 text-right">
                {t("capacity_total_logged")}
              </th>
              <th scope="col" className="px-3 py-2 text-right border-r border-subtle">
                {t("work_items", "Work Items")}
              </th>
              {days.map((day) => (
                <th key={day.toISOString()} scope="col" className="px-2 py-2 text-center min-w-[70px]">
                  {format(day, "MMM dd")}
                </th>
              ))}
              <th scope="col" className="px-3 py-2 text-center border-l border-subtle">
                {t("status")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle/50">
            {members.length === 0 ? (
              <tr>
                <td colSpan={5 + days.length} className="px-4 py-8 text-center text-sm text-secondary">
                  {t("capacity_no_data")}
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const isOverloaded = member.status === "overload";
                const isNormal = member.status === "normal";
                const isUnder = member.status === "under";

                let statusBgClassName = "";
                let statusTextClassName = "text-secondary";
                let statusBorderClassName = "border-transparent";
                let tooltipKey = "capacity_normal";

                if (isOverloaded) {
                  statusBgClassName = "bg-danger-subtle";
                  statusTextClassName = "text-danger-primary";
                  statusBorderClassName = "border-danger-subtle";
                  tooltipKey = "capacity_overloaded";
                } else if (isNormal) {
                  statusBgClassName = "bg-success-subtle";
                  statusTextClassName = "text-success-primary";
                  statusBorderClassName = "border-success-subtle";
                  tooltipKey = "capacity_normal";
                } else if (isUnder) {
                  statusBgClassName = "bg-warning-subtle";
                  statusTextClassName = "text-warning-primary";
                  statusBorderClassName = "border-warning-subtle";
                  tooltipKey = "capacity_under_capacity";
                } else {
                  statusBgClassName = "bg-surface-2";
                  statusTextClassName = "text-secondary";
                  statusBorderClassName = "border-subtle";
                  tooltipKey = "capacity_no_data";
                }

                const memberDays = member.days || {};

                return (
                  <tr key={member.member_id} className="group hover:bg-surface-2/50 transition-colors duration-200">
                    <td className="px-3 py-2 font-medium text-primary sticky left-0 z-10 bg-surface-1 group-hover:bg-surface-2/50 transition-colors duration-200 border-r border-subtle shadow-[1px_0_0_0_var(--color-border-subtle)]">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={member.display_name} src={member.avatar_url} size="sm" />
                        <span className="truncate max-w-[130px] font-semibold">{member.display_name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-secondary/80 font-medium">
                      {formatHours(member.total_estimated_minutes)}h
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-bold ${isOverloaded ? "text-color-error" : "text-primary"}`}
                    >
                      {formatHours(member.total_logged_minutes)}h
                    </td>
                    <td className="px-3 py-2 text-right text-secondary/80 font-medium border-r border-subtle/30">
                      {member.issue_count}
                    </td>

                    {days.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const loggedMinutes = memberDays[dateStr] || 0;
                      const cellInfo = getDailyCellInfo(loggedMinutes);
                      const cellVal = loggedMinutes > 0 ? `${formatHours(loggedMinutes)}h` : "-";

                      return (
                        <td key={dateStr} className="px-1 py-1 text-center">
                          <Tooltip
                            tooltipContent={cellInfo.tooltipKey ? t(cellInfo.tooltipKey) : undefined}
                            disabled={!cellInfo.tooltipKey}
                          >
                            <div
                              className={`mx-auto flex h-8 w-[50px] items-center justify-center rounded-md border shadow-sm transition-all duration-300 hover:scale-[1.15] hover:shadow-md cursor-pointer ${cellInfo.className} font-medium text-[11px] tracking-wide`}
                            >
                              {cellVal}
                            </div>
                          </Tooltip>
                        </td>
                      );
                    })}

                    <td className="px-3 py-2 text-center border-l border-subtle/30">
                      <div className="flex justify-center items-center">
                        <Tooltip tooltipContent={t(tooltipKey)}>
                          <div
                            className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${statusBgClassName} ${statusTextClassName} ${statusBorderClassName}`}
                          >
                            {isOverloaded
                              ? t("capacity_overloaded", "Overload")
                              : isUnder
                                ? t("capacity_under_capacity", "Under")
                                : member.total_estimated_minutes > 0
                                  ? t("capacity_normal", "Normal")
                                  : "-"}
                          </div>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {members.length > 0 && (
            <tfoot className="bg-surface-2/50 border-t border-subtle font-bold text-primary">
              {/* Row 1: Logged Time Totals */}
              <tr className="border-b border-subtle/30">
                <td className="px-3 py-2 sticky left-0 z-10 bg-surface-2 border-r border-subtle text-[10px] text-tertiary uppercase">
                  {t("total_logged_time", "Total Logged")}
                </td>
                <td className="px-3 py-2 text-right text-xs">
                  {formatHours(members.reduce((acc, m) => acc + m.total_estimated_minutes, 0))}h
                </td>
                <td className="px-3 py-2 text-right text-xs">
                  {formatHours(members.reduce((acc, m) => acc + m.total_logged_minutes, 0))}h
                </td>
                <td className="px-3 py-2 text-right border-r border-subtle"></td>
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dailyMinutes = projectDailyTotals?.[dateStr]?.minutes ?? 0;
                  return (
                    <td key={dateStr} className="px-3 py-2 text-center text-xs text-primary font-bold">
                      {dailyMinutes > 0 ? `${formatHours(dailyMinutes)}h` : "-"}
                    </td>
                  );
                })}
                <td className="px-3 py-2 border-l border-subtle"></td>
              </tr>
              {/* Row 2: Work Item Totals */}
              <tr>
                <td className="px-3 py-2 sticky left-0 z-10 bg-surface-2 border-r border-subtle text-[10px] text-tertiary uppercase">
                  {t("total_work_items", "Total Work Items")}
                </td>
                <td className="px-3 py-2 text-right"></td>
                <td className="px-3 py-2 text-right"></td>
                <td className="px-3 py-2 text-right border-r border-subtle text-xs">
                  {members.reduce((acc, m) => acc + m.issue_count, 0)}
                </td>
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dailyIssues = projectDailyTotals?.[dateStr]?.issue_count ?? 0;
                  return (
                    <td key={dateStr} className="px-3 py-2 text-center text-[11px] text-secondary font-medium">
                      {dailyIssues > 0 ? `${dailyIssues} items` : "-"}
                    </td>
                  );
                })}
                <td className="px-3 py-2 border-l border-subtle"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
});
