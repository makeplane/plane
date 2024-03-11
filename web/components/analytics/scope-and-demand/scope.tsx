// ui
import { BarGraph, ProfileEmptyState } from "components/ui";
// image
import emptyBarGraph from "public/empty-state/empty_bar_graph.svg";
// types
import { IDefaultAnalyticsResponse } from "@plane/types";

type Props = {
  defaultAnalytics: IDefaultAnalyticsResponse;
};

export const AnalyticsScope: React.FC<Props> = ({ defaultAnalytics }) => (
  <div className="rounded-[10px] border border-custom-border-200">
    <h5 className="p-3 text-xs text-green-500">SCOPE</h5>
    <div className="divide-y divide-custom-border-200">
      <div>
        <h6 className="px-3 text-base font-medium">Pending issues</h6>
        {defaultAnalytics.pending_issue_user && defaultAnalytics.pending_issue_user.length > 0 ? (
          <BarGraph
            data={defaultAnalytics.pending_issue_user}
            indexBy="assignees__id"
            keys={["count"]}
            height="250px"
            colors={() => `#f97316`}
            customYAxisTickValues={defaultAnalytics.pending_issue_user.map((d) => (d.count > 0 ? d.count : 50))}
            tooltip={(datum) => {
              const assignee = defaultAnalytics.pending_issue_user.find(
                (a) => a.assignees__id === `${datum.indexValue}`
              );

              return (
                <div className="rounded-md border border-custom-border-200 bg-custom-background-80 p-2 text-xs">
                  <span className="font-medium text-custom-text-200">
                    {assignee ? assignee.assignees__display_name : "No assignee"}:{" "}
                  </span>
                  {datum.value}
                </div>
              );
            }}
            axisBottom={{
              renderTick: (datum) => {
                const assignee = defaultAnalytics.pending_issue_user[datum.tickIndex] ?? "";

                if (assignee && assignee?.assignees__avatar && assignee?.assignees__avatar !== "")
                  return (
                    <g transform={`translate(${datum.x},${datum.y})`}>
                      <image
                        x={-8}
                        y={10}
                        width={16}
                        height={16}
                        xlinkHref={assignee?.assignees__avatar}
                        style={{ clipPath: "circle(50%)" }}
                      />
                    </g>
                  );
                else
                  return (
                    <g transform={`translate(${datum.x},${datum.y})`}>
                      <circle cy={18} r={8} fill="#374151" />
                      <text x={0} y={21} textAnchor="middle" fontSize={9} fill="#ffffff">
                        {datum.value ? `${assignee.assignees__display_name}`.toUpperCase()[0] : "?"}
                      </text>
                    </g>
                  );
              },
            }}
            margin={{ top: 20 }}
            theme={{
              axis: {},
            }}
          />
        ) : (
          <div className="px-7 py-4">
            <ProfileEmptyState
              title="No Data yet"
              description="Analysis of pending issues by co-workers appears here."
              image={emptyBarGraph}
            />
          </div>
        )}
      </div>
    </div>
  </div>
);
