"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { PROJECT_GROUPING_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
// store hooks
import { SettingsContentWrapper, SettingsHeading } from "@/components/settings";
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
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
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled, updateWorkspaceFeature } = useWorkspaceFeatures();
  const isFeatureEnabled = useFlag(workspaceSlug?.toString(), "PROJECT_GROUPING");
  const { t } = useTranslation();

  // derived values
  const currentWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug.toString());
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Project States` : undefined;
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  const isProjectGroupingEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED);

  if (!workspaceSlug || !currentWorkspace?.id) return <></>;

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  const toggleProjectGroupingFeature = async () => {
    const willEnableProjectGrouping = !isProjectGroupingEnabled;
    try {
      const payload = {
        [EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED]: willEnableProjectGrouping,
      };
      await updateWorkspaceFeature(workspaceSlug.toString(), payload);
      captureSuccess({
        eventName: willEnableProjectGrouping
          ? PROJECT_GROUPING_TRACKER_EVENTS.ENABLE
          : PROJECT_GROUPING_TRACKER_EVENTS.DISABLE,
      });
    } catch (error) {
      console.error(error);
      captureError({
        eventName: willEnableProjectGrouping
          ? PROJECT_GROUPING_TRACKER_EVENTS.DISABLE
          : PROJECT_GROUPING_TRACKER_EVENTS.ENABLE,
      });
    }
  };

  return (
    <SettingsContentWrapper>
      <div className="w-full">
        <PageHead title={pageTitle} />
        <SettingsHeading
          title={t("workspace_settings.settings.project_states.heading")}
          description={t("workspace_settings.settings.project_states.description")}
          appendToRight={
            <>
              {isFeatureEnabled && (
                <ToggleSwitch value={isProjectGroupingEnabled} onChange={toggleProjectGroupingFeature} size="sm" />
              )}
            </>
          }
        />
        <WithFeatureFlagHOC
          flag="PROJECT_GROUPING"
          fallback={<WorkspaceProjectStatesUpgrade />}
          workspaceSlug={workspaceSlug?.toString()}
        >
          <main className="container mx-auto space-y-4 w-full">
            <WorkspaceProjectStatesRoot
              isProjectGroupingEnabled={isProjectGroupingEnabled}
              workspaceSlug={workspaceSlug.toString()}
              workspaceId={currentWorkspace?.id}
              toggleProjectGroupingFeature={toggleProjectGroupingFeature}
            />
          </main>
        </WithFeatureFlagHOC>
      </div>
    </SettingsContentWrapper>
  );
});

export default WorklogsPage;
