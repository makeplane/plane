import React from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useRouter } from "next/router";
// icons
import { Info, Star } from "lucide-react";
// ui
import { Avatar, AvatarGroup, LayersIcon, Tooltip, setPromiseToast } from "@plane/ui";
// components
import { ModuleQuickActions } from "@/components/modules";
// constants
import { MODULE_FAVORITED, MODULE_UNFAVORITED } from "@/constants/event-tracker";
import { MODULE_STATUS } from "@/constants/module";
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { getDate, renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { useEventTracker, useMember, useModule, useUser } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  moduleId: string;
};

export const ModuleCardItem: React.FC<Props> = observer((props) => {
  const { moduleId } = props;
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

  const openModuleOverview = (e: React.MouseEvent<HTMLButtonElement>) => {
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

  const moduleTotalIssues =
    moduleDetails.backlog_issues +
    moduleDetails.unstarted_issues +
    moduleDetails.started_issues +
    moduleDetails.completed_issues +
    moduleDetails.cancelled_issues;

  const completionPercentage = (moduleDetails.completed_issues / moduleTotalIssues) * 100;

  const endDate = getDate(moduleDetails.target_date);
  const startDate = getDate(moduleDetails.start_date);

  const isDateValid = moduleDetails.target_date || moduleDetails.start_date;

  // const areYearsEqual = startDate.getFullYear() === endDate.getFullYear();

  const moduleStatus = MODULE_STATUS.find((status) => status.value === moduleDetails.status);

  const issueCount = module
    ? !moduleTotalIssues || moduleTotalIssues === 0
      ? "0 Issue"
      : moduleTotalIssues === moduleDetails.completed_issues
      ? `${moduleTotalIssues} Issue${moduleTotalIssues > 1 ? "s" : ""}`
      : `${moduleDetails.completed_issues}/${moduleTotalIssues} Issues`
    : "0 Issue";

  return (
    <Link href={`/${workspaceSlug}/projects/${moduleDetails.project_id}/modules/${moduleDetails.id}`}>
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
            {moduleDetails.member_ids?.length > 0 && (
              <Tooltip tooltipContent={`${moduleDetails.member_ids.length} Members`} isMobile={isMobile}>
                <div className="flex cursor-default items-center gap-1">
                  <AvatarGroup showTooltip={false}>
                    {moduleDetails.member_ids.map((member_id) => {
                      const member = getUserDetails(member_id);
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
            {isDateValid ? (
              <>
                <span className="text-xs text-custom-text-300">
                  {renderFormattedDate(startDate) ?? "_ _"} - {renderFormattedDate(endDate) ?? "_ _"}
                </span>
              </>
            ) : (
              <span className="text-xs text-custom-text-400">No due date</span>
            )}

            <div className="z-[5] flex items-center gap-1.5">
              {isEditingAllowed &&
                (moduleDetails.is_favorite ? (
                  <button type="button" onClick={handleRemoveFromFavorites}>
                    <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                  </button>
                ) : (
                  <button type="button" onClick={handleAddToFavorites}>
                    <Star className="h-3.5 w-3.5 text-custom-text-200" />
                  </button>
                ))}
              {workspaceSlug && projectId && (
                <ModuleQuickActions
                  moduleId={moduleId}
                  projectId={projectId.toString()}
                  workspaceSlug={workspaceSlug.toString()}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});
