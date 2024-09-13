"use client";

import React, { FC, MouseEvent, useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Eye, Users } from "lucide-react";
// types
import { ICycle, TCycleGroups } from "@plane/types";
// ui
import { Avatar, AvatarGroup, FavoriteStar, TOAST_TYPE, Tooltip, setPromiseToast, setToast } from "@plane/ui";
// components
import { CycleQuickActions } from "@/components/cycles";
import { DateRangeDropdown } from "@/components/dropdowns";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// constants
import { CYCLE_STATUS } from "@/constants/cycle";
import { CYCLE_FAVORITED, CYCLE_UNFAVORITED } from "@/constants/event-tracker";
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { findHowManyDaysLeft, getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// hooks
import { useCycle, useEventTracker, useMember, useUser } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { CycleService } from "@/services/cycle.service";
import Link from "next/link";

type Props = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
  cycleDetails: ICycle;
  parentRef: React.RefObject<HTMLDivElement>;
};

const defaultValues: Partial<ICycle> = {
  start_date: null,
  end_date: null,
};

export const CycleListItemAction: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, cycleId, cycleDetails, parentRef } = props;
  // store hooks
  const { addCycleToFavorites, removeCycleFromFavorites } = useCycle();
  const { captureEvent } = useEventTracker();
  const {
    membership: { currentProjectRole },
  } = useUser();

  // form
  const { reset } = useForm({
    defaultValues,
  });

  // derived values
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

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

  useEffect(() => {
    if (cycleDetails)
      reset({
        ...cycleDetails,
      });
  }, [cycleDetails, reset]);
  return (
    <>
      <Link
        className="flex text-sm gap-1 mr-2 text-custom-primary-200"
        href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`}
      >
        <Eye className="h-4 w-4 my-auto" />
        <span>More details</span>
      </Link>
      {isEditingAllowed && !cycleDetails.archived_at && (
        <FavoriteStar
          onClick={(e) => {
            if (cycleDetails.is_favorite) handleRemoveFromFavorites(e);
            else handleAddToFavorites(e);
          }}
          selected={!!cycleDetails.is_favorite}
        />
      )}
      <div className="hidden md:block">
        <CycleQuickActions
          parentRef={parentRef}
          cycleId={cycleId}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
        />
      </div>
    </>
  );
});
