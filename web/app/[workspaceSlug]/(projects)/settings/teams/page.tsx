"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// component
import { setPromiseToast, TeamsIcon, ToggleSwitch } from "@plane/ui";
import { PageHead } from "@/components/core";
// store hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web components
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { TeamsUpgrade } from "@/plane-web/components/teams/upgrade";
// plane web constants
import { EUserPermissions } from "@/plane-web/constants/user-permissions";
// plane web hooks
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
// plane web types
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

const TeamsSettingsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { workspaceInfoBySlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled, updateWorkspaceFeature } = useWorkspaceFeatures();

  // derived values
  const currentWorkspaceDetail = workspaceInfoBySlug(workspaceSlug.toString());
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Teams` : undefined;
  const isAdmin = currentWorkspaceDetail?.role === EUserPermissions.ADMIN;
  const isTeamsFeatureEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_TEAMS_ENABLED);

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
        [EWorkspaceFeatures.IS_TEAMS_ENABLED]: !isTeamsFeatureEnabled,
      };
      const toggleTeamsFeaturePromise = updateWorkspaceFeature(workspaceSlug.toString(), payload);
      setPromiseToast(toggleTeamsFeaturePromise, {
        loading: "Updating teams feature...",
        success: {
          title: "Success",
          message: () => `Teams feature ${isTeamsFeatureEnabled ? "disabled" : "enabled"} successfully!`,
        },
        error: {
          title: "Error",
          message: () => "Failed to update teams feature!",
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
        <h3 className="text-xl font-medium">Teams</h3>
        <span className="text-custom-sidebar-text-400 text-sm font-medium">
          Teams is a feature for organizing your workspace into teams.
        </span>
      </div>
      <WithFeatureFlagHOC flag="TEAMS" fallback={<TeamsUpgrade />} workspaceSlug={workspaceSlug?.toString()}>
        <div className="px-4 py-6 flex items-center justify-between gap-2 border-b border-custom-border-100">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-custom-background-90 rounded-md flex items-center justify-center">
              <TeamsIcon className="size-5 text-custom-text-300" />
            </div>
            <div className="leading-tight">
              <h5 className="font-medium">Enable Teams</h5>
              <span className="text-custom-sidebar-text-400 text-sm">Set bigger goals to monitor the progress</span>
            </div>
          </div>
          <ToggleSwitch value={isTeamsFeatureEnabled} onChange={toggleTeamsFeature} size="sm" />
        </div>
      </WithFeatureFlagHOC>
    </>
  );
});

export default TeamsSettingsPage;
