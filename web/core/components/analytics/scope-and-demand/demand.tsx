// types
import { IDefaultAnalyticsResponse, TStateGroups } from "@plane/types";
// constants
import { Card } from "@plane/ui";
import { STATE_GROUPS } from "@/constants/state";

type Props = {
  defaultAnalytics: IDefaultAnalyticsResponse;
};

export const AnalyticsDemand: React.FC<Props> = ({ defaultAnalytics }) => (
  <Card>
    <div>
      <h4 className="text-base font-medium text-custom-text-100">Total open tasks</h4>
      <h3 className="mt-1 text-xl font-semibold">{defaultAnalytics.open_issues}</h3>
    </div>
    <div className="space-y-6 pb-2">
      {defaultAnalytics?.open_issues_classified.map((group) => {
        const percentage = ((group.state_count / defaultAnalytics.total_issues) * 100).toFixed(0);

        return (
          <div key={group.state_group} className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: STATE_GROUPS[group.state_group as TStateGroups].color,
                  }}
                />
                <h6 className="capitalize">{group.state_group}</h6>
                <span className="ml-1 rounded-3xl bg-custom-background-80 px-2 py-0.5 text-[0.65rem] text-custom-text-200">
                  {group.state_count}
                </span>
              </div>
              <p className="text-custom-text-200">{percentage}%</p>
            </div>
            <div className="bar relative h-1 w-full rounded bg-custom-background-80">
              <div
                className="absolute left-0 top-0 h-1 rounded duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: STATE_GROUPS[group.state_group as TStateGroups].color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  </Card>
);
