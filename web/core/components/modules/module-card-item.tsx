"use client";

import React, { SyntheticEvent, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { Info, SquareUser } from "lucide-react";
// ui
import { IModule } from "@plane/types";
import {
  Card,
  FavoriteStar,
  LayersIcon,
  LinearProgressIndicator,
  TOAST_TYPE,
  Tooltip,
  setPromiseToast,
  setToast,
} from "@plane/ui";
// components
import { DateRangeDropdown } from "@/components/dropdowns";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { ModuleQuickActions } from "@/components/modules";
import { ModuleStatusDropdown } from "@/components/modules/module-status-dropdown";
// constants
import { PROGRESS_STATE_GROUPS_DETAILS } from "@/constants/common";
import { MODULE_FAVORITED, MODULE_UNFAVORITED } from "@/constants/event-tracker";
import { MODULE_STATUS } from "@/constants/module";
// helpers
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { generateQueryParams } from "@/helpers/router.helper";
// hooks
import { useEventTracker, useMember, useModule, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

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
  const { allowPermissions } = useUserPermissions();
  const { getModuleById, addModuleToFavorites, removeModuleFromFavorites, updateModuleDetails } = useModule();
  const { getUserDetails } = useMember();
  const { captureEvent } = useEventTracker();

  // derived values
  const moduleDetails = getModuleById(moduleId);
  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const isDisabled = !isEditingAllowed || !!moduleDetails?.archived_at;
  const renderIcon = Boolean(moduleDetails?.start_date) || Boolean(moduleDetails?.target_date);

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

  const handleEventPropagation = (e: SyntheticEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleModuleDetailsChange = async (payload: Partial<IModule>) => {
    if (!workspaceSlug || !projectId) return;

    await updateModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleId, payload)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Module updated successfully.",
        });
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.detail ?? "Module could not be updated. Please try again.",
        });
      });
  };

  const openModuleOverview = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    const query = generateQueryParams(searchParams, ["peekModule"]);
    if (searchParams.has("peekModule") && searchParams.get("peekModule") === moduleId) {
      router.push(`${pathname}?${query}`);
    } else {
      router.push(`${pathname}?${query && `${query}&`}peekModule=${moduleId}`);
    }
  };

  if (!moduleDetails) return null;

  const moduleTotalIssues =
    moduleDetails.backlog_issues +
    moduleDetails.unstarted_issues +
    moduleDetails.started_issues +
    moduleDetails.completed_issues +
    moduleDetails.cancelled_issues;

  const moduleCompletedIssues = moduleDetails.completed_issues;

  // const areYearsEqual = startDate.getFullYear() === endDate.getFullYear();

  const moduleStatus = MODULE_STATUS.find((status) => status.value === moduleDetails.status);

  const issueCount = module
    ? !moduleTotalIssues || moduleTotalIssues === 0
      ? `0 Issue`
      : moduleTotalIssues === moduleCompletedIssues
        ? `${moduleTotalIssues} Issue${moduleTotalIssues > 1 ? `s` : ``}`
        : `${moduleCompletedIssues}/${moduleTotalIssues} Issues`
    : `0 Issue`;

  const moduleLeadDetails = moduleDetails.lead_id ? getUserDetails(moduleDetails.lead_id) : undefined;

  const progressIndicatorData = PROGRESS_STATE_GROUPS_DETAILS.map((group, index) => ({
    id: index,
    name: group.title,
    value: moduleTotalIssues > 0 ? (moduleDetails[group.key as keyof IModule] as number) : 0,
    color: group.color,
  }));

  return (
    <div className="relative" data-prevent-nprogress>
      <Link ref={parentRef} href={`/${workspaceSlug}/projects/${moduleDetails.project_id}/modules/${moduleDetails.id}`}>
        <Card>
          <div>
            <div className="flex items-center justify-between gap-2">
              <Tooltip tooltipContent={moduleDetails.name} position="top" isMobile={isMobile}>
                <span className="truncate text-base font-medium">{moduleDetails.name}</span>
              </Tooltip>
              <div className="flex items-center gap-2" onClick={handleEventPropagation}>
                {moduleStatus && (
                  <ModuleStatusDropdown
                    isDisabled={isDisabled}
                    moduleDetails={moduleDetails}
                    handleModuleDetailsChange={handleModuleDetailsChange}
                  />
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
            <LinearProgressIndicator size="lg" data={progressIndicatorData} />
            <div className="flex items-center justify-between py-0.5" onClick={handleEventPropagation}>
              <DateRangeDropdown
                buttonContainerClassName={`h-6 w-full flex ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"} items-center gap-1.5 text-custom-text-300 border-[0.5px] border-custom-border-300 rounded text-xs`}
                buttonVariant="transparent-with-text"
                className="h-7"
                value={{
                  from: getDate(moduleDetails.start_date),
                  to: getDate(moduleDetails.target_date),
                }}
                onSelect={(val) => {
                  handleModuleDetailsChange({
                    start_date: val?.from ? renderFormattedPayloadDate(val.from) : null,
                    target_date: val?.to ? renderFormattedPayloadDate(val.to) : null,
                  });
                }}
                placeholder={{
                  from: "Start date",
                  to: "End date",
                }}
                disabled={isDisabled}
                hideIcon={{ from: renderIcon ?? true, to: renderIcon }}
              />
            </div>
          </div>
        </Card>
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
