// ui
import { BarGraph, LineGraph } from "components/ui";
// types
import { IDefaultAnalyticsResponse } from "types";
// constants
import { MONTHS_LIST } from "constants/calendar";

type Props = {
  defaultAnalytics: IDefaultAnalyticsResponse;
};

export const AnalyticsScope: React.FC<Props> = ({ defaultAnalytics }) => {
  const currentMonth = new Date().getMonth();
  const startMonth = Math.floor(currentMonth / 3) * 3 + 1;
  const quarterMonthsList = [startMonth, startMonth + 1, startMonth + 2];

  return (
    <div className="rounded-[10px] border border-brand-base">
      <h5 className="p-3 text-xs text-green-500">SCOPE</h5>
      <div className="divide-y divide-brand-base">
        <div>
          <h6 className="px-3 text-base font-medium">Pending issues</h6>
          <BarGraph
            data={defaultAnalytics.pending_issue_user}
            indexBy="assignees__email"
            keys={["count"]}
            height="250px"
            colors={() => `#f97316`}
            tooltip={(datum) => (
              <div className="rounded-md border border-brand-base bg-brand-base p-2 text-xs">
                <span className="font-medium text-brand-secondary">
                  Issue count- {datum.indexValue ?? "No assignee"}:{" "}
                </span>
                {datum.value}
              </div>
            )}
            axisBottom={{
              tickValues: [],
            }}
            margin={{ top: 20 }}
          />
        </div>
        <div className="grid grid-cols-1 divide-y divide-brand-base sm:grid-cols-2 sm:divide-x">
          <div className="p-3">
            <h6 className="text-base font-medium">Most issues created</h6>
            <div className="mt-3 space-y-3">
              {defaultAnalytics.most_issue_created_user.map((user) => (
                <div
                  key={user.assignees__email}
                  className="flex items-start justify-between gap-4 text-xs"
                >
                  <span className="break-all text-brand-secondary">{user.assignees__email}</span>
                  <span className="flex-shrink-0">{user.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3">
            <h6 className="text-base font-medium">Most issues closed</h6>
            <div className="mt-3 space-y-3">
              {defaultAnalytics.most_issue_closed_user.map((user) => (
                <div
                  key={user.assignees__email}
                  className="flex items-start justify-between gap-4 text-xs"
                >
                  <span className="break-all text-brand-secondary">{user.assignees__email}</span>
                  <span className="flex-shrink-0">{user.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="py-3">
          <h1 className="px-3 text-base font-medium">Issues closed in a year</h1>
          <LineGraph
            data={[
              {
                id: "issues_closed",
                color: "rgb(var(--color-accent))",
                data: quarterMonthsList.map((month) => ({
                  x: MONTHS_LIST.find((m) => m.value === month)?.label.substring(0, 3),
                  y:
                    defaultAnalytics.issue_completed_month_wise.find((data) => data.month === month)
                      ?.count || 0,
                })),
              },
            ]}
            height="300px"
            colors={(datum) => datum.color}
            curve="monotoneX"
            margin={{ top: 20 }}
            enableArea
          />
        </div>
      </div>
    </div>
  );
};
