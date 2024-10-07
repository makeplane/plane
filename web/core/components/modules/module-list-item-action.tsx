"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { SquareUser } from "lucide-react";
// types
import { IModule } from "@plane/types";
// ui
import { FavoriteStar, TOAST_TYPE, Tooltip, setPromiseToast, setToast } from "@plane/ui";
// components
import { DateRangeDropdown } from "@/components/dropdowns";
import { ModuleQuickActions } from "@/components/modules";
import { ModuleStatusDropdown } from "@/components/modules/module-status-dropdown";
// constants
import { MODULE_FAVORITED, MODULE_UNFAVORITED } from "@/constants/event-tracker";
import { MODULE_STATUS } from "@/constants/module";
// hooks
import { renderFormattedPayloadDate, getDate } from "@/helpers/date-time.helper";
import { useEventTracker, useMember, useModule, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
import { ButtonAvatars } from "../dropdowns/member/avatar";

type Props = {
  moduleId: string;
  moduleDetails: IModule;
  parentRef: React.RefObject<HTMLDivElement>;
};

export const ModuleListItemAction: FC<Props> = observer((props) => {
  const { moduleId, moduleDetails, parentRef } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  //   store hooks
  const { allowPermissions } = useUserPermissions();
  const { addModuleToFavorites, removeModuleFromFavorites, updateModuleDetails } = useModule();
  const { getUserDetails } = useMember();
  const { captureEvent } = useEventTracker();

  // derived values

  const moduleStatus = MODULE_STATUS.find((status) => status.value === moduleDetails.status);
  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const isDisabled = !isEditingAllowed || !!moduleDetails?.archived_at;
  const renderIcon = Boolean(moduleDetails.start_date) || Boolean(moduleDetails.target_date);

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

  const moduleLeadDetails = moduleDetails.lead_id ? getUserDetails(moduleDetails.lead_id) : undefined;

  return (
    <>
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

      {moduleStatus && (
        <ModuleStatusDropdown
          isDisabled={isDisabled}
          moduleDetails={moduleDetails}
          handleModuleDetailsChange={handleModuleDetailsChange}
        />
      )}

      {moduleLeadDetails ? (
        <span className="cursor-default">
          <ButtonAvatars showTooltip={false} userIds={moduleLeadDetails?.id} />
        </span>
      ) : (
        <Tooltip tooltipContent="No lead">
          <SquareUser className="h-4 w-4 text-custom-text-300" />
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
        <div className="hidden md:block">
          <ModuleQuickActions
            parentRef={parentRef}
            moduleId={moduleId}
            projectId={projectId.toString()}
            workspaceSlug={workspaceSlug.toString()}
          />
        </div>
      )}
    </>
  );
});
