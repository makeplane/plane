import React from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useRouter } from "next/router";
import { Check, Info, User2 } from "lucide-react";
// ui
import { Avatar, AvatarGroup, CircularProgressIndicator, Tooltip, setPromiseToast } from "@plane/ui";
// components
import { FavoriteStar } from "@/components/core";
import { ModuleQuickActions } from "@/components/modules";
// constants
import { MODULE_FAVORITED, MODULE_UNFAVORITED } from "@/constants/event-tracker";
import { MODULE_STATUS } from "@/constants/module";
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { getDate, renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { useModule, useUser, useEventTracker, useMember } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  moduleId: string;
  isArchived?: boolean;
};

export const ModuleListItem: React.FC<Props> = observer((props) => {
  const { moduleId, isArchived = false } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { getModuleById, addModuleToFavorites, removeModuleFromFavorites } = useModule();
  const { getUserDetails } = useMember();
  const { captureEvent } = useEventTracker();
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

  const openModuleOverview = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const { query } = router;

    if (query.peekModule) {
      delete query.peekModule;
      router.push({
        pathname: router.pathname,
        query: { ...query },
      });
    } else {
      router.push({
        pathname: router.pathname,
        query: { ...query, peekModule: moduleId },
      });
    }
  };

  if (!moduleDetails) return null;

  const completionPercentage =
    ((moduleDetails.completed_issues + moduleDetails.cancelled_issues) / moduleDetails.total_issues) * 100;

  const endDate = getDate(moduleDetails.target_date);
  const startDate = getDate(moduleDetails.start_date);

  const renderDate = moduleDetails.start_date || moduleDetails.target_date;

  // const areYearsEqual = startDate.getFullYear() === endDate.getFullYear();

  const moduleStatus = MODULE_STATUS.find((status) => status.value === moduleDetails.status);

  const progress = isNaN(completionPercentage) ? 0 : Math.floor(completionPercentage);

  const completedModuleCheck = moduleDetails.status === "completed";

  return (
    <Link
      href={`/${workspaceSlug}/projects/${moduleDetails.project_id}/modules/${moduleDetails.id}`}
      onClick={(e) => {
        if (isArchived) {
          openModuleOverview(e);
        }
      }}
    >
      <div className="group flex w-full flex-col items-center justify-between gap-5 border-b border-custom-border-100 bg-custom-background-100 px-5 py-6 text-sm hover:bg-custom-background-90 sm:flex-row">
        <div className="relative flex w-full items-center justify-between gap-3 overflow-hidden">
          <div className="relative flex w-full items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-4 truncate">
              <span className="flex-shrink-0">
                <CircularProgressIndicator size={38} percentage={progress}>
                  {completedModuleCheck ? (
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
              </span>
              <Tooltip tooltipContent={moduleDetails.name} position="top" isMobile={isMobile}>
                <span className="truncate text-base font-medium">{moduleDetails.name}</span>
              </Tooltip>
            </div>
            <button onClick={openModuleOverview} className="z-[5] hidden flex-shrink-0 group-hover:flex">
              <Info className="h-4 w-4 text-custom-text-400" />
            </button>
          </div>
          <div className="flex flex-shrink-0 items-center justify-center">
            {moduleStatus && (
              <span
                className="flex h-6 w-20 flex-shrink-0 items-center justify-center rounded-sm text-center text-xs"
                style={{
                  color: moduleStatus.color,
                  backgroundColor: `${moduleStatus.color}20`,
                }}
              >
                {moduleStatus.label}
              </span>
            )}
          </div>
        </div>

        <div className="relative flex w-full items-center justify-between gap-2.5 sm:w-auto sm:flex-shrink-0 sm:justify-end ">
          <div className="text-xs text-custom-text-300">
            {renderDate && (
              <span className=" text-xs text-custom-text-300">
                {renderFormattedDate(startDate) ?? "_ _"} - {renderFormattedDate(endDate) ?? "_ _"}
              </span>
            )}
          </div>

          <div className="relative flex flex-shrink-0 items-center gap-3">
            <Tooltip tooltipContent={`${moduleDetails?.member_ids?.length || 0} Members`} isMobile={isMobile}>
              <div className="flex w-10 cursor-default items-center justify-center gap-1">
                {moduleDetails.member_ids.length > 0 ? (
                  <AvatarGroup showTooltip={false}>
                    {moduleDetails.member_ids.map((member_id) => {
                      const member = getUserDetails(member_id);
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

            {isEditingAllowed && !isArchived && (
              <FavoriteStar
                onClick={(e) => {
                  if (moduleDetails.is_favorite) handleRemoveFromFavorites(e);
                  else handleAddToFavorites(e);
                }}
                selected={moduleDetails.is_favorite}
              />
            )}
            {workspaceSlug && projectId && (
              <ModuleQuickActions
                moduleId={moduleId}
                projectId={projectId.toString()}
                workspaceSlug={workspaceSlug.toString()}
                isArchived={isArchived}
              />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});
