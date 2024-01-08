import { useEffect } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
// hooks
import { useDashboard } from "hooks/store";
// components
import { PieGraph } from "components/ui";
import { IssuesByStateGroupWidgetLoader } from "components/dashboard/widgets";
// types
import { IIssuesByStateGroupsWidgetResponse } from "@plane/types";
// constants
import { STATE_GROUP_COLORS } from "constants/state";
import { STATE_GROUP_GRAPH_GRADIENTS } from "constants/dashboard";

type Props = {
  dashboardId: string;
  workspaceSlug: string;
};

const WIDGET_KEY = "issues_by_state_groups";

export const IssuesByStateGroupWidget: React.FC<Props> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
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
    id: item?.state__group,
    label: item?.state__group,
    value: (item?.count / totalCount) * 100,
  }));

  return (
    <Link
      href={`/${workspaceSlug?.toString()}/workspace-views/assigned`}
      className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full py-6 hover:shadow-custom-shadow-4xl duration-300"
    >
      <div className="flex items-center justify-between gap-2 px-7">
        <h4 className="text-lg font-semibold text-custom-text-300">State of assigned issues</h4>
      </div>
      <div className="flex items-center pl-20 md:pl-11 lg:pl-20 pr-11 mt-4">
        <div className="flex md:flex-col lg:flex-row items-center gap-x-10 gap-y-4 w-full">
          <div className="w-full">
            <PieGraph
              data={chartData}
              height="200px"
              width="200px"
              innerRadius={0.6}
              cornerRadius={5}
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
              onClick={(datum) => {
                // TODO: add update filters logic
                console.log("datum", datum);
              }}
            />
          </div>
          <div className="justify-self-end space-y-6 w-min whitespace-nowrap">
            {chartData.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2.5 w-24">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: STATE_GROUP_COLORS[item.id as keyof typeof STATE_GROUP_COLORS],
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
