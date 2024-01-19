import { FC } from "react";
import Link from "next/link";
// ui
import { Tooltip, LinearProgressIndicator, Loader, PriorityIcon, Button, CycleGroupIcon } from "@plane/ui";
// components
import ProgressChart from "components/core/sidebar/progress-chart";
// types
import { ICycle, TCycleGroups } from "@plane/types";
// helpers
import { renderFormattedDate, findHowManyDaysLeft } from "helpers/date-time.helper";
import { truncateText } from "helpers/string.helper";
import { renderEmoji } from "helpers/emoji.helper";
// constants
import { STATE_GROUPS_DETAILS } from "constants/cycle";

export type ActiveCycleInfoProps = {
  cycle: ICycle;
  workspaceSlug: string;
  projectId: string;
};

export const ActiveCycleInfo: FC<ActiveCycleInfoProps> = (props) => {
  const { cycle, workspaceSlug, projectId } = props;

  const cycleIssues = cycle.issues ?? [];

  const groupedIssues: any = {
    completed: cycle.completed_issues,
    started: cycle.started_issues,
    unstarted: cycle.unstarted_issues,
    backlog: cycle.backlog_issues,
  };

  const progressIndicatorData = STATE_GROUPS_DETAILS.map((group, index) => ({
    id: index,
    name: group.title,
    value: cycle.total_issues > 0 ? (cycle[group.key as keyof ICycle] as number) : 0,
    color: group.color,
  }));

  const cuurentCycle = cycle.status.toLowerCase() as TCycleGroups;

  return (
    <>
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        {cycle.project_detail.emoji ? (
          <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
            {renderEmoji(cycle.project_detail.emoji)}
          </span>
        ) : cycle.project_detail.icon_prop ? (
          <div className="grid h-7 w-7 flex-shrink-0 place-items-center">
            {renderEmoji(cycle.project_detail.icon_prop)}
          </div>
        ) : (
          <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
            {cycle.project_detail?.name.charAt(0)}
          </span>
        )}
        <h2 className="text-xl font-semibold">{cycle.project_detail.name}</h2>
      </div>
      <div className="flex flex-col gap-2 rounded border border-custom-border-200">
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <div className="flex items-center gap-2 cursor-default">
            <CycleGroupIcon cycleGroup={cuurentCycle} className="h-4 w-4" />
            <Tooltip tooltipContent={cycle.name} position="top-left">
              <h3 className="break-words text-lg font-medium">{truncateText(cycle.name, 70)}</h3>
            </Tooltip>
            <Tooltip
              tooltipContent={`Start date: ${renderFormattedDate(
                cycle.start_date ?? ""
              )} Due Date: ${renderFormattedDate(cycle.end_date ?? "")}`}
              position="top-left"
            >
              <span className="flex gap-1 whitespace-nowrap rounded-sm text-sm px-3 py-0.5 bg-amber-500/10 text-amber-500">
                {findHowManyDaysLeft(cycle.end_date ?? new Date())} Days Left{" "}
              </span>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="rounded-sm text-sm px-3 py-1 bg-custom-background-80">
              <span className="flex gap-2 text-sm whitespace-nowrap font-medium">
                <span>Lead:</span>
                <div className="flex items-center gap-1.5">
                  {cycle.owned_by.avatar && cycle.owned_by.avatar !== "" ? (
                    <img
                      src={cycle.owned_by.avatar}
                      height={18}
                      width={18}
                      className="rounded-full"
                      alt={cycle.owned_by.display_name}
                    />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-custom-background-100 capitalize">
                      {cycle.owned_by.display_name.charAt(0)}
                    </span>
                  )}
                  <span>{cycle.owned_by.display_name}</span>
                </div>
              </span>
            </span>
            <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`}>
              <Button variant="primary" size="sm">
                View Cycle
              </Button>
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <div className="flex flex-col gap-4 px-3 pt-2 min-h-52 border-r-0 border-t border-custom-border-300 lg:border-r">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-medium">Progress</h3>
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
                  <>
                    {groupedIssues[group] > 0 && (
                      <div className="flex items-center justify-start gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="block h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: STATE_GROUPS_DETAILS[index].color,
                            }}
                          />
                          <span className="capitalize font-medium w-16">{group}</span>
                        </div>
                        <span>{`: ${groupedIssues[group]} ${groupedIssues[group] > 1 ? "Issues" : "Issue"}`}</span>
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
            </div>
          </div>

          <div className="flex flex-col gap-4 px-3 pt-2 min-h-52 border-r-0 border-t border-custom-border-300 lg:border-r">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-medium">Issue Burndown</h3>
            </div>

            <div className="relative ">
              <ProgressChart
                distribution={cycle.distribution?.completion_chart ?? {}}
                startDate={cycle.start_date ?? ""}
                endDate={cycle.end_date ?? ""}
                totalIssues={cycle.total_issues}
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 px-3 pt-2 min-h-52 overflow-hidden col-span-1 lg:col-span-2 xl:col-span-1 border-t border-custom-border-300">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-medium">Priority</h3>
            </div>
            <div className="flex flex-col gap-4 h-full w-full max-h-40 overflow-y-auto pb-3">
              {cycleIssues ? (
                cycleIssues.length > 0 ? (
                  cycleIssues.map((issue: any) => (
                    <Link
                      key={issue.id}
                      href={`/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`}
                      className="flex cursor-pointer flex-wrap items-center justify-between gap-2 rounded-md border border-custom-border-200  px-3 py-1.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <PriorityIcon priority={issue.priority} withContainer size={12} />

                        <Tooltip
                          tooltipHeading="Issue ID"
                          tooltipContent={`${cycle.project_detail?.identifier}-${issue.sequence_id}`}
                        >
                          <span className="flex-shrink-0 text-xs text-custom-text-200">
                            {cycle.project_detail?.identifier}-{issue.sequence_id}
                          </span>
                        </Tooltip>
                        <Tooltip position="top-left" tooltipHeading="Title" tooltipContent={issue.name}>
                          <span className="text-[0.825rem] text-custom-text-100">{truncateText(issue.name, 30)}</span>
                        </Tooltip>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-custom-text-200">
                    <span>There are no high priority issues present in this cycle.</span>
                  </div>
                )
              ) : (
                <Loader className="space-y-3">
                  <Loader.Item height="50px" />
                  <Loader.Item height="50px" />
                  <Loader.Item height="50px" />
                </Loader>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
