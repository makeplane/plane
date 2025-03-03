"use client";

import React, { FC, MouseEvent, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { CalendarCheck2, CalendarClock, Eye, Users } from "lucide-react";
// types
import { CYCLE_FAVORITED, CYCLE_UNFAVORITED, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ICycle, TCycleGroups } from "@plane/types";
// ui
import {
  Avatar,
  AvatarGroup,
  FavoriteStar,
  LayersIcon,
  TOAST_TYPE,
  Tooltip,
  TransferIcon,
  setPromiseToast,
  setToast,
} from "@plane/ui";
// components
import { CycleQuickActions, TransferIssuesModal } from "@/components/cycles";
import { DateDropdown } from "@/components/dropdowns";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// constants
// helpers
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { generateQueryParams } from "@/helpers/router.helper";
import { useCycle, useEventTracker, useMember, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { CycleAdditionalActions } from "@/plane-web/components/cycles";
// plane web constants
// services
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
  // router
  const { projectId: routerProjectId } = useParams();
  //states
  const [transferIssuesModal, setTransferIssuesModal] = useState(false);
  // hooks
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
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
  const { control, reset, getValues } = useForm({
    defaultValues,
  });

  // derived values
  const cycleStatus = cycleDetails.status ? (cycleDetails.status.toLocaleLowerCase() as TCycleGroups) : "draft";

  const showIssueCount = useMemo(() => cycleStatus === "draft" || cycleStatus === "upcoming", [cycleStatus]);

  const transferableIssuesCount = cycleDetails
    ? cycleDetails.total_issues - (cycleDetails.cancelled_issues + cycleDetails.completed_issues)
    : 0;

  const showTransferIssues = routerProjectId && transferableIssuesCount > 0 && cycleStatus === "completed";

  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

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
      loading: t("project_cycles.action.favorite.loading"),
      success: {
        title: t("project_cycles.action.favorite.success.title"),
        message: () => t("project_cycles.action.favorite.success.description"),
      },
      error: {
        title: t("project_cycles.action.favorite.failed.title"),
        message: () => t("project_cycles.action.favorite.failed.description"),
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
      loading: t("project_cycles.action.unfavorite.loading"),
      success: {
        title: t("project_cycles.action.unfavorite.success.title"),
        message: () => t("project_cycles.action.unfavorite.success.description"),
      },
      error: {
        title: t("project_cycles.action.unfavorite.failed.title"),
        message: () => t("project_cycles.action.unfavorite.failed.description"),
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
    } catch {
      return false;
    }
  };

  const handleDateChange = async (payload: { start_date?: string | null; end_date?: string | null }) => {
    let isDateValid = false;

    if (cycleDetails?.start_date && cycleDetails?.end_date)
      isDateValid = await dateChecker({
        ...payload,
        cycle_id: cycleDetails?.id,
      });
    else isDateValid = await dateChecker(payload);

    if (isDateValid) {
      submitChanges(payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("project_cycles.action.update.success.title"),
        message: t("project_cycles.action.update.success.description"),
      });
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_cycles.action.update.failed.title"),
        message: t("project_cycles.action.update.error.already_exists"),
      });
      reset({ ...cycleDetails });
    }
    return isDateValid;
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
      router.push(`${pathname}?${query}`, {}, { showProgressBar: false });
    } else {
      router.push(`${pathname}?${query && `${query}&`}peekCycle=${cycleId}`, {}, { showProgressBar: false });
    }
  };

  return (
    <>
      <TransferIssuesModal
        handleClose={() => setTransferIssuesModal(false)}
        isOpen={transferIssuesModal}
        cycleId={cycleId.toString()}
      />
      <button
        onClick={openCycleOverview}
        className={`z-[1] flex text-custom-primary-200 text-xs gap-1 flex-shrink-0 ${isMobile || (isActive && !searchParams.has("peekCycle")) ? "flex" : "hidden group-hover:flex"}`}
      >
        <Eye className="h-4 w-4 my-auto  text-custom-primary-200" />
        <span>{t("project_cycles.more_details")}</span>
      </button>

      {showIssueCount && (
        <div className="flex items-center gap-1">
          <LayersIcon className="h-4 w-4 text-custom-text-300" />
          <span className="text-xs text-custom-text-300">{cycleDetails.total_issues}</span>
        </div>
      )}

      <CycleAdditionalActions cycleId={cycleId} projectId={projectId} />
      {showTransferIssues && (
        <div
          className="px-2 h-6  text-custom-primary-200 flex items-center gap-1 cursor-pointer"
          onClick={() => {
            setTransferIssuesModal(true);
          }}
        >
          <TransferIcon className="fill-custom-primary-200 w-4" />
          <span>Transfer {transferableIssuesCount} work items</span>
        </div>
      )}

      {!isActive && (
        <Controller
          name="start_date"
          control={control}
          rules={{ required: "Please select a date" }}
          render={({ field: { value, onChange } }) => (
            <DateDropdown
              value={value ?? null}
              onChange={async (val) => {
                let isDateValid;
                const valDate = val ? renderFormattedPayloadDate(val) : null;
                if (getValues("end_date")) {
                  isDateValid = await handleDateChange({
                    start_date: valDate,
                    end_date: renderFormattedPayloadDate(getValues("end_date")),
                  });
                } else {
                  isDateValid = await handleDateChange({
                    start_date: valDate,
                    end_date: valDate,
                  });
                }
                isDateValid && onChange(renderFormattedPayloadDate(val));
              }}
              placeholder={t("common.order_by.start_date")}
              icon={<CalendarClock className="h-3 w-3 flex-shrink-0" />}
              buttonVariant={value ? "border-with-text" : "border-without-text"}
              buttonContainerClassName={`h-6 w-full flex ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"} items-center gap-1.5 text-custom-text-300 rounded text-xs`}
              optionsClassName="z-10"
              disabled={isDisabled}
              renderByDefault={isMobile}
              showTooltip
              maxDate={getDate(getValues("end_date"))}
              isClearable={false}
            />
          )}
        />
      )}

      {!isActive && (
        <Controller
          name="end_date"
          control={control}
          rules={{ required: "Please select a date" }}
          render={({ field: { value, onChange } }) => (
            <DateDropdown
              value={getDate(value) ?? null}
              onChange={async (val) => {
                let isDateValid;
                const valDate = val ? renderFormattedPayloadDate(val) : null;
                if (getValues("start_date")) {
                  isDateValid = await handleDateChange({
                    end_date: valDate,
                    start_date: renderFormattedPayloadDate(getValues("start_date")),
                  });
                } else {
                  isDateValid = await handleDateChange({
                    end_date: valDate,
                    start_date: valDate,
                  });
                }
                isDateValid && onChange(renderFormattedPayloadDate(val));
              }}
              placeholder={t("common.order_by.due_date")}
              icon={<CalendarCheck2 className="h-3 w-3 flex-shrink-0" />}
              buttonVariant={value ? "border-with-text" : "border-without-text"}
              buttonContainerClassName={`h-6 w-full flex ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"} items-center gap-1.5 text-custom-text-300 rounded text-xs`}
              optionsClassName="z-10"
              disabled={isDisabled}
              renderByDefault={isMobile}
              showTooltip
              minDate={getDate(getValues("start_date"))}
              isClearable={false}
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
                  return (
                    <Avatar key={member?.id} name={member?.display_name} src={getFileURL(member?.avatar_url ?? "")} />
                  );
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
