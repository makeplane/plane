"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserWorkspaceRoles } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast, TeamsIcon, ToggleSwitch, Tooltip } from "@plane/ui";
// component
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import { SettingsContentWrapper, SettingsHeading } from "@/components/settings";
// store hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web imports
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { TeamspaceUpgrade } from "@/plane-web/components/teamspaces/upgrade";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

const TeamspaceSettingsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled, updateWorkspaceFeature } = useWorkspaceFeatures();
  const { t } = useTranslation();

  // derived values
  const currentWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug.toString());
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Teamspaces` : undefined;
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  const isTeamspacesFeatureEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_TEAMSPACES_ENABLED);

  if (!workspaceSlug || !currentWorkspace?.id) return <></>;

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  const toggleTeamsFeature = async () => {
    try {
      const payload = {
        [EWorkspaceFeatures.IS_TEAMSPACES_ENABLED]: !isTeamspacesFeatureEnabled,
      };
      const toggleTeamsFeaturePromise = updateWorkspaceFeature(workspaceSlug.toString(), payload);
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
    <SettingsContentWrapper>
      <PageHead title={pageTitle} />
      <SettingsHeading
        title={t("workspace_settings.settings.teamspaces.heading")}
        description={t("workspace_settings.settings.teamspaces.description")}
      />
      <WithFeatureFlagHOC flag="TEAMSPACES" fallback={<TeamspaceUpgrade />} workspaceSlug={workspaceSlug?.toString()}>
        <div className="px-4 py-6 flex items-center justify-between gap-2 border-b border-custom-border-100 w-full">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-custom-background-90 rounded-md flex items-center justify-center">
              <TeamsIcon className="size-5 text-custom-text-300" />
            </div>
            <div className="leading-tight">
              <h5 className="font-medium">Turn on Teamspaces for this workspace.</h5>
              <span className="text-custom-sidebar-text-400 text-sm">
                Once turned on, you can’t turn this feature off.
              </span>
            </div>
          </div>
          <Tooltip
            tooltipContent={"Teamspaces can't be disabled"}
            disabled={!isTeamspacesFeatureEnabled}
            position="left"
          >
            <div>
              <ToggleSwitch
                value={isTeamspacesFeatureEnabled}
                onChange={toggleTeamsFeature}
                size="sm"
                disabled={isTeamspacesFeatureEnabled}
              />
            </div>
          </Tooltip>
        </div>
      </WithFeatureFlagHOC>
    </SettingsContentWrapper>
  );
});

export default TeamspaceSettingsPage;
