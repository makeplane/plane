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

  // Keep the entire table layout and 2D grid setup logic unchanged...
  return (
    <div className="w-full overflow-hidden rounded-xl border border-subtle bg-surface-1 shadow-sm">
      <div className="w-full overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-max text-13 text-left border-collapse">
          <thead className="bg-surface-2/80 backdrop-blur-sm uppercase text-12 font-medium text-tertiary border-b border-subtle sticky top-0 z-20">
            <tr>
              <th
                scope="col"
                className="px-3 py-2 sticky left-0 z-30 bg-surface-2 border-r border-subtle shadow-[1px_0_0_0_var(--color-border-subtle)]"
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
                    <td className="px-3 py-2 font-medium text-primary sticky left-0 z-10 bg-surface-1 group-hover:bg-surface-2/50 transition-colors duration-200 border-r border-subtle shadow-[1px_0_0_0_var(--color-border-subtle)]">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={member.display_name} src={member.avatar_url} size="sm" />
                        <span className="truncate max-w-[130px] font-semibold">{member.display_name}</span>
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
                          <Tooltip
                            tooltipContent={cellInfo.tooltipKey ? t(cellInfo.tooltipKey) : undefined}
                            disabled={!cellInfo.tooltipKey}
                          >
                            <div
                              className={`mx-auto flex h-8 w-[50px] items-center justify-center rounded-md border shadow-sm transition-all duration-300 hover:scale-[1.15] hover:shadow-md cursor-pointer ${cellInfo.className} font-medium text-12 tracking-wide`}
                            >
                              {cellVal}
                            </div>
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
                <td className="px-3 py-2 sticky left-0 z-10 bg-surface-2 border-r border-subtle text-12 font-medium text-tertiary uppercase">
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
    </div>
  );
});
