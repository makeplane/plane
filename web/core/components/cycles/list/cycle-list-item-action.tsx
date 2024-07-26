"use client";

import React, { FC, MouseEvent } from "react";
import { observer } from "mobx-react";
import { CalendarCheck2, CalendarClock, MoveRight, Users } from "lucide-react";
// types
import { ICycle, TCycleGroups } from "@plane/types";
// ui
import { Avatar, AvatarGroup, FavoriteStar, Tooltip, setPromiseToast } from "@plane/ui";
// components
import { CycleQuickActions } from "@/components/cycles";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// constants
import { CYCLE_STATUS } from "@/constants/cycle";
import { CYCLE_FAVORITED, CYCLE_UNFAVORITED } from "@/constants/event-tracker";
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { findHowManyDaysLeft, getDate, renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { useCycle, useEventTracker, useMember, useUser } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
  cycleDetails: ICycle;
  parentRef: React.RefObject<HTMLDivElement>;
};

export const CycleListItemAction: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, cycleId, cycleDetails, parentRef } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  // store hooks
  const { addCycleToFavorites, removeCycleFromFavorites } = useCycle();
  const { captureEvent } = useEventTracker();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { getUserDetails } = useMember();

  // derived values
  const endDate = getDate(cycleDetails.end_date);
  const startDate = getDate(cycleDetails.start_date);
  const cycleStatus = cycleDetails.status ? (cycleDetails.status.toLocaleLowerCase() as TCycleGroups) : "draft";
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  const renderDate = cycleDetails.start_date || cycleDetails.end_date;
  const currentCycle = CYCLE_STATUS.find((status) => status.value === cycleStatus);
  const daysLeft = findHowManyDaysLeft(cycleDetails.end_date) ?? 0;

  // handlers
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

  const createdByDetails = cycleDetails.created_by ? getUserDetails(cycleDetails.created_by) : undefined;

  return (
    <>
      {renderDate && (
        <div className="h-6 flex items-center gap-1.5 text-custom-text-300 border-[0.5px] border-custom-border-300 rounded text-xs px-2 cursor-default">
          <CalendarClock className="h-3 w-3 flex-shrink-0" />
          <span className="flex-grow truncate">{renderFormattedDate(startDate)}</span>
          <MoveRight className="h-3 w-3 flex-shrink-0" />
          <CalendarCheck2 className="h-3 w-3 flex-shrink-0" />
          <span className="flex-grow truncate">{renderFormattedDate(endDate)}</span>
        </div>
      )}

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

      {/* created by */}
      {createdByDetails && <ButtonAvatars showTooltip={false} userIds={createdByDetails?.id} />}

      <Tooltip tooltipContent={`${cycleDetails.assignee_ids?.length} Members`} isMobile={isMobile}>
        <div className="flex w-10 cursor-default items-center justify-center">
          {cycleDetails.assignee_ids && cycleDetails.assignee_ids?.length > 0 ? (
            <AvatarGroup showTooltip={false}>
              {cycleDetails.assignee_ids?.map((assignee_id) => {
                const member = getUserDetails(assignee_id);
                return <Avatar key={member?.id} name={member?.display_name} src={member?.avatar} />;
              })}
            </AvatarGroup>
          ) : (
            <Users className="h-4 w-4 text-custom-text-300" />
          )}
        </div>
      </Tooltip>

      {isEditingAllowed && !cycleDetails.archived_at && (
        <FavoriteStar
          onClick={(e) => {
            if (cycleDetails.is_favorite) handleRemoveFromFavorites(e);
            else handleAddToFavorites(e);
          }}
          selected={!!cycleDetails.is_favorite}
        />
      )}
      <CycleQuickActions parentRef={parentRef} cycleId={cycleId} projectId={projectId} workspaceSlug={workspaceSlug} />
    </>
  );
});
