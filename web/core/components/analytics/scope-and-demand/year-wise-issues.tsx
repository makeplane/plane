// plane imports
import { observer } from "mobx-react";
import { MONTHS_LIST } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IDefaultAnalyticsResponse } from "@plane/types";
import { Card } from "@plane/ui";
// components
import { LineGraph, ProfileEmptyState } from "@/components/ui";
// image
import emptyGraph from "@/public/empty-state/empty_graph.svg";

type Props = {
  defaultAnalytics: IDefaultAnalyticsResponse;
};

export const AnalyticsYearWiseIssues: React.FC<Props> = observer(({ defaultAnalytics }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <h1 className="py-3 text-base font-medium">Issues closed in a year</h1>
      {defaultAnalytics.issue_completed_month_wise.length > 0 ? (
        <LineGraph
          data={[
            {
              id: "issues_closed",
              color: "rgb(var(--color-primary-100))",
              data: Object.entries(MONTHS_LIST).map(([index, month]) => ({
                x: t(month.i18n_shortTitle),
                y:
                  defaultAnalytics.issue_completed_month_wise.find((data) => data.month === parseInt(index, 10))
                    ?.count || 0,
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
            <div className="rounded-md border border-custom-border-200 bg-custom-background-80 p-2 text-xs">
              {datum.slice.points[0].data.yFormatted}
              <span className="text-custom-text-200"> issues closed in </span>
              {datum.slice.points[0].data.xFormatted}
            </div>
          )}
          theme={{
            background: "rgb(var(--color-background-100))",
          }}
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
    </Card>
  );
});
