import { MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
// services
import { CycleService } from "services/cycle.service";
// hooks
import useToast from "hooks/use-toast";
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { AssigneesList } from "components/ui/avatar";
import { SingleProgressStats } from "components/core";
import { Loader, Tooltip, LinearProgressIndicator } from "@plane/ui";
// components
import ProgressChart from "components/core/sidebar/progress-chart";
import { ActiveCycleProgressStats } from "components/cycles";
import { ViewIssueLabel } from "components/issues";
// icons
import { CalendarDaysIcon } from "@heroicons/react/20/solid";
import { PriorityIcon } from "components/icons/priority-icon";
import {
  TargetIcon,
  ContrastIcon,
  PersonRunningIcon,
  ArrowRightIcon,
  TriangleExclamationIcon,
  AlarmClockIcon,
  LayerDiagonalIcon,
  StateGroupIcon,
} from "components/icons";
import { StarIcon } from "@heroicons/react/24/outline";
// helpers
import { getDateRangeStatus, renderShortDateWithYearFormat, findHowManyDaysLeft } from "helpers/date-time.helper";
import { truncateText } from "helpers/string.helper";
// types
import { ICycle, IIssue } from "types";
// fetch-keys
import { CURRENT_CYCLE_LIST, CYCLES_LIST, CYCLE_ISSUES_WITH_PARAMS } from "constants/fetch-keys";

const stateGroups = [
  {
    key: "backlog_issues",
    title: "Backlog",
    color: "#dee2e6",
  },
  {
    key: "unstarted_issues",
    title: "Unstarted",
    color: "#26b5ce",
  },
  {
    key: "started_issues",
    title: "Started",
    color: "#f7ae59",
  },
  {
    key: "cancelled_issues",
    title: "Cancelled",
    color: "#d687ff",
  },
  {
    key: "completed_issues",
    title: "Completed",
    color: "#09a953",
  },
];

interface IActiveCycleDetails {
  workspaceSlug: string;
  projectId: string;
}

export const ActiveCycleDetails: React.FC<IActiveCycleDetails> = (props) => {
  // services
  const cycleService = new CycleService();

  const router = useRouter();

  const { workspaceSlug, projectId } = props;

  const { cycle: cycleStore } = useMobxStore();

  const { setToastAlert } = useToast();

  const { isLoading } = useSWR(
    workspaceSlug && projectId ? `ACTIVE_CYCLE_ISSUE_${projectId}_CURRENT` : null,
    workspaceSlug && projectId ? () => cycleStore.fetchCycles(workspaceSlug, projectId, "current") : null
  );

  const activeCycle = cycleStore.cycles?.[projectId] || null;
  const cycle = activeCycle ? activeCycle[0] : null;
  const issues = (cycleStore?.active_cycle_issues as any) || null;

  // const { data: issues } = useSWR(
  //   workspaceSlug && projectId && cycle?.id ? CYCLE_ISSUES_WITH_PARAMS(cycle?.id, { priority: "urgent,high" }) : null,
  //   workspaceSlug && projectId && cycle?.id
  //     ? () =>
  //         cycleService.getCycleIssuesWithParams(workspaceSlug as string, projectId as string, cycle.id, {
  //           priority: "urgent,high",
  //         })
  //     : null
  // ) as { data: IIssue[] | undefined };

  if (isLoading)
    return (
      <Loader>
        <Loader.Item height="250px" />
      </Loader>
    );

  if (!cycle)
    return (
      <div className="h-full grid place-items-center text-center">
        <div className="space-y-2">
          <div className="mx-auto flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="66" height="66" viewBox="0 0 66 66" fill="none">
              <circle cx="34.375" cy="34.375" r="22" stroke="rgb(var(--color-text-400))" strokeLinecap="round" />
              <path
                d="M36.4375 20.9919C36.4375 19.2528 37.6796 17.8127 39.1709 18.1419C40.125 18.3526 41.0604 18.6735 41.9625 19.1014C43.7141 19.9322 45.3057 21.1499 46.6464 22.685C47.987 24.2202 49.0505 26.0426 49.776 28.0484C50.5016 30.0541 50.875 32.2038 50.875 34.3748C50.875 36.5458 50.5016 38.6956 49.776 40.7013C49.0505 42.7071 47.987 44.5295 46.6464 46.0647C45.3057 47.5998 43.7141 48.8175 41.9625 49.6483C41.0604 50.0762 40.125 50.3971 39.1709 50.6077C37.6796 50.937 36.4375 49.4969 36.4375 47.7578L36.4375 20.9919Z"
                fill="rgb(var(--color-text-400))"
              />
            </svg>
          </div>
          <h4 className="text-sm text-custom-text-200">No active cycle</h4>
          <button
            type="button"
            className="text-custom-primary-100 text-sm outline-none"
            onClick={() => {
              const e = new KeyboardEvent("keydown", {
                key: "q",
              });
              document.dispatchEvent(e);
            }}
          >
            Create a new cycle
          </button>
        </div>
      </div>
    );

  const endDate = new Date(cycle.end_date ?? "");
  const startDate = new Date(cycle.start_date ?? "");

  const groupedIssues: any = {
    backlog: cycle.backlog_issues,
    unstarted: cycle.unstarted_issues,
    started: cycle.started_issues,
    completed: cycle.completed_issues,
    cancelled: cycle.cancelled_issues,
  };

  const cycleStatus = getDateRangeStatus(cycle.start_date, cycle.end_date);

  const handleAddToFavorites = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    cycleStore.addCycleToFavorites(workspaceSlug?.toString(), projectId.toString(), cycle.id).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't add the cycle to favorites. Please try again.",
      });
    });
  };

  const handleRemoveFromFavorites = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    cycleStore.removeCycleFromFavorites(workspaceSlug?.toString(), projectId.toString(), cycle.id).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't add the cycle to favorites. Please try again.",
      });
    });
  };

  const progressIndicatorData = stateGroups.map((group, index) => ({
    id: index,
    name: group.title,
    value: cycle.total_issues > 0 ? ((cycle[group.key as keyof ICycle] as number) / cycle.total_issues) * 100 : 0,
    color: group.color,
  }));

  return (
    <div className="grid-row-2 grid rounded-[10px] shadow divide-y bg-custom-background-100 border border-custom-border-200">
      <div className="grid grid-cols-1 divide-y border-custom-border-200 lg:divide-y-0 lg:divide-x lg:grid-cols-3">
        <div className="flex flex-col text-xs">
          <div className="h-full w-full">
            <div className="flex h-60 flex-col gap-5 justify-between rounded-b-[10px] p-4">
              <div className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1">
                  <span className="h-5 w-5">
                    <ContrastIcon
                      className="h-5 w-5"
                      color={`${
                        cycleStatus === "current"
                          ? "#09A953"
                          : cycleStatus === "upcoming"
                          ? "#F7AE59"
                          : cycleStatus === "completed"
                          ? "#3F76FF"
                          : cycleStatus === "draft"
                          ? "rgb(var(--color-text-200))"
                          : ""
                      }`}
                    />
                  </span>
                  <Tooltip tooltipContent={cycle.name} position="top-left">
                    <h3 className="break-words text-lg font-semibold">{truncateText(cycle.name, 70)}</h3>
                  </Tooltip>
                </span>
                <span className="flex items-center gap-1 capitalize">
                  <span
                    className={`rounded-full px-1.5 py-0.5
                    ${
                      cycleStatus === "current"
                        ? "bg-green-600/5 text-green-600"
                        : cycleStatus === "upcoming"
                        ? "bg-orange-300/5 text-orange-300"
                        : cycleStatus === "completed"
                        ? "bg-blue-500/5 text-blue-500"
                        : cycleStatus === "draft"
                        ? "bg-neutral-400/5 text-neutral-400"
                        : ""
                    }`}
                  >
                    {cycleStatus === "current" ? (
                      <span className="flex gap-1 whitespace-nowrap">
                        <PersonRunningIcon className="h-4 w-4" />
                        {findHowManyDaysLeft(cycle.end_date ?? new Date())} Days Left
                      </span>
                    ) : cycleStatus === "upcoming" ? (
                      <span className="flex gap-1 whitespace-nowrap">
                        <AlarmClockIcon className="h-4 w-4" />
                        {findHowManyDaysLeft(cycle.start_date ?? new Date())} Days Left
                      </span>
                    ) : cycleStatus === "completed" ? (
                      <span className="flex gap-1 whitespace-nowrap">
                        {cycle.total_issues - cycle.completed_issues > 0 && (
                          <Tooltip
                            tooltipContent={`${cycle.total_issues - cycle.completed_issues} more pending ${
                              cycle.total_issues - cycle.completed_issues === 1 ? "issue" : "issues"
                            }`}
                          >
                            <span>
                              <TriangleExclamationIcon className="h-3.5 w-3.5 fill-current" />
                            </span>
                          </Tooltip>
                        )}{" "}
                        Completed
                      </span>
                    ) : (
                      cycleStatus
                    )}
                  </span>
                  {cycle.is_favorite ? (
                    <button
                      onClick={(e) => {
                        handleRemoveFromFavorites(e);
                      }}
                    >
                      <StarIcon className="h-4 w-4 text-orange-400" fill="#f6ad55" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        handleAddToFavorites(e);
                      }}
                    >
                      <StarIcon className="h-4 w-4 " color="rgb(var(--color-text-200))" />
                    </button>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-start gap-5 text-custom-text-200">
                <div className="flex items-start gap-1">
                  <CalendarDaysIcon className="h-4 w-4" />
                  <span>{renderShortDateWithYearFormat(startDate)}</span>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-custom-text-200" />
                <div className="flex items-start gap-1">
                  <TargetIcon className="h-4 w-4" />
                  <span>{renderShortDateWithYearFormat(endDate)}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 text-custom-text-200">
                  {cycle.owned_by.avatar && cycle.owned_by.avatar !== "" ? (
                    <img
                      src={cycle.owned_by.avatar}
                      height={16}
                      width={16}
                      className="rounded-full"
                      alt={cycle.owned_by.display_name}
                    />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-custom-background-100 capitalize">
                      {cycle.owned_by.display_name.charAt(0)}
                    </span>
                  )}
                  <span className="text-custom-text-200">{cycle.owned_by.display_name}</span>
                </div>

                {cycle.assignees.length > 0 && (
                  <div className="flex items-center gap-1 text-custom-text-200">
                    <AssigneesList users={cycle.assignees} length={4} />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-custom-text-200">
                <div className="flex gap-2">
                  <LayerDiagonalIcon className="h-4 w-4 flex-shrink-0" />
                  {cycle.total_issues} issues
                </div>
                <div className="flex items-center gap-2">
                  <StateGroupIcon stateGroup="completed" height="14px" width="14px" />
                  {cycle.completed_issues} issues
                </div>
              </div>

              <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`}>
                <a className="bg-custom-primary text-white px-4 rounded-md py-2 text-center text-sm font-medium w-full hover:bg-custom-primary/90">
                  View Cycle
                </a>
              </Link>
            </div>
          </div>
        </div>
        <div className="grid col-span-2 grid-cols-1 divide-y border-custom-border-200 md:divide-y-0 md:divide-x md:grid-cols-2">
          <div className="flex h-60 flex-col border-custom-border-200">
            <div className="flex h-full w-full flex-col text-custom-text-200 p-4">
              <div className="flex w-full items-center gap-2 py-1">
                <span>Progress</span>
                <LinearProgressIndicator data={progressIndicatorData} />
              </div>
              <div className="flex flex-col mt-2 gap-1 items-center">
                {Object.keys(groupedIssues).map((group, index) => (
                  <SingleProgressStats
                    key={index}
                    title={
                      <div className="flex items-center gap-2">
                        <span
                          className="block h-3 w-3 rounded-full "
                          style={{
                            backgroundColor: stateGroups[index].color,
                          }}
                        />
                        <span className="text-xs capitalize">{group}</span>
                      </div>
                    }
                    completed={groupedIssues[group]}
                    total={cycle.total_issues}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="border-custom-border-200 h-60 overflow-y-scroll">
            <ActiveCycleProgressStats cycle={cycle} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y border-custom-border-200 lg:divide-y-0 lg:divide-x lg:grid-cols-2">
        <div className="flex flex-col justify-between p-4">
          <div>
            <div className="text-custom-primary">High Priority Issues</div>
            <div className="my-3 flex max-h-[240px] min-h-[240px] flex-col gap-2.5 overflow-y-scroll rounded-md">
              {issues ? (
                issues.length > 0 ? (
                  issues.map((issue: any) => (
                    <div
                      key={issue.id}
                      onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`)}
                      className="flex flex-wrap cursor-pointer rounded-md items-center justify-between gap-2 border border-custom-border-200 bg-custom-background-90 px-3 py-1.5"
                    >
                      <div className="flex flex-col gap-1">
                        <div>
                          <Tooltip
                            tooltipHeading="Issue ID"
                            tooltipContent={`${issue.project_detail?.identifier}-${issue.sequence_id}`}
                          >
                            <span className="flex-shrink-0 text-xs text-custom-text-200">
                              {issue.project_detail?.identifier}-{issue.sequence_id}
                            </span>
                          </Tooltip>
                        </div>
                        <Tooltip position="top-left" tooltipHeading="Title" tooltipContent={issue.name}>
                          <span className="text-[0.825rem] text-custom-text-100">{truncateText(issue.name, 30)}</span>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`grid h-6 w-6 place-items-center items-center rounded border shadow-sm flex-shrink-0 ${
                            issue.priority === "urgent"
                              ? "border-red-500/20 bg-red-500/20 text-red-500"
                              : "border-orange-500/20 bg-orange-500/20 text-orange-500"
                          }`}
                        >
                          <PriorityIcon priority={issue.priority} className="text-sm" />
                        </div>
                        <ViewIssueLabel labelDetails={issue.label_details} maxRender={2} />
                        <div className={`flex items-center gap-2 text-custom-text-200`}>
                          {issue.assignees && issue.assignees.length > 0 && Array.isArray(issue.assignees) ? (
                            <div className="-my-0.5 flex items-center justify-center gap-2">
                              <AssigneesList users={issue.assignee_details} length={3} showLength={false} />
                            </div>
                          ) : (
                            ""
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="grid place-items-center text-custom-text-200 text-sm text-center">
                    No issues present in the cycle.
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

          {issues && issues.length > 0 && (
            <div className="flex items-center justify-between gap-2">
              <div className="h-1 w-full rounded-full bg-custom-background-80">
                <div
                  className="h-1 rounded-full bg-green-600"
                  style={{
                    width:
                      issues &&
                      `${
                        (issues.filter((issue: any) => issue?.state_detail?.group === "completed")?.length /
                          issues.length) *
                          100 ?? 0
                      }%`,
                  }}
                />
              </div>
              <div className="w-16 text-end text-xs text-custom-text-200">
                {issues?.filter((issue: any) => issue?.state_detail?.group === "completed")?.length} of {issues?.length}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between border-custom-border-200 p-4">
          <div className="flex items-start justify-between gap-4 py-1.5 text-xs">
            <div className="flex items-center gap-3 text-custom-text-100">
              <div className="flex items-center justify-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#a9bbd0]" />
                <span>Ideal</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#4c8fff]" />
                <span>Current</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span>
                <LayerDiagonalIcon className="h-5 w-5 flex-shrink-0 text-custom-text-200" />
              </span>
              <span>Pending Issues - {cycle.total_issues - (cycle.completed_issues + cycle.cancelled_issues)}</span>
            </div>
          </div>
          <div className="relative h-64">
            <ProgressChart
              distribution={cycle.distribution.completion_chart}
              startDate={cycle.start_date ?? ""}
              endDate={cycle.end_date ?? ""}
              totalIssues={cycle.total_issues}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
