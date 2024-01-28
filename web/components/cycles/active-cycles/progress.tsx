import { FC } from "react";
// ui
import { LinearProgressIndicator } from "@plane/ui";
// types
import { ICycle } from "@plane/types";
// constants
import { WORKSPACE_ACTIVE_CYCLE_STATE_GROUPS_DETAILS } from "constants/cycle";

export type ActiveCycleProgressProps = {
  cycle: ICycle;
};

export const ActiveCycleProgress: FC<ActiveCycleProgressProps> = (props) => {
  const { cycle } = props;

  const progressIndicatorData = WORKSPACE_ACTIVE_CYCLE_STATE_GROUPS_DETAILS.map((group, index) => ({
    id: index,
    name: group.title,
    value: cycle.total_issues > 0 ? (cycle[group.key as keyof ICycle] as number) : 0,
    color: group.color,
  }));

  const groupedIssues: any = {
    completed: cycle.completed_issues,
    started: cycle.started_issues,
    unstarted: cycle.unstarted_issues,
    backlog: cycle.backlog_issues,
  };

  return (
    <div className="flex flex-col gap-4 px-3 pt-2 min-h-52 border-r-0 border-t border-custom-border-300 lg:border-r">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-medium">Progress</h3>
        <span className="flex gap-1 text-sm whitespace-nowrap rounded-sm px-3 py-1 ">
          {`${cycle.completed_issues + cycle.cancelled_issues}/${cycle.total_issues - cycle.cancelled_issues} ${
            cycle.completed_issues + cycle.cancelled_issues > 1 ? "Issues" : "Issue"
          } closed`}
        </span>
      </div>
      <LinearProgressIndicator data={progressIndicatorData} />
      <div>
        <div className="flex flex-col gap-2">
          {Object.keys(groupedIssues).map((group, index) => (
            <div key={index}>
              {groupedIssues[group] > 0 && (
                <div className="flex items-center justify-start gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="block h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: WORKSPACE_ACTIVE_CYCLE_STATE_GROUPS_DETAILS[index].color,
                      }}
                    />
                    <span className="capitalize font-medium w-16">{group}</span>
                  </div>
                  <span>{`: ${groupedIssues[group]} ${groupedIssues[group] > 1 ? "Issues" : "Issue"}`}</span>
                </div>
              )}
            </div>
          ))}
          {cycle.cancelled_issues > 0 && (
            <span className="flex items-center gap-2 text-sm text-custom-text-300">
              <span>
                {`${cycle.cancelled_issues} cancelled ${
                  cycle.cancelled_issues > 1 ? "issues are" : "issue is"
                } excluded from this report.`}{" "}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
