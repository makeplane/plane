"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// types
import { ICycle, IIssueFilterOptions } from "@plane/types";
// ui
import { LinearProgressIndicator, Loader } from "@plane/ui";
// components
import { EmptyState } from "@/components/empty-state";
// constants
import { PROGRESS_STATE_GROUPS_DETAILS } from "@/constants/common";
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useProjectState } from "@/hooks/store";

export type ActiveCycleProgressProps = {
  cycle: ICycle | null;
  workspaceSlug: string;
  projectId: string;
  handleFiltersUpdate: (key: keyof IIssueFilterOptions, value: string[], redirect?: boolean) => void;
};

export const ActiveCycleProgress: FC<ActiveCycleProgressProps> = observer((props) => {
  const { handleFiltersUpdate, cycle } = props;
  // store hooks
  const { groupedProjectStates } = useProjectState();

  // derived values
  const progressIndicatorData = PROGRESS_STATE_GROUPS_DETAILS.map((group, index) => ({
    id: index,
    name: group.title,
    value: cycle && cycle.total_issues > 0 ? (cycle[group.key as keyof ICycle] as number) : 0,
    color: group.color,
  }));
  const groupedIssues: any = cycle
    ? {
        completed: cycle?.completed_issues,
        started: cycle?.started_issues,
        unstarted: cycle?.unstarted_issues,
        backlog: cycle?.backlog_issues,
      }
    : {};

  return cycle && cycle.hasOwnProperty("started_issues") ? (
    <div className="flex flex-col min-h-[17rem] gap-5 py-4 px-3.5 bg-custom-background-100 border border-custom-border-200 rounded-lg">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base text-custom-text-300 font-semibold">Progress</h3>
          {cycle.total_issues > 0 && (
            <span className="flex gap-1 text-sm text-custom-text-400 font-medium whitespace-nowrap rounded-sm px-3 py-1 ">
              {`${cycle.completed_issues + cycle.cancelled_issues}/${cycle.total_issues - cycle.cancelled_issues} ${
                cycle.completed_issues + cycle.cancelled_issues > 1 ? "Issues" : "Issue"
              } closed`}
            </span>
          )}
        </div>
        {cycle.total_issues > 0 && <LinearProgressIndicator size="lg" data={progressIndicatorData} />}
      </div>

      {cycle.total_issues > 0 ? (
        <div className="flex flex-col gap-5">
          {Object.keys(groupedIssues).map((group, index) => (
            <>
              {groupedIssues[group] > 0 && (
                <div key={index}>
                  <div
                    className="flex items-center justify-between gap-2 text-sm cursor-pointer"
                    onClick={() => {
                      if (groupedProjectStates) {
                        const states = groupedProjectStates[group].map((state) => state.id);
                        handleFiltersUpdate("state", states, true);
                      }
                    }}
                  >
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
      ) : (
        <div className="flex items-center justify-center h-full w-full">
          <EmptyState type={EmptyStateType.ACTIVE_CYCLE_PROGRESS_EMPTY_STATE} layout="screen-simple" size="sm" />
        </div>
      )}
    </div>
  ) : (
    <Loader className="flex flex-col min-h-[17rem] gap-5 bg-custom-background-100 border border-custom-border-200 rounded-lg">
      <Loader.Item width="100%" height="100%" />
    </Loader>
  );
});
