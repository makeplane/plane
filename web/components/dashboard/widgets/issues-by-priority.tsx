import { useEffect, useState } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
// hooks
import { useDashboard } from "hooks/store";
// components
import { MarimekkoGraph } from "components/ui";
import {
  DurationFilterDropdown,
  IssuesByPriorityEmptyState,
  WidgetLoader,
  WidgetProps,
} from "components/dashboard/widgets";
// ui
import { PriorityIcon } from "@plane/ui";
// helpers
import { getCustomDates } from "helpers/dashboard.helper";
// types
import { TIssuesByPriorityWidgetFilters, TIssuesByPriorityWidgetResponse } from "@plane/types";
// constants
import { PRIORITY_GRAPH_GRADIENTS } from "constants/dashboard";
import { ISSUE_PRIORITIES } from "constants/issue";

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

const WIDGET_KEY = "issues_by_priority";

export const IssuesByPriorityWidget: React.FC<WidgetProps> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // store hooks
  const { fetchWidgetStats, getWidgetDetails, getWidgetStats, updateDashboardWidgetFilters } = useDashboard();
  const widgetDetails = getWidgetDetails(workspaceSlug, dashboardId, WIDGET_KEY);
  const widgetStats = getWidgetStats<TIssuesByPriorityWidgetResponse[]>(workspaceSlug, dashboardId, WIDGET_KEY);

  const handleUpdateFilters = async (filters: Partial<TIssuesByPriorityWidgetFilters>) => {
    if (!widgetDetails) return;

    await updateDashboardWidgetFilters(workspaceSlug, dashboardId, widgetDetails.id, {
      widgetKey: WIDGET_KEY,
      filters,
    });

    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
      target_date: getCustomDates(filters.target_date ?? widgetDetails.widget_filters.target_date ?? "this_week"),
    });
  };

  useEffect(() => {
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
      target_date: getCustomDates(widgetDetails?.widget_filters.target_date ?? "this_week"),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!widgetDetails || !widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  const totalCount = widgetStats.reduce((acc, item) => acc + item?.count, 0);
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
          .map((bar: any) => (
            <CustomBar key={bar?.key} bar={bar} workspaceSlug={workspaceSlug} />
          ))}
      </g>
    );
  };

  return (
    <div className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full py-6 hover:shadow-custom-shadow-4xl duration-300 overflow-hidden min-h-96 flex flex-col">
      <div className="flex items-start justify-between gap-2 pl-7 pr-6">
        <div>
          <Link
            href={`/${workspaceSlug}/workspace-views/assigned`}
            className="text-lg font-semibold text-custom-text-300 hover:underline"
          >
            Assigned by priority
          </Link>
          <p className="mt-3 text-xs font-medium text-custom-text-300">
            Filtered by{" "}
            <span className="border-[0.5px] border-custom-border-300 rounded py-1 px-2 ml-0.5">Due date</span>
          </p>
        </div>
        <DurationFilterDropdown
          value={widgetDetails.widget_filters.target_date ?? "this_week"}
          onChange={(val) =>
            handleUpdateFilters({
              target_date: val,
            })
          }
        />
      </div>
      {totalCount > 0 ? (
        <div className="flex items-center px-11 h-full">
          <div className="w-full -mt-[11px]">
            <MarimekkoGraph
              data={chartData}
              id="priority"
              value="percentage"
              dimensions={ISSUE_PRIORITIES.map((p) => ({
                id: p.key,
                value: p.key,
              }))}
              axisBottom={null}
              axisLeft={null}
              height="119px"
              margin={{
                top: 11,
                right: 0,
                bottom: 0,
                left: 0,
              }}
              defs={PRIORITY_GRAPH_GRADIENTS}
              fill={ISSUE_PRIORITIES.map((p) => ({
                match: {
                  id: p.key,
                },
                id: `gradient${p.title}`,
              }))}
              tooltip={() => <></>}
              enableGridX={false}
              enableGridY={false}
              layers={[CustomBarsLayer]}
            />
            <div className="flex items-center gap-1 w-full mt-3 text-sm font-semibold text-custom-text-300">
              {chartData.map((item) => (
                <p
                  key={item.priority}
                  className="flex items-center gap-1 flex-shrink-0"
                  style={{
                    width: `${item.percentage}%`,
                  }}
                >
                  <PriorityIcon priority={item.priority} withContainer />
                  {item.percentage.toFixed(0)}%
                </p>
              ))}
            </div>
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
