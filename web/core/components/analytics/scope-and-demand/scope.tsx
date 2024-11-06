// plane types
import { IDefaultAnalyticsUser } from "@plane/types";
// plane ui
import { Card } from "@plane/ui";
// components
import { BarGraph, ProfileEmptyState } from "@/components/ui";
// helpers
import { getFileURL } from "@/helpers/file.helper";
// image
import emptyBarGraph from "@/public/empty-state/empty_bar_graph.svg";

type Props = {
  pendingUnAssignedIssuesUser: IDefaultAnalyticsUser | undefined;
  pendingAssignedIssues: IDefaultAnalyticsUser[];
};

export const AnalyticsScope: React.FC<Props> = ({ pendingUnAssignedIssuesUser, pendingAssignedIssues }) => (
  <Card>
    <div className="divide-y divide-custom-border-200">
      <div>
        <div className="flex items-center justify-between">
          <h6 className="text-base font-medium">Pending issues</h6>
          {pendingUnAssignedIssuesUser && (
            <div className="relative flex items-center py-1 px-3 rounded-md gap-2  text-xs text-custom-primary-100  bg-custom-primary-100/10">
              Unassigned: {pendingUnAssignedIssuesUser.count}
            </div>
          )}
        </div>

        {pendingAssignedIssues && pendingAssignedIssues.length > 0 ? (
          <BarGraph
            data={pendingAssignedIssues}
            indexBy="assignees__id"
            keys={["count"]}
            height="250px"
            colors={() => `#f97316`}
            customYAxisTickValues={pendingAssignedIssues.map((d) => (d.count > 0 ? d.count : 50))}
            tooltip={(datum) => {
              const assignee = pendingAssignedIssues.find((a) => a.assignees__id === `${datum.indexValue}`);

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
                const assignee = pendingAssignedIssues[datum.tickIndex] ?? "";

                if (assignee && assignee?.assignees__avatar_url && assignee?.assignees__avatar_url !== "")
                  return (
                    <g transform={`translate(${datum.x},${datum.y})`}>
                      <image
                        x={-8}
                        y={10}
                        width={16}
                        height={16}
                        xlinkHref={getFileURL(assignee?.assignees__avatar_url)}
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
  </Card>
);
