"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserWorkspaceRoles } from "@plane/constants";
import { setPromiseToast, TeamsIcon, ToggleSwitch, Tooltip } from "@plane/ui";
// component
import { PageHead } from "@/components/core";
// store hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web components
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { TeamspaceUpgrade } from "@/plane-web/components/teamspaces/upgrade";
// plane web hooks
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
// plane web types
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

const TeamspaceSettingsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { workspaceInfoBySlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled, updateWorkspaceFeature } = useWorkspaceFeatures();

  // derived values
  const currentWorkspaceDetail = workspaceInfoBySlug(workspaceSlug.toString());
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Teamspaces` : undefined;
  const isAdmin = currentWorkspaceDetail?.role === EUserWorkspaceRoles.ADMIN;
  const isTeamspacesFeatureEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_TEAMSPACES_ENABLED);

  if (!workspaceSlug || !currentWorkspace?.id) return <></>;

  if (!isAdmin)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center p-4">
          <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
        </div>
      </>
    );

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
    <>
      <PageHead title={pageTitle} />
      <div className="border-b border-custom-border-200 pb-3 tracking-tight">
        <h3 className="text-xl font-medium">Teamspaces</h3>
        <span className="text-custom-sidebar-text-400 text-sm font-medium">
          See your team’s work in a separate space with linked projects, tasks, team charts, pages, and views.
        </span>
      </div>
      <WithFeatureFlagHOC flag="TEAMSPACES" fallback={<TeamspaceUpgrade />} workspaceSlug={workspaceSlug?.toString()}>
        <div className="px-4 py-6 flex items-center justify-between gap-2 border-b border-custom-border-100">
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
    </>
  );
});

export default TeamspaceSettingsPage;
