import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
// hooks
import { useDashboard } from "hooks/store";
// components
import { WidgetLoader } from "components/dashboard/widgets";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
import { cn } from "helpers/common.helper";
// types
import { TOverviewStatsWidgetResponse } from "@plane/types";

export type WidgetProps = {
  dashboardId: string;
  workspaceSlug: string;
};

const WIDGET_KEY = "overview_stats";

export const OverviewStatsWidget: React.FC<WidgetProps> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // store hooks
  const { fetchWidgetStats, widgetStats: allWidgetStats } = useDashboard();
  // derived values
  const widgetStats = allWidgetStats?.[workspaceSlug]?.[dashboardId]?.[WIDGET_KEY] as TOverviewStatsWidgetResponse;

  const today = renderFormattedPayloadDate(new Date());
  const STATS_LIST = [
    {
      key: "assigned",
      title: "Issues assigned",
      count: widgetStats?.assigned_issues_count,
      link: `/${workspaceSlug}/workspace-views/assigned`,
    },
    {
      key: "overdue",
      title: "Issues overdue",
      count: widgetStats?.pending_issues_count,
      link: `/${workspaceSlug}/workspace-views/assigned/?target_date=${today};before`,
    },
    {
      key: "created",
      title: "Issues created",
      count: widgetStats?.created_issues_count,
      link: `/${workspaceSlug}/workspace-views/created`,
    },
    {
      key: "completed",
      title: "Issues completed",
      count: widgetStats?.completed_issues_count,
      link: `/${workspaceSlug}/workspace-views/assigned?state_group=completed`,
    },
  ];

  useEffect(() => {
    if (!widgetStats)
      fetchWidgetStats(workspaceSlug, dashboardId, {
        widget_key: WIDGET_KEY,
      });
  }, [dashboardId, fetchWidgetStats, widgetStats, workspaceSlug]);

  if (!widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  return (
    <div className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full grid grid-cols-4 p-0.5 hover:shadow-custom-shadow-4xl duration-300">
      {STATS_LIST.map((stat, index) => {
        const isFirst = index === 0;
        const isLast = index === STATS_LIST.length - 1;
        const isMiddle = !isFirst && !isLast;

        return (
          <div key={stat.key} className="flex relative">
            {!isLast && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3/5 w-[0.5px] bg-custom-border-200" />
            )}
            <Link
              href={stat.link}
              className={cn(`py-4 hover:bg-custom-background-80 duration-300 rounded-[10px] w-full break-words`, {
                "pl-11 pr-[4.725rem] mr-0.5": isFirst,
                "px-[4.725rem] mx-0.5": isMiddle,
                "px-[4.725rem] ml-0.5": isLast,
              })}
            >
              <h5 className="font-semibold text-xl">{stat.count}</h5>
              <p className="text-custom-text-300">{stat.title}</p>
            </Link>
          </div>
        );
      })}
    </div>
  );
});
