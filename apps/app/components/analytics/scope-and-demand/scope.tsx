// ui
import { BarGraph } from "components/ui";
// types
import { IDefaultAnalyticsResponse } from "types";

type Props = {
  defaultAnalytics: IDefaultAnalyticsResponse;
};

export const AnalyticsScope: React.FC<Props> = ({ defaultAnalytics }) => (
  <div className="rounded-[10px] border border-brand-base">
    <h5 className="p-3 text-xs text-green-500">SCOPE</h5>
    <div className="divide-y divide-brand-base">
      <div>
        <h6 className="px-3 text-base font-medium">Pending issues</h6>
        {defaultAnalytics.pending_issue_user.length > 0 ? (
          <BarGraph
            data={defaultAnalytics.pending_issue_user}
            indexBy="assignees__email"
            keys={["count"]}
            height="250px"
            colors={() => `#f97316`}
            customYAxisTickValues={defaultAnalytics.pending_issue_user.map((d) => d.count)}
            tooltip={(datum) => {
              const assignee = defaultAnalytics.pending_issue_user.find(
                (a) => a.assignees__email === `${datum.indexValue}`
              );

              return (
                <div className="rounded-md border border-brand-base bg-brand-surface-2 p-2 text-xs">
                  <span className="font-medium text-brand-secondary">
                    {assignee
                      ? assignee.assignees__first_name + " " + assignee.assignees__last_name
                      : "No assignee"}
                    :{" "}
                  </span>
                  {datum.value}
                </div>
              );
            }}
            axisBottom={{
              renderTick: (datum) => {
                const avatar =
                  defaultAnalytics.pending_issue_user[datum.tickIndex].assignees__avatar ?? "";

                if (avatar && avatar !== "")
                  return (
                    <g transform={`translate(${datum.x},${datum.y})`}>
                      <image
                        x={-8}
                        y={10}
                        width={16}
                        height={16}
                        xlinkHref={avatar}
                        style={{ clipPath: "circle(50%)" }}
                      />
                    </g>
                  );
                else
                  return (
                    <g transform={`translate(${datum.x},${datum.y})`}>
                      <circle cy={18} r={8} fill="#374151" />
                      <text x={0} y={21} textAnchor="middle" fontSize={9} fill="#ffffff">
                        {datum.value ? `${datum.value}`.toUpperCase()[0] : "?"}
                      </text>
                    </g>
                  );
              },
            }}
            margin={{ top: 20 }}
            theme={{
              background: "rgb(var(--color-bg-base))",
              axis: {},
            }}
          />
        ) : (
          <div className="text-brand-secondary text-center text-sm py-8">
            No matching data found.
          </div>
        )}
      </div>
    </div>
  </div>
);
