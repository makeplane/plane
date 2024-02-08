import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
// hooks
import { useDashboard } from "hooks/store";
// components
import { WidgetLoader } from "components/dashboard/widgets";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
// types
import { TOverviewStatsWidgetResponse } from "@plane/types";
import { cn } from "helpers/common.helper";

export type WidgetProps = {
  dashboardId: string;
  workspaceSlug: string;
};

const WIDGET_KEY = "overview_stats";

export const OverviewStatsWidget: React.FC<WidgetProps> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // store hooks
  const { fetchWidgetStats, getWidgetStats } = useDashboard();
  // derived values
  const widgetStats = getWidgetStats<TOverviewStatsWidgetResponse>(workspaceSlug, dashboardId, WIDGET_KEY);

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
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  return (
    <div
      className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full grid lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-2 grid-cols-2  p-0.5 hover:shadow-custom-shadow-4xl duration-300
        [&>div>a>div]:border-r
        [&>div:last-child>a>div]:border-0
        [&>div>a>div]:border-custom-border-200
        [&>div:nth-child(2)>a>div]:border-0
        [&>div:nth-child(2)>a>div]:lg:border-r
        "
    >
      {STATS_LIST.map((stat, index) => (
        <div
          className={cn(
            `w-full flex flex-col gap-2 hover:bg-custom-background-80`,
            index === 0 ? "rounded-tl-xl lg:rounded-l-xl" : "",
            index === STATS_LIST.length - 1 ? "rounded-br-xl lg:rounded-r-xl" : "",
            index === 1 ? "rounded-tr-xl lg:rounded-[0px]" : "",
            index == 2 ? "rounded-bl-xl lg:rounded-[0px]" : ""
          )}
        >
          <Link href={stat.link} className="py-4 duration-300 rounded-[10px] w-full ">
            <div className={`relative flex pl-10 sm:pl-20 md:pl-20 lg:pl-20 items-center`}>
              <div>
                <h5 className="font-semibold text-xl">{stat.count}</h5>
                <p className="text-custom-text-300 text-sm xl:text-base">{stat.title}</p>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
});
