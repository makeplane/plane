"use client";

import React, { FC, MouseEvent, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { observer } from "mobx-react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Eye, Users, ArrowRight, CalendarDays } from "lucide-react";
// types
import {
  CYCLE_FAVORITED,
  CYCLE_UNFAVORITED,
  EUserPermissions,
  EUserPermissionsLevel,
  IS_FAVORITE_MENU_OPEN,
} from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { ICycle, TCycleGroups } from "@plane/types";
// ui
import { Avatar, AvatarGroup, FavoriteStar, LayersIcon, Tooltip, TransferIcon, setPromiseToast } from "@plane/ui";
// components
import { CycleQuickActions, TransferIssuesModal } from "@/components/cycles";
import { DateRangeDropdown } from "@/components/dropdowns";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { getDate } from "@/helpers/date-time.helper";
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { generateQueryParams } from "@/helpers/router.helper";
import { useCycle, useEventTracker, useMember, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useTimeZoneConverter } from "@/hooks/use-timezone-converter";
// plane web components
import { CycleAdditionalActions } from "@/plane-web/components/cycles";

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
  const { isProjectTimeZoneDifferent, getProjectUTCOffset, renderFormattedDateInUserTimezone } =
    useTimeZoneConverter(projectId);
  // router
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  // store hooks
  const { addCycleToFavorites, removeCycleFromFavorites, updateCycleDetails } = useCycle();
  const { captureEvent } = useEventTracker();
  const { allowPermissions } = useUserPermissions();

  // local storage
  const { setValue: toggleFavoriteMenu, storedValue: isFavoriteMenuOpen } = useLocalStorage<boolean>(
    IS_FAVORITE_MENU_OPEN,
    false
  );

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

  const projectUTCOffset = getProjectUTCOffset();

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
        if (!isFavoriteMenuOpen) toggleFavoriteMenu(true);
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

  const createdByDetails = cycleDetails.created_by ? getUserDetails(cycleDetails.created_by) : undefined;

  useEffect(() => {
    if (cycleDetails)
      reset({
        ...cycleDetails,
      });
  }, [cycleDetails, reset]);

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
          <span>{t("project_cycles.transfer_work_items", { count: transferableIssuesCount })}</span>
        </div>
      )}
      {isActive ? (
        <>
          <div className="flex gap-2">
            {/* Duration */}
            <Tooltip
              tooltipContent={
                <span className="flex gap-1">
                  {renderFormattedDateInUserTimezone(cycleDetails.start_date ?? "")}
                  <ArrowRight className="h-3 w-3 flex-shrink-0 my-auto" />
                  {renderFormattedDateInUserTimezone(cycleDetails.end_date ?? "")}
                </span>
              }
              disabled={!isProjectTimeZoneDifferent()}
              tooltipHeading={t("project_cycles.in_your_timezone")}
            >
              <div className="flex gap-1 text-xs text-custom-text-300 font-medium items-center">
                <CalendarDays className="h-3 w-3 flex-shrink-0 my-auto" />
                {cycleDetails.start_date && <span>{format(parseISO(cycleDetails.start_date), "MMM dd, yyyy")}</span>}
                <ArrowRight className="h-3 w-3 flex-shrink-0 my-auto" />
                {cycleDetails.end_date && <span>{format(parseISO(cycleDetails.end_date), "MMM dd, yyyy")}</span>}
              </div>
            </Tooltip>
            {projectUTCOffset && (
              <span className="rounded-md text-xs px-2 cursor-default  py-1 bg-custom-background-80 text-custom-text-300">
                {projectUTCOffset}
              </span>
            )}
            {/* created by */}
            {createdByDetails && <ButtonAvatars showTooltip={false} userIds={createdByDetails?.id} />}
          </div>
        </>
      ) : (
        cycleDetails.start_date && (
          <>
            <DateRangeDropdown
              buttonVariant={"transparent-with-text"}
              buttonContainerClassName={`h-6 w-full cursor-auto flex items-center gap-1.5 text-custom-text-300 rounded text-xs [&>div]:hover:bg-transparent`}
              buttonClassName="p-0"
              minDate={new Date()}
              value={{
                from: getDate(cycleDetails.start_date),
                to: getDate(cycleDetails.end_date),
              }}
              placeholder={{
                from: t("project_cycles.start_date"),
                to: t("project_cycles.end_date"),
              }}
              showTooltip={isProjectTimeZoneDifferent()}
              customTooltipHeading={t("project_cycles.in_your_timezone")}
              customTooltipContent={
                <span className="flex gap-1">
                  {renderFormattedDateInUserTimezone(cycleDetails.start_date ?? "")}
                  <ArrowRight className="h-3 w-3 flex-shrink-0 my-auto" />
                  {renderFormattedDateInUserTimezone(cycleDetails.end_date ?? "")}
                </span>
              }
              required={cycleDetails.status !== "draft"}
              disabled
              hideIcon={{
                from: false,
                to: false,
              }}
            />
          </>
        )
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
