"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// component
import { InitiativeIcon, setPromiseToast, ToggleSwitch } from "@plane/ui";
import { PageHead } from "@/components/core";
// store hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web components
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { InitiativesUpgrade } from "@/plane-web/components/initiatives/upgrade";
// plane web constants
import { EUserPermissions } from "@/plane-web/constants/user-permissions";
// plane web hooks
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
// plane web types
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

const InitiativesSettingsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { workspaceInfoBySlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled, updateWorkspaceFeature } = useWorkspaceFeatures();

  // derived values
  const currentWorkspaceDetail = workspaceInfoBySlug(workspaceSlug.toString());
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Initiatives` : undefined;
  const isAdmin = currentWorkspaceDetail?.role === EUserPermissions.ADMIN;
  const isInitiativesFeatureEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_INITIATIVES_ENABLED);

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

  const toggleInitiativesFeature = async () => {
    try {
      const payload = {
        [EWorkspaceFeatures.IS_INITIATIVES_ENABLED]: !isInitiativesFeatureEnabled,
      };
      const toggleInitiativesFeaturePromise = updateWorkspaceFeature(workspaceSlug.toString(), payload);
      setPromiseToast(toggleInitiativesFeaturePromise, {
        loading: "Updating initiatives feature...",
        success: {
          title: "Success",
          message: () => `Initiatives feature ${isInitiativesFeatureEnabled ? "disabled" : "enabled"} successfully!`,
        },
        error: {
          title: "Error",
          message: () => "Failed to update initiatives feature!",
        },
      });
      await toggleInitiativesFeaturePromise;
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="border-b border-custom-border-200 pb-3 tracking-tight">
        <h3 className="text-xl font-medium">Initiatives</h3>
        <span className="text-custom-sidebar-text-400 text-sm font-medium">
          Unlock the highest level of organization for all your work in Plane.
        </span>
      </div>
      <WithFeatureFlagHOC
        flag="INITIATIVES"
        fallback={<InitiativesUpgrade />}
        workspaceSlug={workspaceSlug?.toString()}
      >
        <div className="px-4 py-6 flex items-center justify-between gap-2 border-b border-custom-border-100">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-custom-background-90 rounded-md flex items-center justify-center">
              <InitiativeIcon className="size-5 text-custom-text-300" />
            </div>
            <div className="leading-tight">
              <h5 className="font-medium">Enable Initiatives</h5>
              <span className="text-custom-sidebar-text-400 text-sm">Set bigger goals to monitor the progress</span>
            </div>
          </div>
          <ToggleSwitch value={isInitiativesFeatureEnabled} onChange={toggleInitiativesFeature} size="sm" />
        </div>
      </WithFeatureFlagHOC>
    </>
  );
});

export default InitiativesSettingsPage;
