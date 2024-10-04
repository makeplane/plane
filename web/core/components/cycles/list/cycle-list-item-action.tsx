"use client";

import React, { FC, MouseEvent, useEffect } from "react";
import { observer } from "mobx-react";
import { usePathname, useSearchParams } from "next/navigation";
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
// helpers
import { findHowManyDaysLeft, getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// hooks
import { generateQueryParams } from "@/helpers/router.helper";
import { useCycle, useEventTracker, useMember, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
import { CycleService } from "@/services/cycle.service";

const cycleService = new CycleService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
  cycleDetails: ICycle;
  parentRef: React.RefObject<HTMLDivElement>;
  isActive?: boolean;
};

const defaultValues: Partial<ICycle> = {
  start_date: null,
  end_date: null,
};

export const CycleListItemAction: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, cycleId, cycleDetails, parentRef, isActive = false } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  // router
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  // store hooks
  const { addCycleToFavorites, removeCycleFromFavorites, updateCycleDetails } = useCycle();
  const { captureEvent } = useEventTracker();
  const { allowPermissions } = useUserPermissions();

  const { getUserDetails } = useMember();

  // form
  const { control, reset } = useForm({
    defaultValues,
  });

  // derived values
  const cycleStatus = cycleDetails.status ? (cycleDetails.status.toLocaleLowerCase() as TCycleGroups) : "draft";
  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const renderIcon = Boolean(cycleDetails.start_date) || Boolean(cycleDetails.end_date);
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

  const submitChanges = (data: Partial<ICycle>) => {
    if (!workspaceSlug || !projectId || !cycleId) return;
    updateCycleDetails(workspaceSlug.toString(), projectId.toString(), cycleId.toString(), data);
  };

  const dateChecker = async (payload: any) => {
    try {
      const res = await cycleService.cycleDateCheck(workspaceSlug as string, projectId as string, payload);
      return res.status;
    } catch (err) {
      return false;
    }
  };

  const handleDateChange = async (startDate: Date | undefined, endDate: Date | undefined) => {
    if (!startDate || !endDate) return;

    let isDateValid = false;

    const payload = {
      start_date: renderFormattedPayloadDate(startDate),
      end_date: renderFormattedPayloadDate(endDate),
    };

    if (cycleDetails && cycleDetails.start_date && cycleDetails.end_date)
      isDateValid = await dateChecker({
        ...payload,
        cycle_id: cycleDetails.id,
      });
    else isDateValid = await dateChecker(payload);

    if (isDateValid) {
      submitChanges(payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Cycle updated successfully.",
      });
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message:
          "You already have a cycle on the given dates, if you want to create a draft cycle, you can do that by removing both the dates.",
      });
      reset({ ...cycleDetails });
    }
  };

  const createdByDetails = cycleDetails.created_by ? getUserDetails(cycleDetails.created_by) : undefined;

  useEffect(() => {
    if (cycleDetails)
      reset({
        ...cycleDetails,
      });
  }, [cycleDetails, reset]);

  const isArchived = Boolean(cycleDetails.archived_at);
  const isCompleted = cycleStatus === "completed";

  const isDisabled = !isEditingAllowed || isArchived || isCompleted;
  // handlers
  const openCycleOverview = (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const query = generateQueryParams(searchParams, ["peekCycle"]);
    if (searchParams.has("peekCycle") && searchParams.get("peekCycle") === cycleId) {
      router.push(`${pathname}?${query}`);
    } else {
      router.push(`${pathname}?${query && `${query}&`}peekCycle=${cycleId}`);
    }
  };

  return (
    <>
      <button
        onClick={openCycleOverview}
        className={`z-[1] flex text-custom-primary-200 text-xs gap-1 flex-shrink-0 ${isMobile || isActive ? "flex" : "hidden group-hover:flex"}`}
      >
        <Eye className="h-4 w-4 my-auto  text-custom-primary-200" />
        <span>More details</span>
      </button>

      {!isActive && (
        <Controller
          control={control}
          name="start_date"
          render={({ field: { value: startDateValue, onChange: onChangeStartDate } }) => (
            <Controller
              control={control}
              name="end_date"
              render={({ field: { value: endDateValue, onChange: onChangeEndDate } }) => (
                <DateRangeDropdown
                  buttonContainerClassName={`h-6 w-full flex ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"} items-center gap-1.5 text-custom-text-300 border-[0.5px] border-custom-border-300 rounded text-xs`}
                  buttonVariant="transparent-with-text"
                  minDate={new Date()}
                  value={{
                    from: getDate(startDateValue),
                    to: getDate(endDateValue),
                  }}
                  onSelect={(val) => {
                    onChangeStartDate(val?.from ? renderFormattedPayloadDate(val.from) : null);
                    onChangeEndDate(val?.to ? renderFormattedPayloadDate(val.to) : null);
                    handleDateChange(val?.from, val?.to);
                  }}
                  placeholder={{
                    from: "Start date",
                    to: "End date",
                  }}
                  required={cycleDetails.status !== "draft"}
                  disabled={isDisabled}
                  hideIcon={{ from: renderIcon ?? true, to: renderIcon }}
                />
              )}
            />
          )}
        />
      )}

      {/* created by */}
      {createdByDetails && !isActive && <ButtonAvatars showTooltip={false} userIds={createdByDetails?.id} />}

      {!isActive && (
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
      )}

      {isEditingAllowed && !cycleDetails.archived_at && (
        <FavoriteStar
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
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
