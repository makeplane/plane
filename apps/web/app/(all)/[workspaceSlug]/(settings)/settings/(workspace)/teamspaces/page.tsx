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
import { setPromiseToast } from "@plane/propel/toast";
import { Switch } from "@plane/propel/switch";
import { EUserWorkspaceRoles } from "@plane/types";
import { Tooltip } from "@plane/ui";
// component
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
// store hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { TeamspaceUpgrade } from "@/components/teamspaces/upgrade";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// local imports
import type { Route } from "./+types/page";
import { TeamspacesWorkspaceSettingsHeader } from "./header";

function TeamspaceSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // store hooks
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled, updateWorkspaceFeature } = useWorkspaceFeatures();
  const { t } = useTranslation();

  // derived values
  const currentWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Teamspaces` : undefined;
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  const isTeamspacesFeatureEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_TEAMSPACES_ENABLED);

  if (!currentWorkspace?.id) return <></>;

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  const toggleTeamsFeature = async () => {
    try {
      const payload = {
        [EWorkspaceFeatures.IS_TEAMSPACES_ENABLED]: !isTeamspacesFeatureEnabled,
      };
      const toggleTeamsFeaturePromise = updateWorkspaceFeature(workspaceSlug, payload);
      setPromiseToast(toggleTeamsFeaturePromise, {
        loading: "Updating teamspaces feature...",
        success: {
          title: "Success",
          message: () => `Teamspaces feature ${isTeamspacesFeatureEnabled ? "disabled" : "enabled"} successfully!`,
        },
        error: {
          title: "Error",
          message: () => "Failed to update teamspaces feature!",
        },
      });
      await toggleTeamsFeaturePromise;
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SettingsContentWrapper header={<TeamspacesWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <SettingsHeading
        title={t("workspace_settings.settings.teamspaces.heading")}
        description={t("workspace_settings.settings.teamspaces.description")}
      />
      <WithFeatureFlagHOC flag="TEAMSPACES" fallback={<TeamspaceUpgrade />} workspaceSlug={workspaceSlug}>
        <div className="mt-6">
          <SettingsBoxedControlItem
            title="Turn on Teamspaces for this workspace."
            description="Once turned on, you can't turn this feature off."
            control={
              <Tooltip
                tooltipContent={"Teamspaces can't be disabled"}
                disabled={!isTeamspacesFeatureEnabled}
                position="left"
              >
                <Switch
                  value={isTeamspacesFeatureEnabled}
                  onChange={toggleTeamsFeature}
                  disabled={isTeamspacesFeatureEnabled}
                />
              </Tooltip>
            }
          />
        </div>
      </WithFeatureFlagHOC>
    </SettingsContentWrapper>
  );
}

export default observer(TeamspaceSettingsPage);
