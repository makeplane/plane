// icons
import { PlayIcon } from "@heroicons/react/24/outline";
// types
import { IDefaultAnalyticsResponse } from "types";
// constants
import { STATE_GROUP_COLORS } from "constants/state";

type Props = {
  defaultAnalytics: IDefaultAnalyticsResponse;
};

export const AnalyticsDemand: React.FC<Props> = ({ defaultAnalytics }) => (
  <div className="space-y-3 self-start rounded-[10px] border border-brand-base p-3">
    <h5 className="text-xs text-red-500">DEMAND</h5>
    <div>
      <h4 className="text-brand-bas text-base font-medium">Total open tasks</h4>
      <h3 className="mt-1 text-xl font-semibold">{defaultAnalytics.open_issues}</h3>
    </div>
    <div className="space-y-6">
      {defaultAnalytics.open_issues_classified.map((group) => {
        const percentage = ((group.state_count / defaultAnalytics.total_issues) * 100).toFixed(0);

        return (
          <div key={group.state_group} className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: STATE_GROUP_COLORS[group.state_group],
                  }}
                />
                <h6 className="capitalize">{group.state_group}</h6>
                <span className="ml-1 rounded-3xl bg-brand-surface-2 px-2 py-0.5 text-[0.65rem] text-brand-secondary">
                  {group.state_count}
                </span>
              </div>
              <p className="text-brand-secondary">{percentage}%</p>
            </div>
            <div className="bar relative h-1 w-full rounded bg-brand-base">
              <div
                className="absolute top-0 left-0 h-1 rounded duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: STATE_GROUP_COLORS[group.state_group],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
    <div className="!mt-6 flex w-min items-center gap-2 whitespace-nowrap rounded-md border border-brand-base bg-brand-base p-2 text-xs">
      <p className="flex items-center gap-1 text-brand-secondary">
        <PlayIcon className="h-4 w-4 -rotate-90" aria-hidden="true" />
        <span>Estimate Demand:</span>
      </p>
      <p className="font-medium">
        {defaultAnalytics.open_estimate_sum}/{defaultAnalytics.total_estimate_sum}
      </p>
    </div>
  </div>
);
