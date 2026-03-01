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
import { Button } from "@plane/propel/button";
import { E_FEATURE_FLAGS, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { UpgradeIcon } from "@plane/propel/icons";
import { setPromiseToast } from "@plane/propel/toast";
import { Switch } from "@plane/propel/switch";
import { EUserProjectRoles } from "@plane/types";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useFlag, useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
// local imports
import type { Route } from "./+types/page";
import { ProjectUpdatesProjectSettingsHeader } from "./header";

function UpdatesSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { getProjectFeatures, toggleProjectFeatures } = useProjectAdvanced();
  const { t } = useTranslation();
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values
  const currentProjectDetails = getProjectFeatures(projectId);
  const canPerformProjectAdminActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
  const isProjectUpdatesAvailableInPlan = useFlag(workspaceSlug, E_FEATURE_FLAGS.PROJECT_UPDATES);

  if (!canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  if (!canPerformProjectAdminActions)
    return (
      <>
        <div className="mt-10 flex h-full w-full justify-center p-4">
          <p className="text-13 text-tertiary">You are not authorized to access this page.</p>
        </div>
      </>
    );

  const toggleUpdatesFeature = async () => {
    if (!currentProjectDetails) return;

    // making the request to update the project feature
    const settingsPayload = {
      is_project_updates_enabled: !currentProjectDetails?.["is_project_updates_enabled"],
    };
    const updateProjectPromise = toggleProjectFeatures(workspaceSlug, projectId, settingsPayload);
    setPromiseToast(updateProjectPromise, {
      loading: "Updating project feature...",
      success: {
        title: "Success!",
        message: () => "Project feature updated successfully.",
      },
      error: {
        title: "Error!",
        message: () => "Something went wrong while updating project feature. Please try again.",
      },
    });
  };

  return (
    <SettingsContentWrapper header={<ProjectUpdatesProjectSettingsHeader />}>
      <div className="w-full">
        <SettingsHeading
          title={t("project_settings.project_updates.heading")}
          description={t("project_settings.project_updates.description")}
        />
        <div className="mt-7">
          <SettingsBoxedControlItem
            title="Turn on Project Updates"
            description="See all updates on demand from anyone in this project. Easily track updates across four preset categories."
            control={
              isProjectUpdatesAvailableInPlan ? (
                <Switch
                  value={!!currentProjectDetails?.["is_project_updates_enabled"]}
                  onChange={toggleUpdatesFeature}
                />
              ) : (
                <Button
                  variant="secondary"
                  size="lg"
                  prependIcon={<UpgradeIcon />}
                  onClick={() => togglePaidPlanModal(true)}
                >
                  {t("upgrade")}
                </Button>
              )
            }
          />
        </div>
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(UpdatesSettingsPage);
