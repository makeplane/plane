import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useDashboard } from "hooks/store";
// components
import { PieGraph } from "components/ui";
import {
  DurationFilterDropdown,
  IssuesByStateGroupEmptyState,
  WidgetLoader,
  WidgetProps,
} from "components/dashboard/widgets";
// helpers
import { getCustomDates } from "helpers/dashboard.helper";
// types
import { TIssuesByStateGroupsWidgetFilters, TIssuesByStateGroupsWidgetResponse, TStateGroups } from "@plane/types";
// constants
import { STATE_GROUP_GRAPH_COLORS, STATE_GROUP_GRAPH_GRADIENTS } from "constants/dashboard";
import { STATE_GROUPS } from "constants/state";

const WIDGET_KEY = "issues_by_state_groups";

export const IssuesByStateGroupWidget: React.FC<WidgetProps> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // states
  const [defaultStateGroup, setDefaultStateGroup] = useState<TStateGroups | null>(null);
  const [activeStateGroup, setActiveStateGroup] = useState<TStateGroups | null>(null);
  // router
  const router = useRouter();
  // store hooks
  const { fetchWidgetStats, getWidgetDetails, getWidgetStats, updateDashboardWidgetFilters } = useDashboard();
  // derived values
  const widgetDetails = getWidgetDetails(workspaceSlug, dashboardId, WIDGET_KEY);
  const widgetStats = getWidgetStats<TIssuesByStateGroupsWidgetResponse[]>(workspaceSlug, dashboardId, WIDGET_KEY);

  const handleUpdateFilters = async (filters: Partial<TIssuesByStateGroupsWidgetFilters>) => {
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

  // fetch widget stats
  useEffect(() => {
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
      target_date: getCustomDates(widgetDetails?.widget_filters.target_date ?? "this_week"),
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
    <div className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full py-6 hover:shadow-custom-shadow-4xl duration-300 overflow-hidden min-h-96 flex flex-col">
      <div className="flex items-start justify-between gap-2 pl-7 pr-6">
        <div>
          <Link
            href={`/${workspaceSlug}/workspace-views/assigned`}
            className="text-lg font-semibold text-custom-text-300 hover:underline"
          >
            Assigned by state
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
        <div className="flex items-center pl-10 md:pl-11 lg:pl-14 pr-11 mt-11">
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
    </div>
  );
});
