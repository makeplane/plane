"use client";

import React, { useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { CalendarCheck2, CalendarClock, Info, MoveRight, SquareUser } from "lucide-react";
// ui
import { FavoriteStar, LayersIcon, Tooltip, setPromiseToast } from "@plane/ui";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { ModuleQuickActions } from "@/components/modules";
// constants
import { MODULE_FAVORITED, MODULE_UNFAVORITED } from "@/constants/event-tracker";
import { MODULE_STATUS } from "@/constants/module";
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { getDate, renderFormattedDate } from "@/helpers/date-time.helper";
import { generateQueryParams } from "@/helpers/router.helper";
// hooks
import { useEventTracker, useMember, useModule, useProjectEstimates, useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web constants
import { EEstimateSystem } from "@/plane-web/constants/estimates";

type Props = {
  moduleId: string;
};

export const ModuleCardItem: React.FC<Props> = observer((props) => {
  const { moduleId } = props;
  // refs
  const parentRef = useRef(null);
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { getModuleById, addModuleToFavorites, removeModuleFromFavorites } = useModule();
  const { getUserDetails } = useMember();
  const { captureEvent } = useEventTracker();
  const { currentActiveEstimateId, areEstimateEnabledByProjectId, estimateById } = useProjectEstimates();

  // derived values
  const moduleDetails = getModuleById(moduleId);
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  const { isMobile } = usePlatformOS();
  const handleAddToFavorites = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    const addToFavoritePromise = addModuleToFavorites(workspaceSlug.toString(), projectId.toString(), moduleId).then(
      () => {
        captureEvent(MODULE_FAVORITED, {
          module_id: moduleId,
          element: "Grid layout",
          state: "SUCCESS",
        });
      }
    );

    setPromiseToast(addToFavoritePromise, {
      loading: "Adding module to favorites...",
      success: {
        title: "Success!",
        message: () => "Module added to favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't add the module to favorites. Please try again.",
      },
    });
  };

  const handleRemoveFromFavorites = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    const removeFromFavoritePromise = removeModuleFromFavorites(
      workspaceSlug.toString(),
      projectId.toString(),
      moduleId
    ).then(() => {
      captureEvent(MODULE_UNFAVORITED, {
        module_id: moduleId,
        element: "Grid layout",
        state: "SUCCESS",
      });
    });

    setPromiseToast(removeFromFavoritePromise, {
      loading: "Removing module from favorites...",
      success: {
        title: "Success!",
        message: () => "Module removed from favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't remove the module from favorites. Please try again.",
      },
    });
  };

  const openModuleOverview = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    const query = generateQueryParams(searchParams, ["peekModule"]);
    if (searchParams.has("peekModule")) {
      router.push(`${pathname}?${query}`);
    } else {
      router.push(`${pathname}?${query && `${query}&`}peekModule=${moduleId}`);
    }
  };

  if (!moduleDetails) return null;

  /**
   * NOTE: This completion percentage calculation is based on the total issues count.
   * when estimates are available and estimate type is points, we should consider the estimate point count
   * when estimates are available and estimate type is not points, then by default we consider the issue count
   */
  const isEstimateEnabled =
    projectId &&
    currentActiveEstimateId &&
    areEstimateEnabledByProjectId(projectId.toString()) &&
    estimateById(currentActiveEstimateId)?.type === EEstimateSystem.POINTS;

  const moduleTotalIssues = isEstimateEnabled
    ? moduleDetails?.total_estimate_points || 0
    : moduleDetails.backlog_issues +
      moduleDetails.unstarted_issues +
      moduleDetails.started_issues +
      moduleDetails.completed_issues +
      moduleDetails.cancelled_issues;

  const moduleCompletedIssues = isEstimateEnabled
    ? moduleDetails?.completed_estimate_points || 0
    : moduleDetails.completed_issues;

  const completionPercentage = (moduleCompletedIssues / moduleTotalIssues) * 100;

  const endDate = getDate(moduleDetails.target_date);
  const startDate = getDate(moduleDetails.start_date);

  const isDateValid = moduleDetails.target_date || moduleDetails.start_date;

  // const areYearsEqual = startDate.getFullYear() === endDate.getFullYear();

  const moduleStatus = MODULE_STATUS.find((status) => status.value === moduleDetails.status);

  const issueCount = module
    ? !moduleTotalIssues || moduleTotalIssues === 0
      ? `0 ${isEstimateEnabled ? `Point` : `Issue`}`
      : moduleTotalIssues === moduleCompletedIssues
        ? `${moduleTotalIssues} Issue${moduleTotalIssues > 1 ? `s` : ``}`
        : `${moduleCompletedIssues}/${moduleTotalIssues} ${isEstimateEnabled ? `Points` : `Issues`}`
    : `0 ${isEstimateEnabled ? `Point` : `Issue`}`;

  const moduleLeadDetails = moduleDetails.lead_id ? getUserDetails(moduleDetails.lead_id) : undefined;

  return (
    <div className="relative">
      <Link ref={parentRef} href={`/${workspaceSlug}/projects/${moduleDetails.project_id}/modules/${moduleDetails.id}`}>
        <div className="flex h-44 w-full flex-col justify-between rounded  border border-custom-border-100 bg-custom-background-100 p-4 text-sm hover:shadow-md">
          <div>
            <div className="flex items-center justify-between gap-2">
              <Tooltip tooltipContent={moduleDetails.name} position="top" isMobile={isMobile}>
                <span className="truncate text-base font-medium">{moduleDetails.name}</span>
              </Tooltip>
              <div className="flex items-center gap-2">
                {moduleStatus && (
                  <span
                    className="flex h-6 w-20 items-center justify-center rounded-sm text-center text-xs"
                    style={{
                      color: moduleStatus.color,
                      backgroundColor: `${moduleStatus.color}20`,
                    }}
                  >
                    {moduleStatus.label}
                  </span>
                )}
                <button onClick={openModuleOverview}>
                  <Info className="h-4 w-4 text-custom-text-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-custom-text-200">
                <LayersIcon className="h-4 w-4 text-custom-text-300" />
                <span className="text-xs text-custom-text-300">{issueCount ?? "0 Issue"}</span>
              </div>
              {moduleLeadDetails ? (
                <span className="cursor-default">
                  <ButtonAvatars showTooltip={false} userIds={moduleLeadDetails?.id} />
                </span>
              ) : (
                <Tooltip tooltipContent="No lead">
                  <SquareUser className="h-4 w-4 mx-1 text-custom-text-300 " />
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

            <div className="flex items-center justify-between py-0.5">
              {isDateValid ? (
                <div className="h-6 flex items-center gap-1.5 text-custom-text-300 border-[0.5px] border-custom-border-300 rounded text-xs px-2 cursor-default">
                  <CalendarClock className="h-3 w-3 flex-shrink-0" />
                  <span className="flex-grow truncate">{renderFormattedDate(startDate)}</span>
                  <MoveRight className="h-3 w-3 flex-shrink-0" />
                  <CalendarCheck2 className="h-3 w-3 flex-shrink-0" />
                  <span className="flex-grow truncate">{renderFormattedDate(endDate)}</span>
                </div>
              ) : (
                <span className="text-xs text-custom-text-400">No due date</span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <div className="absolute right-4 bottom-[18px] flex items-center gap-1.5">
        {isEditingAllowed && (
          <FavoriteStar
            onClick={(e) => {
              if (moduleDetails.is_favorite) handleRemoveFromFavorites(e);
              else handleAddToFavorites(e);
            }}
            selected={!!moduleDetails.is_favorite}
          />
        )}
        {workspaceSlug && projectId && (
          <ModuleQuickActions
            parentRef={parentRef}
            moduleId={moduleId}
            projectId={projectId.toString()}
            workspaceSlug={workspaceSlug.toString()}
          />
        )}
      </div>
    </div>
  );
});
