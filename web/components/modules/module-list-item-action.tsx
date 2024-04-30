import React, { FC } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// icons
import { User2 } from "lucide-react";
// types
import { IModule } from "@plane/types";
// ui
import { Avatar, AvatarGroup, Tooltip, setPromiseToast } from "@plane/ui";
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
import { useEventTracker, useMember, useModule, useUser } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  moduleId: string;
  moduleDetails: IModule;
  isArchived: boolean;
};

export const ModuleListItemAction: FC<Props> = observer((props) => {
  const { moduleId, moduleDetails, isArchived } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  //   store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { addModuleToFavorites, removeModuleFromFavorites } = useModule();
  const { getUserDetails } = useMember();
  const { captureEvent } = useEventTracker();
  const { isMobile } = usePlatformOS();

  // derived values
  const endDate = getDate(moduleDetails.target_date);
  const startDate = getDate(moduleDetails.start_date);

  const renderDate = moduleDetails.start_date || moduleDetails.target_date;

  const moduleStatus = MODULE_STATUS.find((status) => status.value === moduleDetails.status);

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  // handlers
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

  return (
    <>
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

      {renderDate && (
        <span className=" text-xs text-custom-text-300">
          {renderFormattedDate(startDate) ?? "_ _"} - {renderFormattedDate(endDate) ?? "_ _"}
        </span>
      )}

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
    </>
  );
});
