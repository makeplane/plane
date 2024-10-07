"use client";

import { FC, MouseEvent, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarCheck2, CalendarClock, Info, MoveRight } from "lucide-react";
// types
import type { TCycleGroups } from "@plane/types";
// ui
import { Avatar, AvatarGroup, Tooltip, LayersIcon, CycleGroupIcon, setPromiseToast, FavoriteStar } from "@plane/ui";
// components
import { CycleQuickActions } from "@/components/cycles";
// constants
import { CYCLE_STATUS } from "@/constants/cycle";
import { CYCLE_FAVORITED, CYCLE_UNFAVORITED } from "@/constants/event-tracker";
// helpers
import { findHowManyDaysLeft, getDate, renderFormattedDate } from "@/helpers/date-time.helper";
import { generateQueryParams } from "@/helpers/router.helper";
// hooks
import { useEventTracker, useCycle, useMember, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

export interface ICyclesBoardCard {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
}

export const CyclesBoardCard: FC<ICyclesBoardCard> = observer((props) => {
  const { cycleId, workspaceSlug, projectId } = props;
  // refs
  const parentRef = useRef(null);
  // router
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  // store
  const { captureEvent } = useEventTracker();
  const { allowPermissions } = useUserPermissions();

  const { addCycleToFavorites, removeCycleFromFavorites, getCycleById } = useCycle();
  const { getUserDetails } = useMember();
  // computed
  const cycleDetails = getCycleById(cycleId);
  // hooks
  const { isMobile } = usePlatformOS();

  if (!cycleDetails) return null;

  const cycleStatus = cycleDetails.status?.toLocaleLowerCase();
  // const isCompleted = cycleStatus === "completed";
  const endDate = getDate(cycleDetails.end_date);
  const startDate = getDate(cycleDetails.start_date);
  const isDateValid = cycleDetails.start_date || cycleDetails.end_date;

  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const currentCycle = CYCLE_STATUS.find((status) => status.value === cycleStatus);

  const cycleTotalIssues =
    cycleDetails.backlog_issues +
    cycleDetails.unstarted_issues +
    cycleDetails.started_issues +
    cycleDetails.completed_issues +
    cycleDetails.cancelled_issues;

  const completionPercentage = (cycleDetails.completed_issues / cycleTotalIssues) * 100;

  const issueCount = cycleDetails
    ? cycleTotalIssues === 0
      ? "0 Issue"
      : cycleTotalIssues === cycleDetails.completed_issues
        ? `${cycleTotalIssues} Issue${cycleTotalIssues > 1 ? "s" : ""}`
        : `${cycleDetails.completed_issues}/${cycleTotalIssues} Issues`
    : "0 Issue";

  const handleAddToFavorites = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    const addToFavoritePromise = addCycleToFavorites(workspaceSlug?.toString(), projectId.toString(), cycleId).then(
      () => {
        captureEvent(CYCLE_FAVORITED, {
          cycle_id: cycleId,
          element: "Grid layout",
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
        element: "Grid layout",
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

  const openCycleOverview = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const query = generateQueryParams(searchParams, ["peekCycle"]);
    if (searchParams.has("peekCycle") && searchParams.get("peekCycle") === cycleId) {
      router.push(`${pathname}?${query}`);
    } else {
      router.push(`${pathname}?${query && `${query}&`}peekCycle=${cycleId}`);
    }
  };

  const daysLeft = findHowManyDaysLeft(cycleDetails.end_date) ?? 0;

  return (
    <div className="relative">
      <Link ref={parentRef} href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycleDetails.id}`}>
        <div className="flex h-44 w-full flex-col justify-between rounded  border border-custom-border-100 bg-custom-background-100 p-4 text-sm hover:shadow-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 truncate">
              <span className="flex-shrink-0">
                <CycleGroupIcon cycleGroup={cycleStatus as TCycleGroups} className="h-3.5 w-3.5" />
              </span>
              <Tooltip tooltipContent={cycleDetails.name} position="top" isMobile={isMobile}>
                <span className="truncate text-base font-medium">{cycleDetails.name}</span>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              {currentCycle && (
                <span
                  className="flex h-6 w-20 items-center justify-center rounded-sm text-center text-xs"
                  style={{
                    color: currentCycle.color,
                    backgroundColor: `${currentCycle.color}20`,
                  }}
                >
                  {currentCycle.value === "current"
                    ? `${daysLeft} ${daysLeft > 1 ? "days" : "day"} left`
                    : `${currentCycle.label}`}
                </span>
              )}
              <button onClick={openCycleOverview}>
                <Info className="h-4 w-4 text-custom-text-400" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-custom-text-200">
                <LayersIcon className="h-4 w-4 text-custom-text-300" />
                <span className="text-xs text-custom-text-300">{issueCount}</span>
              </div>
              {cycleDetails.assignee_ids && cycleDetails.assignee_ids.length > 0 && (
                <Tooltip tooltipContent={`${cycleDetails.assignee_ids.length} Members`} isMobile={isMobile}>
                  <div className="flex cursor-default items-center gap-1">
                    <AvatarGroup showTooltip={false}>
                      {cycleDetails.assignee_ids.map((assigne_id) => {
                        const member = getUserDetails(assigne_id);
                        return <Avatar key={member?.id} name={member?.display_name} src={member?.avatar} />;
                      })}
                    </AvatarGroup>
                  </div>
                </Tooltip>
              )}
            </div>

            <Tooltip
              isMobile={isMobile}
              tooltipContent={isNaN(completionPercentage) ? "0" : `${completionPercentage.toFixed(0)}%`}
              position="top-left"
            >
              <div className="flex w-full items-center">
                <div
                  className="bar relative h-1.5 w-full rounded bg-custom-background-90"
                  style={{
                    boxShadow: "1px 1px 4px 0px rgba(161, 169, 191, 0.35) inset",
                  }}
                >
                  <div
                    className="absolute left-0 top-0 h-1.5 rounded bg-blue-600 duration-300"
                    style={{
                      width: `${isNaN(completionPercentage) ? 0 : completionPercentage.toFixed(0)}%`,
                    }}
                  />
                </div>
              </div>
            </Tooltip>

            <div className="flex items-center justify-between">
              {isDateValid && (
                <div className="h-6 flex items-center gap-1.5 text-custom-text-300 border-[0.5px] border-custom-border-300 rounded text-xs px-2 cursor-default">
                  <CalendarClock className="h-3 w-3 flex-shrink-0" />
                  <span className="flex-grow truncate">{renderFormattedDate(startDate)}</span>
                  <MoveRight className="h-3 w-3 flex-shrink-0" />
                  <CalendarCheck2 className="h-3 w-3 flex-shrink-0" />
                  <span className="flex-grow truncate">{renderFormattedDate(endDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
      <div className="absolute right-4 bottom-3.5 flex items-center gap-1.5">
        {isEditingAllowed && (
          <FavoriteStar
            onClick={(e) => {
              if (cycleDetails.is_favorite) handleRemoveFromFavorites(e);
              else handleAddToFavorites(e);
            }}
            selected={!!cycleDetails.is_favorite}
          />
        )}

        <CycleQuickActions
          parentRef={parentRef}
          cycleId={cycleId}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
        />
      </div>
    </div>
  );
});
