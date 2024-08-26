import { FC } from "react";
// types
import { ICycle } from "@plane/types";
// ui
import { LinearProgressIndicator, Loader } from "@plane/ui";
// constants
import { PROGRESS_STATE_GROUPS_DETAILS } from "@/constants/common";

export type ActiveCycleProgressProps = {
  cycle: ICycle;
};

export const ActiveCycleProgress: FC<ActiveCycleProgressProps> = (props) => {
  const { cycle } = props;

  const progressIndicatorData = PROGRESS_STATE_GROUPS_DETAILS.map((group, index) => ({
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
    <div className="flex flex-col gap-4 p-4 min-h-52 border border-custom-border-200 rounded-lg">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg text-custom-text-300 font-medium">Progress</h3>
        {cycle.completed_issues !== undefined ? (
          <span className="flex gap-1 text-sm text-custom-text-400 font-medium whitespace-nowrap rounded-sm px-3 py-1 ">
            {`${cycle.completed_issues + cycle.cancelled_issues}/${cycle.total_issues - cycle.cancelled_issues} ${
              cycle.completed_issues + cycle.cancelled_issues > 1 ? "Issues" : "Issue"
            } closed`}
          </span>
        ) : (
          <Loader>
            <Loader.Item height="20px" width="50px" />
          </Loader>
        )}
      </div>
      {progressIndicatorData ? (
        <LinearProgressIndicator size="lg" data={progressIndicatorData} />
      ) : (
        <Loader>
          <Loader.Item width="100%" height="10px" />
        </Loader>
      )}
      <div>
        <div className="flex flex-col gap-3">
          {Object.keys(groupedIssues).map((group, index) => (
            <>
              {groupedIssues[group] && groupedIssues[group] > 0 ? (
                <div key={index}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="block h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: PROGRESS_STATE_GROUPS_DETAILS[index].color,
                        }}
                      />
                      <span className="text-custom-text-300 capitalize font-medium w-16">{group}</span>
                    </div>
                    <span className="text-custom-text-300">{`${groupedIssues[group]} ${
                      groupedIssues[group] > 1 ? "Issues" : "Issue"
                    }`}</span>
                  </div>
                </div>
              ) : (
                groupedIssues[group] === undefined && (
                  <div key={index}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="block h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: PROGRESS_STATE_GROUPS_DETAILS[index].color,
                          }}
                        />
                        <span className="text-custom-text-300 capitalize font-medium w-16">{group}</span>
                      </div>
                      <Loader>
                        <Loader.Item width="50px" height="20px" />
                      </Loader>
                    </div>
                  </div>
                )
              )}
            </>
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
