import { FC, MouseEvent } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/router";
// icons
import { Check, Info, Star, User2 } from "lucide-react";
// types
import type { TCycleGroups } from "@plane/types";
// ui
import { Tooltip, CircularProgressIndicator, CycleGroupIcon, AvatarGroup, Avatar, setPromiseToast } from "@plane/ui";
// components
import { CycleQuickActions } from "@/components/cycles";
// constants
import { CYCLE_STATUS } from "@/constants/cycle";
import { CYCLE_FAVORITED, CYCLE_UNFAVORITED } from "@/constants/event-tracker";
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { findHowManyDaysLeft, getDate, renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { useEventTracker, useCycle, useUser, useMember } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TCyclesListItem = {
  cycleId: string;
  handleEditCycle?: () => void;
  handleDeleteCycle?: () => void;
  handleAddToFavorites?: () => void;
  handleRemoveFromFavorites?: () => void;
  workspaceSlug: string;
  projectId: string;
  isArchived?: boolean;
};

export const CyclesListItem: FC<TCyclesListItem> = observer((props) => {
  const { cycleId, workspaceSlug, projectId, isArchived } = props;
  // router
  const router = useRouter();
  // hooks
  const { isMobile } = usePlatformOS();
  // store hooks
  const { captureEvent } = useEventTracker();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { getCycleById, addCycleToFavorites, removeCycleFromFavorites } = useCycle();
  const { getUserDetails } = useMember();

  const handleAddToFavorites = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    const addToFavoritePromise = addCycleToFavorites(workspaceSlug?.toString(), projectId.toString(), cycleId).then(
      () => {
        captureEvent(CYCLE_FAVORITED, {
          cycle_id: cycleId,
          element: "List layout",
          state: "SUCCESS",
        });
      }
    );

    setPromiseToast(addToFavoritePromise, {
      loading: "Adding cycle to favorites...",
      success: {
        title: "Success!",
        message: () => "Cycle added to favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't add the cycle to favorites. Please try again.",
      },
    });
  };

  const handleRemoveFromFavorites = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    const removeFromFavoritePromise = removeCycleFromFavorites(
      workspaceSlug?.toString(),
      projectId.toString(),
      cycleId
    ).then(() => {
      captureEvent(CYCLE_UNFAVORITED, {
        cycle_id: cycleId,
        element: "List layout",
        state: "SUCCESS",
      });
    });

    setPromiseToast(removeFromFavoritePromise, {
      loading: "Removing cycle from favorites...",
      success: {
        title: "Success!",
        message: () => "Cycle removed from favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't remove the cycle from favorites. Please try again.",
      },
    });
  };

  const openCycleOverview = (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    const { query } = router;
    e.preventDefault();
    e.stopPropagation();

    if (query.peekCycle) {
      delete query.peekCycle;
      router.push({
        pathname: router.pathname,
        query: { ...query },
      });
    } else {
      router.push({
        pathname: router.pathname,
        query: { ...query, peekCycle: cycleId },
      });
    }
  };

  const cycleDetails = getCycleById(cycleId);

  if (!cycleDetails) return null;

  // computed
  // TODO: change this logic once backend fix the response
  const cycleStatus = cycleDetails.status ? (cycleDetails.status.toLocaleLowerCase() as TCycleGroups) : "draft";
  const isCompleted = cycleStatus === "completed";
  const endDate = getDate(cycleDetails.end_date);
  const startDate = getDate(cycleDetails.start_date);

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const cycleTotalIssues =
    cycleDetails.backlog_issues +
    cycleDetails.unstarted_issues +
    cycleDetails.started_issues +
    cycleDetails.completed_issues +
    cycleDetails.cancelled_issues;

  const renderDate = cycleDetails.start_date || cycleDetails.end_date;

  // const areYearsEqual = startDate.getFullYear() === endDate.getFullYear();

  const completionPercentage = (cycleDetails.completed_issues / cycleTotalIssues) * 100;

  const progress = isNaN(completionPercentage) ? 0 : Math.floor(completionPercentage);

  const currentCycle = CYCLE_STATUS.find((status) => status.value === cycleStatus);

  const daysLeft = findHowManyDaysLeft(cycleDetails.end_date) ?? 0;

  return (
    <>
      <Link
        href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycleDetails.id}`}
        onClick={(e) => {
          if (isArchived) {
            openCycleOverview(e);
          }
        }}
      >
        <div className="group flex w-full flex-col items-center justify-between gap-5 border-b border-custom-border-100 bg-custom-background-100 px-5 py-6 text-sm hover:bg-custom-background-90 md:flex-row">
          <div className="relative flex w-full items-center justify-between gap-3 overflow-hidden">
            <div className="relative flex w-full items-center gap-3 overflow-hidden">
              <div className="flex-shrink-0">
                <CircularProgressIndicator size={38} percentage={progress}>
                  {isCompleted ? (
                    progress === 100 ? (
                      <Check className="h-3 w-3 stroke-[2] text-custom-primary-100" />
                    ) : (
                      <span className="text-sm text-custom-primary-100">{`!`}</span>
                    )
                  ) : progress === 100 ? (
                    <Check className="h-3 w-3 stroke-[2] text-custom-primary-100" />
                  ) : (
                    <span className="text-xs text-custom-text-300">{`${progress}%`}</span>
                  )}
                </CircularProgressIndicator>
              </div>

              <div className="relative flex items-center gap-2.5 overflow-hidden">
                <CycleGroupIcon cycleGroup={cycleStatus} className="h-3.5 w-3.5 flex-shrink-0" />
                <Tooltip tooltipContent={cycleDetails.name} position="top" isMobile={isMobile}>
                  <span className="line-clamp-1 inline-block overflow-hidden truncate text-base font-medium">
                    {cycleDetails.name}
                  </span>
                </Tooltip>
              </div>

              <button onClick={openCycleOverview} className="invisible z-[5] flex-shrink-0 group-hover:visible">
                <Info className="h-4 w-4 text-custom-text-400" />
              </button>
            </div>
            <div className="text-xs text-custom-text-300 flex-shrink-0">
              {renderDate && `${renderFormattedDate(startDate) ?? `_ _`} - ${renderFormattedDate(endDate) ?? `_ _`}`}
            </div>
          </div>
          <div className="relative flex w-full flex-shrink-0 items-center justify-between gap-2.5 md:w-auto md:flex-shrink-0 md:justify-end">
            {currentCycle && (
              <div
                className="relative flex h-6 w-20 flex-shrink-0 items-center justify-center rounded-sm text-center text-xs"
                style={{
                  color: currentCycle.color,
                  backgroundColor: `${currentCycle.color}20`,
                }}
              >
                {currentCycle.value === "current"
                  ? `${daysLeft} ${daysLeft > 1 ? "days" : "day"} left`
                  : `${currentCycle.label}`}
              </div>
            )}

            <div className="relative flex flex-shrink-0 items-center gap-3">
              <Tooltip tooltipContent={`${cycleDetails.assignee_ids?.length} Members`} isMobile={isMobile}>
                <div className="flex w-10 cursor-default items-center justify-center">
                  {cycleDetails.assignee_ids?.length > 0 ? (
                    <AvatarGroup showTooltip={false}>
                      {cycleDetails.assignee_ids?.map((assignee_id) => {
                        const member = getUserDetails(assignee_id);
                        return <Avatar key={member?.id} name={member?.display_name} src={member?.avatar} />;
                      })}
                    </AvatarGroup>
                  ) : (
                    <span className="flex h-5 w-5 items-end justify-center rounded-full border border-dashed border-custom-text-400 bg-custom-background-80">
                      <User2 className="h-4 w-4 text-custom-text-400" />
                    </span>
                  )}
                </div>
              </Tooltip>

              {isEditingAllowed &&
                !isArchived &&
                (cycleDetails.is_favorite ? (
                  <button type="button" onClick={handleRemoveFromFavorites}>
                    <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                  </button>
                ) : (
                  <button type="button" onClick={handleAddToFavorites}>
                    <Star className="h-3.5 w-3.5 text-custom-text-200" />
                  </button>
                ))}
              <CycleQuickActions
                cycleId={cycleId}
                projectId={projectId}
                workspaceSlug={workspaceSlug}
                isArchived={isArchived}
              />
            </div>
          </div>
        </div>
      </Link>
    </>
  );
});
