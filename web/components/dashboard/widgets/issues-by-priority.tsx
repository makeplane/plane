import { useEffect, useState } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
// hooks
import { useDashboard } from "hooks/store";
// components
import { MarimekkoGraph } from "components/ui";
import { IssuesByPriorityWidgetLoader } from "components/dashboard/widgets";
// types
import { IIssuesByPriorityWidgetResponse } from "@plane/types";
// constants
import { PRIORITY_GRAPH_GRADIENTS } from "constants/dashboard";

const TEXT_COLORS = {
  urgent: "#F4A9AA",
  high: "#AB4800",
  medium: "#AB6400",
  low: "#C1D0FF",
  none: "#60646C",
};

const CustomBar = (props: any) => {
  const { bar, workspaceSlug } = props;
  // states
  const [isMouseOver, setIsMouseOver] = useState(false);

  return (
    <Link href={`/${workspaceSlug}/workspace-views/?priority=${bar?.id}`}>
      <g
        transform={`translate(${bar?.x},${bar?.y})`}
        onMouseEnter={() => setIsMouseOver(true)}
        onMouseLeave={() => setIsMouseOver(false)}
      >
        {/* Actual Bar */}
        <rect
          x={0}
          y={isMouseOver ? -11 : 0}
          width={bar?.width}
          height={isMouseOver ? bar?.height + 11 : bar?.height}
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

type Props = {
  dashboardId: string;
  workspaceSlug: string;
};

const WIDGET_KEY = "issues_by_priority";

export const IssuesByPriorityWidget: React.FC<Props> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // store hooks
  const { getWidgetStats, fetchWidgetStats, widgetStats: allWidgetStats } = useDashboard();
  const widgetStats = getWidgetStats<IIssuesByPriorityWidgetResponse[]>(workspaceSlug, dashboardId, WIDGET_KEY);

  useEffect(() => {
    if (!widgetStats) fetchWidgetStats(workspaceSlug, dashboardId, WIDGET_KEY);
  }, [dashboardId, fetchWidgetStats, widgetStats, workspaceSlug]);

  console.log("allWidgetStats", allWidgetStats);

  if (!widgetStats) return <IssuesByPriorityWidgetLoader />;

  const totalCount = widgetStats.reduce((acc, item) => acc + item?.count, 0);
  const chartData = widgetStats.map((item) => ({
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
    <Link
      href={`/${workspaceSlug}/workspace-views/assigned`}
      className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full py-6 hover:shadow-custom-shadow-4xl duration-300"
    >
      <div className="flex items-center justify-between gap-2 px-7">
        <h4 className="text-lg font-semibold text-custom-text-300">Priority of assigned issues</h4>
      </div>
      <div className="flex items-center px-11 h-full">
        <div className="w-full -mt-[11px]">
          <MarimekkoGraph
            data={chartData}
            id="priority"
            value="percentage"
            dimensions={[
              {
                id: "urgent",
                value: "urgent",
              },
              {
                id: "high",
                value: "high",
              },
              {
                id: "medium",
                value: "medium",
              },
              {
                id: "low",
                value: "low",
              },
              {
                id: "none",
                value: "none",
              },
            ]}
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
            fill={[
              {
                match: {
                  id: "urgent",
                },
                id: "gradientUrgent",
              },
              {
                match: {
                  id: "high",
                },
                id: "gradientHigh",
              },
              {
                match: {
                  id: "medium",
                },
                id: "gradientMedium",
              },
              {
                match: {
                  id: "low",
                },
                id: "gradientLow",
              },
              {
                match: {
                  id: "none",
                },
                id: "gradientNone",
              },
            ]}
            tooltip={() => <></>}
            enableGridX={false}
            enableGridY={false}
            layers={[CustomBarsLayer]}
          />
          <div className="flex items-center gap-1 w-full mt-2 text-sm font-semibold text-custom-text-300">
            {/* TODO: add priority icon */}
            {chartData.map((item) => (
              <p
                key={item.priority}
                style={{
                  width: `${item.percentage}%`,
                }}
              >
                {item.percentage.toFixed(0)}%
              </p>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
});
