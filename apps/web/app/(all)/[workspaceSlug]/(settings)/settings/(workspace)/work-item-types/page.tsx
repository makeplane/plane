/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
// component
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { WorkspaceWorkItemTypesSettingsRoot } from "@/components/work-item-types-new/settings/workspace/root";
// store hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import type { Route } from "./+types/page";
import { WorkItemTypesWorkspaceSettingsHeader } from "./header";
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useWorkspaceWorkItemTypes } from "@/plane-web/hooks/store/work-item-types/use-workspace-work-item-types";
import { EWorkspaceFeatureLoader, EWorkspaceFeatures } from "@/types/workspace-feature";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
import { Tooltip } from "@plane/propel/tooltip";
import { Switch } from "@plane/propel/switch";
import { setPromiseToast } from "@plane/propel/toast";
import { Navigate } from "react-router";

function WorkItemTypesWorkspaceSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // store hooks
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled, fetchWorkspaceFeatures, loader: workspaceFeaturesLoader } = useWorkspaceFeatures();
  const { enableWorkItemTypes } = useWorkspaceWorkItemTypes();
  const { t } = useTranslation();

  // handlers
  const toggleWorkItemTypesFeature = async () => {
    try {
      const enablePromise = (async () => {
        await enableWorkItemTypes(workspaceSlug);
        await fetchWorkspaceFeatures(workspaceSlug);
      })();
      setPromiseToast(enablePromise, {
        loading: "Enabling work item types",
        success: {
          title: "Success",
          message: () => "Work item types feature enabled successfully!",
        },
        error: {
          title: "Error",
          message: () => "Failed to enable work item types feature!",
        },
      });
      await enablePromise;
    } catch (error) {
      console.error(error);
    }
  };
  // derived values
  const currentWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug);
  const isWorkItemTypesFeatureEnabled = useFlag(workspaceSlug, "WORKSPACE_WORK_ITEM_TYPES", false);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - ${t("work_item_types.label")}` : undefined;
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  const isWorkItemTypesEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_WORK_ITEM_TYPES_ENABLED);

  if (!isWorkItemTypesFeatureEnabled) {
    //TODO: replace with upgrade screen once ready
    return <Navigate to={`/${workspaceSlug}`} />;
  }

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  if (workspaceFeaturesLoader === EWorkspaceFeatureLoader.INIT_LOADER) return <></>;

  return (
    <SettingsContentWrapper header={<WorkItemTypesWorkspaceSettingsHeader />}>
      <div className="flex flex-col gap-12 w-full">
        <PageHead title={pageTitle} />
        <SettingsHeading title={t("work_item_types.label")} description={t("work_item_types.settings.description")} />
        {isWorkItemTypesEnabled ? (
          <WorkspaceWorkItemTypesSettingsRoot workspaceSlug={workspaceSlug} />
        ) : (
          <SettingsBoxedControlItem
            title="Turn on Work Item Types for this workspace."
            description="This will enable configuration and control of work item types and properties at workspace level."
            control={
              <Tooltip
                tooltipContent={"Work Item Types can't be disabled"}
                disabled={!isWorkItemTypesEnabled}
                position="left"
              >
                <Switch value={isWorkItemTypesEnabled} onChange={toggleWorkItemTypesFeature} />
              </Tooltip>
            }
          />
        )}
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(WorkItemTypesWorkspaceSettingsPage);
