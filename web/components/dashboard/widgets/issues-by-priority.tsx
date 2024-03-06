<<<<<<< HEAD
import { useEffect, useState } from "react";
=======
import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
>>>>>>> 921b9078f1e18a034934f2ddc89e736fc38cffe4
import { observer } from "mobx-react-lite";
import Link from "next/link";
// hooks
// components
<<<<<<< HEAD
// ui
import { PriorityIcon } from "@plane/ui";
=======
>>>>>>> 921b9078f1e18a034934f2ddc89e736fc38cffe4
import {
  DurationFilterDropdown,
  IssuesByPriorityEmptyState,
  WidgetLoader,
  WidgetProps,
} from "components/dashboard/widgets";
<<<<<<< HEAD
import { MarimekkoGraph } from "components/ui";
=======
>>>>>>> 921b9078f1e18a034934f2ddc89e736fc38cffe4
// helpers
// types
<<<<<<< HEAD
// constants
import { PRIORITY_GRAPH_GRADIENTS } from "constants/dashboard";
import { ISSUE_PRIORITIES } from "constants/issue";
import { getCustomDates } from "helpers/dashboard.helper";
import { useDashboard } from "hooks/store";
import { TIssuesByPriorityWidgetFilters, TIssuesByPriorityWidgetResponse } from "@plane/types";

const TEXT_COLORS = {
  urgent: "#F4A9AA",
  high: "#AB4800",
  medium: "#AB6400",
  low: "#1F2D5C",
  none: "#60646C",
};

const CustomBar = (props: any) => {
  const { bar, workspaceSlug } = props;
  // states
  const [isMouseOver, setIsMouseOver] = useState(false);

  return (
    <Link href={`/${workspaceSlug}/workspace-views/assigned?priority=${bar?.id}`}>
      <g
        transform={`translate(${bar?.x},${bar?.y})`}
        onMouseEnter={() => setIsMouseOver(true)}
        onMouseLeave={() => setIsMouseOver(false)}
      >
        <rect
          x={0}
          y={isMouseOver ? -6 : 0}
          width={bar?.width}
          height={isMouseOver ? bar?.height + 6 : bar?.height}
          fill={bar?.fill}
          stroke={bar?.borderColor}
          strokeWidth={bar?.borderWidth}
          rx={4}
          ry={4}
          className="duration-300"
        />
        <text
          x={-bar?.height + 10}
          y={18}
          fill={TEXT_COLORS[bar?.id as keyof typeof TEXT_COLORS]}
          className="capitalize font-medium text-lg -rotate-90"
          dominantBaseline="text-bottom"
        >
          {bar?.id}
        </text>
      </g>
    </Link>
  );
};
=======
import { EDurationFilters, TIssuesByPriorityWidgetFilters, TIssuesByPriorityWidgetResponse } from "@plane/types";
// constants
import { IssuesByPriorityGraph } from "components/graphs";
>>>>>>> 921b9078f1e18a034934f2ddc89e736fc38cffe4

const WIDGET_KEY = "issues_by_priority";

export const IssuesByPriorityWidget: React.FC<WidgetProps> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // router
  const router = useRouter();
  // store hooks
  const { fetchWidgetStats, getWidgetDetails, getWidgetStats, updateDashboardWidgetFilters } = useDashboard();
  // derived values
  const widgetDetails = getWidgetDetails(workspaceSlug, dashboardId, WIDGET_KEY);
  const widgetStats = getWidgetStats<TIssuesByPriorityWidgetResponse[]>(workspaceSlug, dashboardId, WIDGET_KEY);
  const selectedDuration = widgetDetails?.widget_filters.duration ?? EDurationFilters.NONE;
  const selectedCustomDates = widgetDetails?.widget_filters.custom_dates ?? [];

  const handleUpdateFilters = async (filters: Partial<TIssuesByPriorityWidgetFilters>) => {
    if (!widgetDetails) return;

    await updateDashboardWidgetFilters(workspaceSlug, dashboardId, widgetDetails.id, {
      widgetKey: WIDGET_KEY,
      filters,
    });

    const filterDates = getCustomDates(
      filters.duration ?? selectedDuration,
      filters.custom_dates ?? selectedCustomDates
    );
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
      ...(filterDates.trim() !== "" ? { target_date: filterDates } : {}),
    });
  };

  useEffect(() => {
    const filterDates = getCustomDates(selectedDuration, selectedCustomDates);
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
      ...(filterDates.trim() !== "" ? { target_date: filterDates } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!widgetDetails || !widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  const totalCount = widgetStats.reduce((acc, item) => acc + item?.count, 0);
<<<<<<< HEAD
  const chartData = widgetStats
    .filter((i) => i.count !== 0)
    .map((item) => ({
      priority: item?.priority,
      percentage: (item?.count / totalCount) * 100,
      urgent: item?.priority === "urgent" ? 1 : 0,
      high: item?.priority === "high" ? 1 : 0,
      medium: item?.priority === "medium" ? 1 : 0,
      low: item?.priority === "low" ? 1 : 0,
      none: item?.priority === "none" ? 1 : 0,
    }));

  const CustomBarsLayer = (props: any) => {
    const { bars } = props;

    return (
      <g>
        {bars
          ?.filter((b: any) => b?.value === 1) // render only bars with value 1
          .map((bar: any) => <CustomBar key={bar?.key} bar={bar} workspaceSlug={workspaceSlug} />)}
      </g>
    );
  };
=======
  const chartData = widgetStats.map((item) => ({
    priority: item?.priority,
    priority_count: item?.count,
  }));
>>>>>>> 921b9078f1e18a034934f2ddc89e736fc38cffe4

  return (
    <div className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full py-6 hover:shadow-custom-shadow-4xl duration-300 overflow-hidden min-h-96 flex flex-col">
      <div className="flex items-center justify-between gap-2 pl-7 pr-6">
        <Link
          href={`/${workspaceSlug}/workspace-views/assigned`}
          className="text-lg font-semibold text-custom-text-300 hover:underline"
        >
          Assigned by priority
        </Link>
        <DurationFilterDropdown
          customDates={selectedCustomDates}
          value={selectedDuration}
          onChange={(val, customDates) =>
            handleUpdateFilters({
              duration: val,
              ...(val === "custom" ? { custom_dates: customDates } : {}),
            })
          }
        />
      </div>
      {totalCount > 0 ? (
        <div className="flex items-center h-full">
          <div className="w-full -mt-[11px]">
            <IssuesByPriorityGraph
              data={chartData}
              onBarClick={(datum) => {
                router.push(
                  `/${workspaceSlug}/workspace-views/assigned?priority=${`${datum.data.priority}`.toLowerCase()}`
                );
              }}
            />
          </div>
        </div>
      ) : (
        <div className="h-full grid place-items-center">
          <IssuesByPriorityEmptyState />
        </div>
      )}
    </div>
  );
});
