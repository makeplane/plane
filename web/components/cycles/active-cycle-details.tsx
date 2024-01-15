import { MouseEvent } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import { useApplication, useCycle, useIssues, useProjectState } from "hooks/store";
import useToast from "hooks/use-toast";
// ui
import { SingleProgressStats } from "components/core";
import {
  AvatarGroup,
  Loader,
  Tooltip,
  LinearProgressIndicator,
  ContrastIcon,
  RunningIcon,
  LayersIcon,
  StateGroupIcon,
  PriorityIcon,
  Avatar,
} from "@plane/ui";
// components
import ProgressChart from "components/core/sidebar/progress-chart";
import { ActiveCycleProgressStats } from "components/cycles";
import { ViewIssueLabel } from "components/issues";
// icons
import { AlarmClock, AlertTriangle, ArrowRight, CalendarDays, Star, Target } from "lucide-react";
// helpers
import { renderFormattedDate, findHowManyDaysLeft } from "helpers/date-time.helper";
import { truncateText } from "helpers/string.helper";
// types
import { ICycle } from "@plane/types";
import { EIssuesStoreType } from "constants/issue";
import { ACTIVE_CYCLE_ISSUES } from "store/issue/cycle";
import { CYCLE_ISSUES_WITH_PARAMS } from "constants/fetch-keys";

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

export const ActiveCycleDetails: React.FC<IActiveCycleDetails> = observer((props) => {
  // props
  const { workspaceSlug, projectId } = props;
  // store hooks
  const {
    issues: { issues, fetchActiveCycleIssues },
    issueMap,
  } = useIssues(EIssuesStoreType.CYCLE);
  const {
    commandPalette: { toggleCreateCycleModal },
  } = useApplication();
  const {
    fetchActiveCycle,
    currentProjectActiveCycleId,
    getActiveCycleById,
    addCycleToFavorites,
    removeCycleFromFavorites,
  } = useCycle();
  const { getProjectStates } = useProjectState();
  // toast alert
  const { setToastAlert } = useToast();

  const { isLoading } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ACTIVE_CYCLE_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchActiveCycle(workspaceSlug, projectId) : null
  );

  const activeCycle = currentProjectActiveCycleId ? getActiveCycleById(currentProjectActiveCycleId) : null;
  const issueIds = issues?.[ACTIVE_CYCLE_ISSUES];

  useSWR(
    workspaceSlug && projectId && currentProjectActiveCycleId
      ? CYCLE_ISSUES_WITH_PARAMS(currentProjectActiveCycleId, { priority: "urgent,high" })
      : null,
    workspaceSlug && projectId && currentProjectActiveCycleId
      ? () => fetchActiveCycleIssues(workspaceSlug, projectId, currentProjectActiveCycleId)
      : null
  );

  if (!activeCycle && isLoading)
    return (
      <Loader>
        <Loader.Item height="250px" />
      </Loader>
    );

  if (!activeCycle)
    return (
      <div className="grid h-full place-items-center text-center">
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
            className="text-sm text-custom-primary-100 outline-none"
            onClick={() => toggleCreateCycleModal(true)}
          >
            Create a new cycle
          </button>
        </div>
      </div>
    );

  const endDate = new Date(activeCycle.end_date ?? "");
  const startDate = new Date(activeCycle.start_date ?? "");

  const groupedIssues: any = {
    backlog: activeCycle.backlog_issues,
    unstarted: activeCycle.unstarted_issues,
    started: activeCycle.started_issues,
    completed: activeCycle.completed_issues,
    cancelled: activeCycle.cancelled_issues,
  };

  const cycleStatus = activeCycle.status.toLocaleLowerCase();

  const handleAddToFavorites = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    addCycleToFavorites(workspaceSlug?.toString(), projectId.toString(), activeCycle.id).catch(() => {
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

    removeCycleFromFavorites(workspaceSlug?.toString(), projectId.toString(), activeCycle.id).catch(() => {
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
    value:
      activeCycle.total_issues > 0
        ? ((activeCycle[group.key as keyof ICycle] as number) / activeCycle.total_issues) * 100
        : 0,
    color: group.color,
  }));

  return (
    <div className="grid-row-2 grid divide-y rounded-[10px] border border-custom-border-200 bg-custom-background-100 shadow">
      <div className="grid grid-cols-1 divide-y border-custom-border-200 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        <div className="flex flex-col text-xs">
          <div className="h-full w-full">
            <div className="flex h-60 flex-col justify-between gap-5 rounded-b-[10px] p-4">
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
                  <Tooltip tooltipContent={activeCycle.name} position="top-left">
                    <h3 className="break-words text-lg font-semibold">{truncateText(activeCycle.name, 70)}</h3>
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
                        <RunningIcon className="h-4 w-4" />
                        {findHowManyDaysLeft(activeCycle.end_date ?? new Date())} Days Left
                      </span>
                    ) : cycleStatus === "upcoming" ? (
                      <span className="flex gap-1 whitespace-nowrap">
                        <AlarmClock className="h-4 w-4" />
                        {findHowManyDaysLeft(activeCycle.start_date ?? new Date())} Days Left
                      </span>
                    ) : cycleStatus === "completed" ? (
                      <span className="flex gap-1 whitespace-nowrap">
                        {activeCycle.total_issues - activeCycle.completed_issues > 0 && (
                          <Tooltip
                            tooltipContent={`${activeCycle.total_issues - activeCycle.completed_issues} more pending ${
                              activeCycle.total_issues - activeCycle.completed_issues === 1 ? "issue" : "issues"
                            }`}
                          >
                            <span>
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </span>
                          </Tooltip>
                        )}{" "}
                        Completed
                      </span>
                    ) : (
                      cycleStatus
                    )}
                  </span>
                  {activeCycle.is_favorite ? (
                    <button
                      onClick={(e) => {
                        handleRemoveFromFavorites(e);
                      }}
                    >
                      <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        handleAddToFavorites(e);
                      }}
                    >
                      <Star className="h-4 w-4 " color="rgb(var(--color-text-200))" />
                    </button>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-start gap-5 text-custom-text-200">
                <div className="flex items-start gap-1">
                  <CalendarDays className="h-4 w-4" />
                  <span>{renderFormattedDate(startDate)}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-custom-text-200" />
                <div className="flex items-start gap-1">
                  <Target className="h-4 w-4" />
                  <span>{renderFormattedDate(endDate)}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 text-custom-text-200">
                  {activeCycle.owned_by.avatar && activeCycle.owned_by.avatar !== "" ? (
                    <img
                      src={activeCycle.owned_by.avatar}
                      height={16}
                      width={16}
                      className="rounded-full"
                      alt={activeCycle.owned_by.display_name}
                    />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-custom-background-100 capitalize">
                      {activeCycle.owned_by.display_name.charAt(0)}
                    </span>
                  )}
                  <span className="text-custom-text-200">{activeCycle.owned_by.display_name}</span>
                </div>

                {activeCycle.assignees.length > 0 && (
                  <div className="flex items-center gap-1 text-custom-text-200">
                    <AvatarGroup>
                      {activeCycle.assignees.map((assignee) => (
                        <Avatar key={assignee.id} name={assignee.display_name} src={assignee.avatar} />
                      ))}
                    </AvatarGroup>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-custom-text-200">
                <div className="flex gap-2">
                  <LayersIcon className="h-4 w-4 flex-shrink-0" />
                  {activeCycle.total_issues} issues
                </div>
                <div className="flex items-center gap-2">
                  <StateGroupIcon stateGroup="completed" height="14px" width="14px" />
                  {activeCycle.completed_issues} issues
                </div>
              </div>

              <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${activeCycle.id}`}>
                <span className="w-full rounded-md bg-custom-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-custom-primary/90">
                  View Cycle
                </span>
              </Link>
            </div>
          </div>
        </div>
        <div className="col-span-2 grid grid-cols-1 divide-y border-custom-border-200 md:grid-cols-2 md:divide-x md:divide-y-0">
          <div className="flex h-60 flex-col border-custom-border-200">
            <div className="flex h-full w-full flex-col p-4 text-custom-text-200">
              <div className="flex w-full items-center gap-2 py-1">
                <span>Progress</span>
                <LinearProgressIndicator data={progressIndicatorData} />
              </div>
              <div className="mt-2 flex flex-col items-center gap-1">
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
                    total={activeCycle.total_issues}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="h-60 overflow-y-scroll border-custom-border-200">
            <ActiveCycleProgressStats cycle={activeCycle} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y border-custom-border-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <div className="flex flex-col justify-between p-4">
          <div>
            <div className="text-custom-primary">High Priority Issues</div>
            <div className="my-3 flex max-h-[240px] min-h-[240px] flex-col gap-2.5 overflow-y-scroll rounded-md">
              {issueIds ? (
                issueIds.length > 0 ? (
                  issueIds.map((issue: any) => (
                    <Link
                      key={issue.id}
                      href={`/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`}
                      className="flex cursor-pointer flex-wrap items-center justify-between gap-2 rounded-md border border-custom-border-200 bg-custom-background-90 px-3 py-1.5"
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
                          className={`grid h-6 w-6 flex-shrink-0 place-items-center items-center rounded border shadow-sm ${
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
                              <AvatarGroup showTooltip={false}>
                                {issue.assignee_details.map((assignee: any) => (
                                  <Avatar key={assignee.id} name={assignee.display_name} src={assignee.avatar} />
                                ))}
                              </AvatarGroup>
                            </div>
                          ) : (
                            ""
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="grid place-items-center text-center text-sm text-custom-text-200">
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

          {issueIds && issueIds.length > 0 && (
            <div className="flex items-center justify-between gap-2">
              <div className="h-1 w-full rounded-full bg-custom-background-80">
                <div
                  className="h-1 rounded-full bg-green-600"
                  style={{
                    width:
                      issueIds &&
                      `${
                        (issueIds.filter((issue: any) => issue?.state_detail?.group === "completed")?.length /
                          issueIds.length) *
                          100 ?? 0
                      }%`,
                  }}
                />
              </div>
              <div className="w-16 text-end text-xs text-custom-text-200">
                of{" "}
                {
                  issueIds?.filter(
                    (issueId) =>
                      getProjectStates(issueMap[issueId]?.project_id)?.find(
                        (issue) => issue.id === issueMap[issueId]?.state_id
                      )?.group === "completed"
                  )?.length
                }{" "}
                of {issueIds?.length}
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
                <LayersIcon className="h-5 w-5 flex-shrink-0 text-custom-text-200" />
              </span>
              <span>
                Pending Issues -{" "}
                {activeCycle.total_issues - (activeCycle.completed_issues + activeCycle.cancelled_issues)}
              </span>
            </div>
          </div>
          <div className="relative h-64">
            <ProgressChart
              distribution={activeCycle.distribution?.completion_chart ?? {}}
              startDate={activeCycle.start_date ?? ""}
              endDate={activeCycle.end_date ?? ""}
              totalIssues={activeCycle.total_issues}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
