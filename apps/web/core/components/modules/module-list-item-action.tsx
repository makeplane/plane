"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { SquareUser } from "lucide-react";
// types
import {
  MODULE_STATUS,
  EUserPermissions,
  EUserPermissionsLevel,
  IS_FAVORITE_MENU_OPEN,
  MODULE_TRACKER_EVENTS,
  MODULE_TRACKER_ELEMENTS,
} from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { IModule } from "@plane/types";
// ui
import { FavoriteStar, TOAST_TYPE, Tooltip, setPromiseToast, setToast } from "@plane/ui";
// components
import { renderFormattedPayloadDate, getDate } from "@plane/utils";
import { DateRangeDropdown } from "@/components/dropdowns";
import { ModuleQuickActions } from "@/components/modules";
import { ModuleStatusDropdown } from "@/components/modules/module-status-dropdown";
// constants
// helpers
import { captureElementAndEvent, captureError } from "@/helpers/event-tracker.helper";
// hooks
import { useMember, useModule, useUserPermissions } from "@/hooks/store";
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

  const { t } = useTranslation();

  // local storage
  const { setValue: toggleFavoriteMenu, storedValue } = useLocalStorage<boolean>(IS_FAVORITE_MENU_OPEN, false);
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

    const addToFavoritePromise = addModuleToFavorites(workspaceSlug.toString(), projectId.toString(), moduleId)
      .then(() => {
        // open favorites menu if closed
        if (!storedValue) toggleFavoriteMenu(true);
        captureElementAndEvent({
          element: {
            elementName: MODULE_TRACKER_ELEMENTS.LIST_ITEM,
          },
          event: {
            eventName: MODULE_TRACKER_EVENTS.favorite,
            payload: { id: moduleId },
            state: "SUCCESS",
          },
        });
      })
      .catch((error) => {
        captureError({
          eventName: MODULE_TRACKER_EVENTS.favorite,
          payload: { id: moduleId },
          error,
        });
      });

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
    )
      .then(() => {
        captureElementAndEvent({
          element: {
            elementName: MODULE_TRACKER_ELEMENTS.LIST_ITEM,
          },
          event: {
            eventName: MODULE_TRACKER_EVENTS.unfavorite,
            payload: { id: moduleId },
            state: "SUCCESS",
          },
        });
      })
      .catch((error) => {
        captureError({
          eventName: MODULE_TRACKER_EVENTS.unfavorite,
          payload: { id: moduleId },
          error,
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
        mergeDates
        placeholder={{
          from: t("start_date"),
          to: t("end_date"),
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
