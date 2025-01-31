import { useEffect, useState } from "react";
import { linearGradientDef } from "@nivo/core";
import { observer } from "mobx-react";
import Link from "next/link";
// types
import { EDurationFilters, STATE_GROUPS } from "@plane/constants";
import { TIssuesByStateGroupsWidgetFilters, TIssuesByStateGroupsWidgetResponse, TStateGroups } from "@plane/types";
// components
import { Card } from "@plane/ui";
import {
  DurationFilterDropdown,
  IssuesByStateGroupEmptyState,
  WidgetLoader,
  WidgetProps,
} from "@/components/dashboard/widgets";
import { PieGraph } from "@/components/ui";
// helpers
import { getCustomDates } from "@/helpers/dashboard.helper";
// hooks
import { useDashboard } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

const WIDGET_KEY = "issues_by_state_groups";

export const STATE_GROUP_GRAPH_COLORS: Record<TStateGroups, string> = {
  backlog: "#CDCED6",
  unstarted: "#80838D",
  started: "#FFC53D",
  completed: "#3E9B4F",
  cancelled: "#E5484D",
};
// colors for work items by state group widget graph arcs
export const STATE_GROUP_GRAPH_GRADIENTS = [
  linearGradientDef("gradientBacklog", [
    { offset: 0, color: "#DEDEDE" },
    { offset: 100, color: "#BABABE" },
  ]),
  linearGradientDef("gradientUnstarted", [
    { offset: 0, color: "#D4D4D4" },
    { offset: 100, color: "#878796" },
  ]),
  linearGradientDef("gradientStarted", [
    { offset: 0, color: "#FFD300" },
    { offset: 100, color: "#FAE270" },
  ]),
  linearGradientDef("gradientCompleted", [
    { offset: 0, color: "#0E8B1B" },
    { offset: 100, color: "#37CB46" },
  ]),
  linearGradientDef("gradientCanceled", [
    { offset: 0, color: "#C90004" },
    { offset: 100, color: "#FF7679" },
  ]),
];

export const IssuesByStateGroupWidget: React.FC<WidgetProps> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // states
  const [defaultStateGroup, setDefaultStateGroup] = useState<TStateGroups | null>(null);
  const [activeStateGroup, setActiveStateGroup] = useState<TStateGroups | null>(null);
  // router
  const router = useAppRouter();
  // store hooks
  const { fetchWidgetStats, getWidgetDetails, getWidgetStats, updateDashboardWidgetFilters } = useDashboard();
  // derived values
  const widgetDetails = getWidgetDetails(workspaceSlug, dashboardId, WIDGET_KEY);
  const widgetStats = getWidgetStats<TIssuesByStateGroupsWidgetResponse[]>(workspaceSlug, dashboardId, WIDGET_KEY);
  const selectedDuration = widgetDetails?.widget_filters.duration ?? EDurationFilters.NONE;
  const selectedCustomDates = widgetDetails?.widget_filters.custom_dates ?? [];

  const handleUpdateFilters = async (filters: Partial<TIssuesByStateGroupsWidgetFilters>) => {
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

  // fetch widget stats
  useEffect(() => {
    const filterDates = getCustomDates(selectedDuration, selectedCustomDates);
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
      ...(filterDates.trim() !== "" ? { target_date: filterDates } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // set active group for center metric
  useEffect(() => {
    if (!widgetStats) return;

    const startedCount = widgetStats?.find((item) => item?.state === "started")?.count ?? 0;
    const unStartedCount = widgetStats?.find((item) => item?.state === "unstarted")?.count ?? 0;
    const backlogCount = widgetStats?.find((item) => item?.state === "backlog")?.count ?? 0;
    const completedCount = widgetStats?.find((item) => item?.state === "completed")?.count ?? 0;
    const canceledCount = widgetStats?.find((item) => item?.state === "cancelled")?.count ?? 0;

    const stateGroup =
      startedCount > 0
        ? "started"
        : unStartedCount > 0
          ? "unstarted"
          : backlogCount > 0
            ? "backlog"
            : completedCount > 0
              ? "completed"
              : canceledCount > 0
                ? "cancelled"
                : null;

    setActiveStateGroup(stateGroup);
    setDefaultStateGroup(stateGroup);
  }, [widgetStats]);

  if (!widgetDetails || !widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  const totalCount = widgetStats?.reduce((acc, item) => acc + item?.count, 0);
  const chartData = widgetStats?.map((item) => ({
    color: STATE_GROUP_GRAPH_COLORS[item?.state as keyof typeof STATE_GROUP_GRAPH_COLORS],
    id: item?.state,
    label: item?.state,
    value: (item?.count / totalCount) * 100,
  }));

  const CenteredMetric = ({ dataWithArc, centerX, centerY }: any) => {
    const data = dataWithArc?.find((datum: any) => datum?.id === activeStateGroup);
    const percentage = chartData?.find((item) => item.id === activeStateGroup)?.value?.toFixed(0);

    return (
      <g>
        <text
          x={centerX}
          y={centerY - 8}
          textAnchor="middle"
          dominantBaseline="central"
          className="text-3xl font-bold"
          style={{
            fill: data?.color,
          }}
        >
          {percentage}%
        </text>
        <text
          x={centerX}
          y={centerY + 20}
          textAnchor="middle"
          dominantBaseline="central"
          className="text-sm font-medium fill-custom-text-300 capitalize"
        >
          {data?.id}
        </text>
      </g>
    );
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-2 mb-4">
        <Link
          href={`/${workspaceSlug}/workspace-views/assigned`}
          className="text-lg font-semibold text-custom-text-300 hover:underline"
        >
          Assigned by state
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
        <div className="flex items-center mt-11">
          <div className="flex flex-col sm:flex-row md:flex-row lg:flex-row items-center justify-evenly gap-x-10 gap-y-8 w-full">
            <div>
              <PieGraph
                data={chartData}
                height="220px"
                width="200px"
                innerRadius={0.6}
                cornerRadius={5}
                colors={(datum) => datum.data.color}
                padAngle={1}
                enableArcLinkLabels={false}
                enableArcLabels={false}
                activeOuterRadiusOffset={5}
                tooltip={() => <></>}
                margin={{
                  top: 0,
                  right: 5,
                  bottom: 0,
                  left: 5,
                }}
                defs={STATE_GROUP_GRAPH_GRADIENTS}
                fill={Object.values(STATE_GROUPS).map((p) => ({
                  match: {
                    id: p.key,
                  },
                  id: `gradient${p.label}`,
                }))}
                onClick={(datum, e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/${workspaceSlug}/workspace-views/assigned/?state_group=${datum.id}`);
                }}
                onMouseEnter={(datum) => setActiveStateGroup(datum.id as TStateGroups)}
                onMouseLeave={() => setActiveStateGroup(defaultStateGroup)}
                layers={["arcs", CenteredMetric]}
              />
            </div>
            <div className="space-y-6 w-min whitespace-nowrap">
              {chartData.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2.5 w-24">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: item.color,
                      }}
                    />
                    <span className="text-custom-text-300 text-sm font-medium capitalize">{item.label}</span>
                  </div>
                  <span className="text-custom-text-400 text-sm">{item.value.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full grid place-items-center">
          <IssuesByStateGroupEmptyState />
        </div>
      )}
    </Card>
  );
});
