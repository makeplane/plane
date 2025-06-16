"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserProjectRoles, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast, UpdatesIcon, ToggleSwitch } from "@plane/ui";
import { NotAuthorizedView } from "@/components/auth-screens";
// store hooks
import { SettingsContentWrapper, SettingsHeading } from "@/components/settings";
import { useUserPermissions } from "@/hooks/store";
// plane web components
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
// plane web constants
import { ProjectUpdatesUpgrade } from "@/plane-web/components/project-overview/upgrade";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";

const UpdatesSettingsPage = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { getProjectFeatures, toggleProjectFeatures } = useProjectAdvanced();
  const { t } = useTranslation();
  // derived values
  const currentProjectDetails = getProjectFeatures(projectId?.toString());
  const canPerformProjectAdminActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);

  if (!canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }
  if (!canPerformProjectAdminActions)
    return (
      <>
        <div className="mt-10 flex h-full w-full justify-center p-4">
          <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
        </div>
      </>
    );

  const toggleUpdatesFeature = async () => {
    if (!currentProjectDetails) return;

    // making the request to update the project feature
    const settingsPayload = {
      is_project_updates_enabled: !currentProjectDetails?.["is_project_updates_enabled"],
    };
    const updateProjectPromise = toggleProjectFeatures(workspaceSlug.toString(), projectId.toString(), settingsPayload);
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
    <SettingsContentWrapper>
      <div className="w-full">
        <SettingsHeading
          title={t("project_settings.project_updates.heading")}
          description={t("project_settings.project_updates.description")}
        />
        <WithFeatureFlagHOC
          flag="PROJECT_UPDATES"
          fallback={<ProjectUpdatesUpgrade />}
          workspaceSlug={workspaceSlug?.toString()}
        >
          <>
            <div className="px-4 py-6 flex items-center justify-between gap-2 border-b border-custom-border-100">
              <div className="flex items-center gap-4">
                <div className="size-10 bg-custom-background-90 rounded-md flex items-center justify-center">
                  <UpdatesIcon className="size-5 text-custom-text-300" />
                </div>
                <div className="leading-tight">
                  <h5 className="font-medium">Turn on Project Updates</h5>
                  <span className="text-custom-sidebar-text-400 text-sm">
                    See all updates on demand from anyone in this project. Easily track updates across four preset
                    categories.
                  </span>
                </div>
              </div>
              {currentProjectDetails && (
                <ToggleSwitch
                  value={currentProjectDetails?.["is_project_updates_enabled"]}
                  onChange={toggleUpdatesFeature}
                  size="sm"
                />
              )}
            </div>
          </>
        </WithFeatureFlagHOC>
      </div>
    </SettingsContentWrapper>
  );
});

export default UpdatesSettingsPage;
