// ui
import { LineGraph, ProfileEmptyState } from "components/ui";
// image
import emptyGraph from "public/empty-state/empty_graph.svg";
// types
import { IDefaultAnalyticsResponse } from "@plane/types";
// constants
import { MONTHS_LIST } from "constants/calendar";

type Props = {
  defaultAnalytics: IDefaultAnalyticsResponse;
};

export const AnalyticsYearWiseIssues: React.FC<Props> = ({ defaultAnalytics }) => (
  <div className="rounded-[10px] border border-neutral-border-medium py-3">
    <h1 className="px-3 text-base font-medium">Issues closed in a year</h1>
    {defaultAnalytics.issue_completed_month_wise.length > 0 ? (
      <LineGraph
        data={[
          {
            id: "issues_closed",
            color: "var(--color-primary-90)",
            data: Object.entries(MONTHS_LIST).map(([index, month]) => ({
              x: month.shortTitle,
              y:
                defaultAnalytics.issue_completed_month_wise.find((data) => data.month === parseInt(index, 10))?.count ||
                0,
            })),
          },
        ]}
        customYAxisTickValues={defaultAnalytics.issue_completed_month_wise.map((data) => data.count)}
        height="300px"
        colors={(datum) => datum.color}
        curve="monotoneX"
        margin={{ top: 20 }}
        enableSlices="x"
        sliceTooltip={(datum) => (
          <div className="rounded-md border border-neutral-border-medium bg-neutral-component-surface-dark p-2 text-xs">
            {datum.slice.points[0].data.yFormatted}
            <span className="text-neutral-text-medium"> issues closed in </span>
            {datum.slice.points[0].data.xFormatted}
          </div>
        )}
        enableArea
      />
    ) : (
      <div className="px-7 py-4">
        <ProfileEmptyState
          title="No Data yet"
          description="Close issues to view analysis of the same in the form of a graph."
          image={emptyGraph}
        />
      </div>
    )}
  </div>
);
