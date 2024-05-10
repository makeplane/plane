import React, { FC } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// icons
import { CalendarCheck2, CalendarClock, MoveRight, User2 } from "lucide-react";
// types
import { IModule } from "@plane/types";
// ui
import { Tooltip, setPromiseToast } from "@plane/ui";
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
import { ButtonAvatars } from "../dropdowns/member/avatar";

type Props = {
  moduleId: string;
  moduleDetails: IModule;
  parentRef: React.RefObject<HTMLDivElement>;
};

export const ModuleListItemAction: FC<Props> = observer((props) => {
  const { moduleId, moduleDetails, parentRef } = props;
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

  const moduleLeadDetails = moduleDetails.lead_id ? getUserDetails(moduleDetails.lead_id) : undefined;

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

      {moduleStatus && (
        <span
          className="flex h-6 w-20 flex-shrink-0 items-center justify-center rounded-sm text-center text-xs cursor-default"
          style={{
            color: moduleStatus.color,
            backgroundColor: `${moduleStatus.color}20`,
          }}
        >
          {moduleStatus.label}
        </span>
      )}

      {moduleLeadDetails ? (
        <span className="cursor-default">
          <ButtonAvatars showTooltip={false} userIds={moduleLeadDetails?.id} />
        </span>
      ) : (
        <Tooltip tooltipContent="No lead">
          <span className="cursor-default flex h-5 w-5 items-end justify-center rounded-full border border-dashed border-custom-text-400 bg-custom-background-80">
            <User2 className="h-4 w-4 text-custom-text-400" />
          </span>
        </Tooltip>
      )}

      {isEditingAllowed && !moduleDetails.archived_at && (
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
          parentRef={parentRef}
          moduleId={moduleId}
          projectId={projectId.toString()}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
    </>
  );
});
