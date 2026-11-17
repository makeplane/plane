/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { SyntheticEvent } from "react";
import React, { useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { CalendarOutline, InfoOutline, LeadOutline, WorkItemsOutline } from "@makeplane/propel/icons";
// plane package imports
import {
  MODULE_STATUS,
  EUserPermissions,
  EUserPermissionsLevel,
  IS_FAVORITE_MENU_OPEN,
  PROGRESS_STATE_GROUPS_DETAILS,
} from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast, setToast } from "@plane/blocks/toast";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { IModule } from "@plane/types";
import { Card } from "@plane/blocks/card";
import { FavoriteStar } from "@plane/blocks/common";
import { SegmentedProgress } from "@plane/blocks/progress";
import { DateRangeSelect } from "@plane/blocks/property-select";
import { getDate, renderFormattedPayloadDate, generateQueryParams } from "@plane/utils";
// components
import { handleTriggerKeyDown } from "@/components/common/trigger-guard";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { ModuleQuickActions } from "@/components/modules";
import { ModuleStatusDropdown } from "@/components/modules/module-status-dropdown";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useUserPermissions, useUserProfile } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  moduleId: string;
};

export const ModuleCardItem = observer(function ModuleCardItem(props: Props) {
  const { moduleId } = props;
  const { t } = useTranslation();
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
  const { data: userProfile } = useUserProfile();
  // local storage
  const { setValue: toggleFavoriteMenu, storedValue } = useLocalStorage<boolean>(IS_FAVORITE_MENU_OPEN, false);
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
        if (!storedValue) toggleFavoriteMenu(true);
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
    );

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
          type: "success",
          title: "Success!",
          message: "Module updated successfully.",
        });
      })
      .catch((err) => {
        setToast({
          type: "error",
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

  const issueCount = moduleDetails
    ? !moduleTotalIssues || moduleTotalIssues === 0
      ? `0 work items`
      : moduleTotalIssues === moduleCompletedIssues
        ? `${moduleTotalIssues} Work item${moduleTotalIssues > 1 ? `s` : ``}`
        : `${moduleCompletedIssues}/${moduleTotalIssues} Work items`
    : `0 work items`;

  const moduleLeadDetails = moduleDetails.lead_id ? getUserDetails(moduleDetails.lead_id) : undefined;
  // One segment per state group; the bar normalises the counts, so an empty module shows only the track.
  const progressSegments = PROGRESS_STATE_GROUPS_DETAILS.map((group) => ({
    id: group.key,
    name: t(`workspace_projects.state.${group.key.replace("_issues", "")}`),
    value: (moduleDetails[group.key as keyof IModule] as number | undefined) ?? 0,
    color: group.color,
  }));

  return (
    <div className="relative" data-prevent-progress>
      <Card ref={parentRef} spacing="sm">
        <div className="flex h-6 items-center justify-between gap-2">
          <Tooltip label={moduleDetails.name} layout="stacked" disabled={isMobile}>
            <Link
              href={`/${workspaceSlug}/projects/${moduleDetails.project_id}/modules/${moduleDetails.id}`}
              className="min-w-0 truncate text-body-sm-medium after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent-strong"
            >
              <span className="relative z-[1] block truncate">{moduleDetails.name}</span>
            </Link>
          </Tooltip>
          {/* Sits above the stretched card link; each control stops its own activation. */}
          <div className="relative z-[1] flex shrink-0 items-center gap-1.5">
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              aria-label={t("info")}
              showTooltip={!isMobile}
              onClick={openModuleOverview}
              icon={<Icon icon={InfoOutline} />}
            />
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
                size="sm"
              />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-secondary">
              <WorkItemsOutline className="size-4 text-tertiary" />
              <span className="text-caption-sm-regular text-tertiary">{issueCount ?? "0 Work item"}</span>
            </div>
            <span className="relative z-[1] flex shrink-0 items-center">
              {moduleLeadDetails ? (
                <ButtonAvatars showTooltip={false} userIds={moduleLeadDetails?.id} />
              ) : (
                <Tooltip label="No lead">
                  <span className="grid size-5 place-items-center text-tertiary">
                    <LeadOutline className="size-4" />
                  </span>
                </Tooltip>
              )}
            </span>
          </div>
          <SegmentedProgress size="lg" data={progressSegments} className="relative z-[1]" />
          {/* Keep date and status selection independent of the stretched card navigation link. */}
          <div
            className="relative z-[1] flex flex-wrap items-center gap-2"
            role="presentation"
            onClick={handleEventPropagation}
            onKeyDown={handleTriggerKeyDown}
          >
            <DateRangeSelect
              variant="pill-sm"
              className="max-w-none"
              value={{
                from: getDate(moduleDetails.start_date) ?? null,
                to: getDate(moduleDetails.target_date) ?? null,
              }}
              onChange={(range) => {
                void handleModuleDetailsChange({
                  start_date: range.from ? renderFormattedPayloadDate(range.from) : null,
                  target_date: range.to ? renderFormattedPayloadDate(range.to) : null,
                });
              }}
              placeholder={`${t("start_date")} - ${t("end_date")}`}
              weekStartsOn={userProfile?.start_of_the_week}
              disabled={isDisabled}
              icon={renderIcon ? undefined : <CalendarOutline aria-hidden="true" />}
            />
            {moduleStatus && (
              <ModuleStatusDropdown
                isDisabled={isDisabled}
                moduleDetails={moduleDetails}
                handleModuleDetailsChange={handleModuleDetailsChange}
              />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
});
