import { MouseEvent } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { useTheme } from "next-themes";
// hooks
import { useCycle, useIssues, useMember, useProject, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// ui
import { SingleProgressStats } from "components/core";
import {
  AvatarGroup,
  Loader,
  Tooltip,
  LinearProgressIndicator,
  LayersIcon,
  StateGroupIcon,
  PriorityIcon,
  Avatar,
  CycleGroupIcon,
} from "@plane/ui";
// components
import ProgressChart from "components/core/sidebar/progress-chart";
import { ActiveCycleProgressStats } from "components/cycles";
import { StateDropdown } from "components/dropdowns";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// icons
import { ArrowRight, CalendarCheck, CalendarDays, Star, Target } from "lucide-react";
// helpers
import { renderFormattedDate, findHowManyDaysLeft, renderFormattedDateWithoutYear } from "helpers/date-time.helper";
import { truncateText } from "helpers/string.helper";
// types
import { ICycle, TCycleGroups } from "@plane/types";
// constants
import { EIssuesStoreType } from "constants/issue";
import { CYCLE_ISSUES_WITH_PARAMS } from "constants/fetch-keys";
import { CYCLE_EMPTY_STATE_DETAILS, CYCLE_STATE_GROUPS_DETAILS } from "constants/cycle";

interface IActiveCycleDetails {
  workspaceSlug: string;
  projectId: string;
}

export const ActiveCycleDetails: React.FC<IActiveCycleDetails> = observer((props) => {
  // props
  const { workspaceSlug, projectId } = props;
  const { resolvedTheme } = useTheme();
  // store hooks
  const { currentUser } = useUser();
  const {
    issues: { fetchActiveCycleIssues },
  } = useIssues(EIssuesStoreType.CYCLE);
  const {
    fetchActiveCycle,
    currentProjectActiveCycleId,
    getActiveCycleById,
    addCycleToFavorites,
    removeCycleFromFavorites,
  } = useCycle();
  const { currentProjectDetails } = useProject();
  const { getUserDetails } = useMember();
  // toast alert
  const { setToastAlert } = useToast();

  const { isLoading } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ACTIVE_CYCLE_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchActiveCycle(workspaceSlug, projectId) : null
  );

  const activeCycle = currentProjectActiveCycleId ? getActiveCycleById(currentProjectActiveCycleId) : null;
  const cycleOwnerDetails = activeCycle ? getUserDetails(activeCycle.owned_by) : undefined;

  const { data: activeCycleIssues } = useSWR(
    workspaceSlug && projectId && currentProjectActiveCycleId
      ? CYCLE_ISSUES_WITH_PARAMS(currentProjectActiveCycleId, { priority: "urgent,high" })
      : null,
    workspaceSlug && projectId && currentProjectActiveCycleId
      ? () => fetchActiveCycleIssues(workspaceSlug, projectId, currentProjectActiveCycleId)
      : null
  );

  const emptyStateDetail = CYCLE_EMPTY_STATE_DETAILS["active"];

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const emptyStateImage = getEmptyStateImagePath("cycle", "active", isLightMode);

  if (!activeCycle && isLoading)
    return (
      <Loader>
        <Loader.Item height="250px" />
      </Loader>
    );

  if (!activeCycle)
    return (
      <EmptyState
        title={emptyStateDetail.title}
        description={emptyStateDetail.description}
        image={emptyStateImage}
        size="sm"
      />
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

  const cycleStatus = activeCycle.status.toLowerCase() as TCycleGroups;

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

  const progressIndicatorData = CYCLE_STATE_GROUPS_DETAILS.map((group, index) => ({
    id: index,
    name: group.title,
    value:
      activeCycle.total_issues > 0
        ? ((activeCycle[group.key as keyof ICycle] as number) / activeCycle.total_issues) * 100
        : 0,
    color: group.color,
  }));

  const daysLeft = findHowManyDaysLeft(activeCycle.end_date ?? new Date());

  return (
    <div className="grid-row-2 grid divide-y rounded-[10px] border border-custom-border-200 bg-custom-background-100 shadow">
      <div className="grid grid-cols-1 divide-y border-custom-border-200 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        <div className="flex flex-col text-xs">
          <div className="h-full w-full">
            <div className="flex h-60 flex-col justify-between gap-5 rounded-b-[10px] p-4">
              <div className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1">
                  <span className="h-5 w-5">
                    <CycleGroupIcon cycleGroup={cycleStatus} className="h-4 w-4" />
                  </span>
                  <Tooltip tooltipContent={activeCycle.name} position="top-left">
                    <h3 className="break-words text-lg font-semibold">{truncateText(activeCycle.name, 70)}</h3>
                  </Tooltip>
                </span>
                <span className="flex items-center gap-1">
                  <span className="flex gap-1 whitespace-nowrap rounded-sm text-sm px-3 py-0.5 bg-amber-500/10 text-amber-500">
                    {`${daysLeft} ${daysLeft > 1 ? "days" : "day"} left`}
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
                  {cycleOwnerDetails?.avatar && cycleOwnerDetails?.avatar !== "" ? (
                    <img
                      src={cycleOwnerDetails?.avatar}
                      height={16}
                      width={16}
                      className="rounded-full"
                      alt={cycleOwnerDetails?.display_name}
                    />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-custom-background-100 capitalize">
                      {cycleOwnerDetails?.display_name.charAt(0)}
                    </span>
                  )}
                  <span className="text-custom-text-200">{cycleOwnerDetails?.display_name}</span>
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

              <Link
                href={`/${workspaceSlug}/projects/${projectId}/cycles/${activeCycle.id}`}
                className="w-min text-nowrap rounded-md bg-custom-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-custom-primary/90"
              >
                View Cycle
              </Link>
            </div>
          </div>
        </div>
        <div className="col-span-2 grid grid-cols-1 divide-y border-custom-border-200 md:grid-cols-2 md:divide-x md:divide-y-0">
          <div className="flex h-60 flex-col border-custom-border-200">
            <div className="flex h-full w-full flex-col p-4 text-custom-text-200">
              <div className="flex w-full items-center gap-2 py-1">
                <span>Progress</span>
                <LinearProgressIndicator size="md" data={progressIndicatorData} inPercentage />
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
                            backgroundColor: CYCLE_STATE_GROUPS_DETAILS[index].color,
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
        <div className="flex flex-col gap-3 p-4 max-h-60 overflow-hidden">
          <div className="text-custom-primary">High Priority Issues</div>
          <div className="flex flex-col h-full gap-2.5 overflow-y-scroll rounded-md">
            {activeCycleIssues ? (
              activeCycleIssues.length > 0 ? (
                activeCycleIssues.map((issue: any) => (
                  <Link
                    key={issue.id}
                    href={`/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`}
                    className="flex cursor-pointer flex-wrap items-center justify-between gap-2 rounded-md border border-custom-border-200  px-3 py-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <PriorityIcon priority={issue.priority} withContainer size={12} />

                      <Tooltip
                        tooltipHeading="Issue ID"
                        tooltipContent={`${currentProjectDetails?.identifier}-${issue.sequence_id}`}
                      >
                        <span className="flex-shrink-0 text-xs text-custom-text-200">
                          {currentProjectDetails?.identifier}-{issue.sequence_id}
                        </span>
                      </Tooltip>
                      <Tooltip position="top-left" tooltipHeading="Title" tooltipContent={issue.name}>
                        <span className="text-[0.825rem] text-custom-text-100">{truncateText(issue.name, 30)}</span>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <StateDropdown
                        value={issue.state_id ?? undefined}
                        onChange={() => {}}
                        projectId={projectId?.toString() ?? ""}
                        disabled={true}
                        buttonVariant="background-with-text"
                      />
                      {issue.target_date && (
                        <Tooltip tooltipHeading="Target Date" tooltipContent={renderFormattedDate(issue.target_date)}>
                          <div className="h-full flex items-center gap-1.5 rounded text-xs px-2 py-0.5 bg-custom-background-80 cursor-not-allowed">
                            <CalendarCheck className="h-3 w-3 flex-shrink-0" />
                            <span className="text-xs">{renderFormattedDateWithoutYear(issue.target_date)}</span>
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-custom-text-200">
                  There are no high priority issues present in this cycle.
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
        <div className="flex flex-col  border-custom-border-200 p-4 max-h-60">
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
          <div className="relative h-full">
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
