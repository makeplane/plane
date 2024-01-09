import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useDashboard } from "hooks/store";
// components
import { PieGraph } from "components/ui";
import { IssuesByStateGroupWidgetLoader } from "components/dashboard/widgets";
// types
import { IIssuesByStateGroupsWidgetResponse, TStateGroups } from "@plane/types";
// constants
import { STATE_GROUP_GRAPH_COLORS, STATE_GROUP_GRAPH_GRADIENTS } from "constants/dashboard";

type Props = {
  dashboardId: string;
  workspaceSlug: string;
};

const WIDGET_KEY = "issues_by_state_groups";

export const IssuesByStateGroupWidget: React.FC<Props> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // states
  const [activeStateGroup, setActiveStateGroup] = useState<TStateGroups>("started");
  // router
  const router = useRouter();
  // store hooks
  const { getWidgetStats, fetchWidgetStats, widgetStats: allWidgetStats } = useDashboard();
  const widgetStats = getWidgetStats<IIssuesByStateGroupsWidgetResponse[]>(workspaceSlug, dashboardId, WIDGET_KEY);

  useEffect(() => {
    if (!widgetStats) fetchWidgetStats(workspaceSlug, dashboardId, WIDGET_KEY);
  }, [dashboardId, fetchWidgetStats, widgetStats, workspaceSlug]);

  console.log("allWidgetStats", allWidgetStats);
  console.log("widgetStats", widgetStats);

  if (!widgetStats) return <IssuesByStateGroupWidgetLoader />;

  const totalCount = widgetStats?.reduce((acc, item) => acc + item?.count, 0);
  const chartData = widgetStats?.map((item) => ({
    color: STATE_GROUP_GRAPH_COLORS[item?.state__group as keyof typeof STATE_GROUP_GRAPH_COLORS],
    id: item?.state__group,
    label: item?.state__group,
    value: (item?.count / totalCount) * 100,
  }));

  const CenteredMetric = ({ dataWithArc, centerX, centerY }: any) => {
    const data = dataWithArc.find((datum: any) => datum.id === activeStateGroup);
    const percentage = chartData?.find((item) => item.id === activeStateGroup)?.value.toFixed(0);

    return (
      <g>
        <text
          x={centerX}
          y={centerY - 8}
          textAnchor="middle"
          dominantBaseline="central"
          className="text-3xl font-semibold"
          style={{
            fill: data.color,
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
          {data.id}
        </text>
      </g>
    );
  };

  return (
    <Link
      href={`/${workspaceSlug?.toString()}/workspace-views/assigned`}
      className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full py-6 hover:shadow-custom-shadow-4xl duration-300"
    >
      <div className="flex items-center justify-between gap-2 px-7">
        <h4 className="text-lg font-semibold text-custom-text-300">State of assigned issues</h4>
      </div>
      <div className="flex items-center pl-20 md:pl-11 lg:pl-20 pr-11 mt-4">
        <div className="flex md:flex-col lg:flex-row items-center gap-x-10 gap-y-8 w-full">
          <div className="w-full flex justify-center">
            <PieGraph
              data={chartData}
              height="220px"
              width="220px"
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
              fill={[
                {
                  match: {
                    id: "backlog",
                  },
                  id: "gradientBacklog",
                },
                {
                  match: {
                    id: "unstarted",
                  },
                  id: "gradientUnstarted",
                },
                {
                  match: {
                    id: "started",
                  },
                  id: "gradientStarted",
                },
                {
                  match: {
                    id: "completed",
                  },
                  id: "gradientCompleted",
                },
                {
                  match: {
                    id: "cancelled",
                  },
                  id: "gradientCanceled",
                },
              ]}
              onClick={(datum, e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/${workspaceSlug}/workspace-views/assigned/?state_group=${datum.id}`);
              }}
              onMouseEnter={(datum) => setActiveStateGroup(datum.id as TStateGroups)}
              layers={["arcs", CenteredMetric]}
            />
          </div>
          <div className="justify-self-end space-y-6 w-min whitespace-nowrap">
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
    </Link>
  );
});
