"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserWorkspaceRoles } from "@plane/constants";
import { ToggleSwitch } from "@plane/ui";
// components
import { PageHead } from "@/components/core";
// store hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web components
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import {
  WorkspaceProjectStatesUpgrade,
  WorkspaceProjectStatesRoot,
} from "@/plane-web/components/workspace-project-states";
// plane web constants
// plane web hooks
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

const WorklogsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { workspaceInfoBySlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled, updateWorkspaceFeature } = useWorkspaceFeatures();
  const isFeatureEnabled = useFlag(workspaceSlug?.toString(), "PROJECT_GROUPING");

  // derived values
  const currentWorkspaceDetail = workspaceInfoBySlug(workspaceSlug.toString());
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Project States` : undefined;
  const isAdmin = currentWorkspaceDetail?.role === EUserWorkspaceRoles.ADMIN;
  const isProjectGroupingEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED);

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

  const toggleProjectGroupingFeature = async () => {
    try {
      const payload = {
        [EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED]: !isProjectGroupingEnabled,
      };
      await updateWorkspaceFeature(workspaceSlug.toString(), payload);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <PageHead title={pageTitle} />
      <WithFeatureFlagHOC
        flag="PROJECT_GROUPING"
        fallback={<WorkspaceProjectStatesUpgrade />}
        workspaceSlug={workspaceSlug?.toString()}
      >
        <main className="container mx-auto space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-custom-border-200 pb-3">
            <div>
              <h3 className="text-xl font-medium">See progress overview for all projects.</h3>
              <span className="text-custom-sidebar-text-400 text-sm font-medium">
                Projects States is a Plane-only feature for tracking progress of all your projects by any project
                property.
              </span>
            </div>
            {isFeatureEnabled && (
              <ToggleSwitch value={isProjectGroupingEnabled} onChange={toggleProjectGroupingFeature} size="sm" />
            )}
          </div>
          <WorkspaceProjectStatesRoot
            isProjectGroupingEnabled={isProjectGroupingEnabled}
            workspaceSlug={workspaceSlug.toString()}
            workspaceId={currentWorkspace?.id}
            toggleProjectGroupingFeature={toggleProjectGroupingFeature}
          />
        </main>
      </WithFeatureFlagHOC>
    </>
  );
});

export default WorklogsPage;
