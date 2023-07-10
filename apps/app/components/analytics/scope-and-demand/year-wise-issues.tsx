// ui
import { LineGraph } from "components/ui";
// types
import { IDefaultAnalyticsResponse } from "types";
// constants
import { MONTHS_LIST } from "constants/calendar";

type Props = {
  defaultAnalytics: IDefaultAnalyticsResponse;
};

export const AnalyticsYearWiseIssues: React.FC<Props> = ({ defaultAnalytics }) => {
  const currentMonth = new Date().getMonth();
  const startMonth = Math.floor(currentMonth / 3) * 3 + 1;
  const quarterMonthsList = [startMonth, startMonth + 1, startMonth + 2];

  return (
    <div className="py-3 border border-brand-base rounded-[10px]">
      <h1 className="px-3 text-base font-medium">Issues closed in a year</h1>
      {defaultAnalytics.issue_completed_month_wise.length > 0 ? (
        <LineGraph
          data={[
            {
              id: "issues_closed",
              color: "rgb(var(--color-primary-100))",
              data: MONTHS_LIST.map((month) => ({
                x: month.label.substring(0, 3),
                y:
                  defaultAnalytics.issue_completed_month_wise.find(
                    (data) => data.month === month.value
                  )?.count || 0,
              })),
            },
          ]}
          customYAxisTickValues={defaultAnalytics.issue_completed_month_wise.map((data) => {
            if (quarterMonthsList.includes(data.month)) return data.count;

            return 0;
          })}
          height="300px"
          colors={(datum) => datum.color}
          curve="monotoneX"
          margin={{ top: 20 }}
          enableSlices="x"
          sliceTooltip={(datum) => (
            <div className="rounded-md border border-brand-base bg-brand-surface-2 p-2 text-xs">
              {datum.slice.points[0].data.yFormatted}
              <span className="text-brand-secondary"> issues closed in </span>
              {datum.slice.points[0].data.xFormatted}
            </div>
          )}
          theme={{
            background: "rgb(var(--color-background-100))",
          }}
          enableArea
        />
      ) : (
        <div className="text-brand-secondary text-center text-sm py-8">No matching data found.</div>
      )}
    </div>
  );
};
