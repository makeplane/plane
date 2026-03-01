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
import { E_FEATURE_FLAGS, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { UpgradeIcon } from "@plane/propel/icons";
import { setPromiseToast } from "@plane/propel/toast";
import { Switch } from "@plane/propel/switch";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useFlag, useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
// local imports
import type { Route } from "./+types/page";
import { FeaturesMilestonesProjectSettingsHeader } from "./header";

function FeaturesMilestonesSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  // permissions
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentProjectDetails } = useProject();
  const { isProjectFeatureEnabled, toggleProjectFeatures } = useProjectAdvanced();
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  // translation
  const { t } = useTranslation();
  // derived values
  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails?.name} settings - ${t("project_settings.features.milestones.short_title")}`
    : undefined;
  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);
  const isMilestonesAvailableInPlan = useFlag(workspaceSlug, E_FEATURE_FLAGS.MILESTONES);
  const isMilestonesEnabled = !!isProjectFeatureEnabled(projectId, "is_milestone_enabled");

  const handleToggle = () => {
    if (!workspaceSlug || !projectId || !currentProjectDetails) return;

    const toggleProjectFeaturesPromise = toggleProjectFeatures(workspaceSlug, projectId, {
      is_milestone_enabled: !isMilestonesEnabled,
    });
    const updatePromise = toggleProjectFeaturesPromise;

    setPromiseToast(updatePromise, {
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

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<FeaturesMilestonesProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <section className="w-full">
        <SettingsHeading
          title={t("project_settings.features.milestones.title")}
          description={t("project_settings.features.milestones.description")}
        />
        <div className="mt-7">
          <SettingsBoxedControlItem
            title={t("project_settings.features.milestones.toggle_title")}
            description={t("project_settings.features.milestones.toggle_description")}
            control={
              isMilestonesAvailableInPlan ? (
                <Switch value={isMilestonesEnabled} onChange={handleToggle} />
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
      </section>
    </SettingsContentWrapper>
  );
}

export default observer(FeaturesMilestonesSettingsPage);
