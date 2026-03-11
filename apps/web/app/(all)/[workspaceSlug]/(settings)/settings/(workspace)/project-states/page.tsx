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

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
import { TabNavigationList, TabNavigationItem } from "@plane/propel/tab-navigation";
import { Switch } from "@plane/propel/switch";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// components
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { WorkspaceProjectStatesUpgrade, WorkspaceProjectStatesRoot } from "@/components/workspace-project-states";
import { WorkspaceProjectLabelsRoot } from "@/components/workspace-project-labels";
// plane web hooks
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// local imports
import type { Route } from "./+types/page";
import { ProjectStatessWorkspaceSettingsHeader } from "./header";

type TProjectTab = "states" | "labels";

const NAVIGATION_ITEMS: { key: TProjectTab; labelKey: string }[] = [
  {
    key: "states",
    labelKey: "workspace_settings.settings.projects.tabs.states",
  },
  {
    key: "labels",
    labelKey: "workspace_settings.settings.projects.tabs.labels",
  },
];

function ProjectsSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // states
  const [activeTab, setActiveTab] = useState<TProjectTab>("states");
  // store hooks
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled, updateWorkspaceFeature } = useWorkspaceFeatures();
  const isProjectGroupingEnabled = useFlag(workspaceSlug, "PROJECT_GROUPING");
  const isLabelsFeatureEnabled = useFlag(workspaceSlug, "WORKSPACE_PROJECT_LABELS");
  const { t } = useTranslation();

  // derived values
  const currentWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Projects` : undefined;
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  const isProjectGroupingWorkspaceEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED);

  const toggleProjectGroupingFeature = async () => {
    const willEnableProjectGrouping = !isProjectGroupingWorkspaceEnabled;
    try {
      const payload = {
        [EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED]: willEnableProjectGrouping,
      };
      await updateWorkspaceFeature(workspaceSlug, payload);
    } catch (error) {
      console.error(error);
    }
  };

  if (!currentWorkspace?.id) return <></>;

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  // Render project states content
  const renderProjectStatesContent = () => (
    <>
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <h6 className="text-h6-medium text-primary">{t("workspace_settings.settings.project_states.title")}</h6>
          <p className="text-body-xs-regular text-tertiary">
            {t("workspace_settings.settings.project_states.description")}{" "}
          </p>
        </div>
        <Switch value={isProjectGroupingWorkspaceEnabled} onChange={toggleProjectGroupingFeature} />
      </div>
      <div className="mt-6">
        <WithFeatureFlagHOC
          flag="PROJECT_GROUPING"
          fallback={<WorkspaceProjectStatesUpgrade />}
          workspaceSlug={workspaceSlug}
        >
          <WorkspaceProjectStatesRoot
            isProjectGroupingEnabled={isProjectGroupingWorkspaceEnabled}
            workspaceSlug={workspaceSlug}
            workspaceId={currentWorkspace.id}
            toggleProjectGroupingFeature={toggleProjectGroupingFeature}
          />
        </WithFeatureFlagHOC>
      </div>
    </>
  );

  // If labels feature flag is disabled, render old view (project states only, no tabs)
  if (!isLabelsFeatureEnabled) {
    return (
      <SettingsContentWrapper header={<ProjectStatessWorkspaceSettingsHeader />}>
        <div className="flex flex-col gap-12 w-full">
          <PageHead title={pageTitle} />
          <SettingsHeading
            title={t("workspace_settings.settings.projects.title")}
            description={t("workspace_settings.settings.project_states.description")}
            control={
              isProjectGroupingEnabled && (
                <Switch value={isProjectGroupingWorkspaceEnabled} onChange={toggleProjectGroupingFeature} />
              )
            }
          />
          <div className="">
            <WithFeatureFlagHOC
              flag="PROJECT_GROUPING"
              fallback={<WorkspaceProjectStatesUpgrade />}
              workspaceSlug={workspaceSlug}
            >
              <WorkspaceProjectStatesRoot
                isProjectGroupingEnabled={isProjectGroupingWorkspaceEnabled}
                workspaceSlug={workspaceSlug}
                workspaceId={currentWorkspace.id}
                toggleProjectGroupingFeature={toggleProjectGroupingFeature}
              />
            </WithFeatureFlagHOC>
          </div>
        </div>
      </SettingsContentWrapper>
    );
  }

  // If labels feature flag is enabled, render new tab view
  return (
    <SettingsContentWrapper header={<ProjectStatessWorkspaceSettingsHeader />}>
      <div className="flex flex-col gap-12 w-full">
        <PageHead title={pageTitle} />
        <SettingsHeading
          title={t("workspace_settings.settings.projects.title")}
          description={t("workspace_settings.settings.projects.description")}
        />
        <div className="">
          <div className="border-b border-subtle-1 pb-2">
            <TabNavigationList>
              {NAVIGATION_ITEMS.map((item) => (
                <button key={item.key} type="button" className="relative" onClick={() => setActiveTab(item.key)}>
                  <TabNavigationItem isActive={activeTab === item.key} className="py-1">
                    {t(item.labelKey)}
                  </TabNavigationItem>
                  {activeTab === item.key && (
                    <span className="absolute -bottom-2 w-[60%] left-1/2 -translate-x-1/2 h-0.5 bg-(--text-color-icon-primary) rounded-t-md transition-all duration-300" />
                  )}
                </button>
              ))}
            </TabNavigationList>
          </div>

          {activeTab === "states" && <div className="pt-6">{renderProjectStatesContent()}</div>}

          {activeTab === "labels" && (
            <div className="pt-6">
              <WorkspaceProjectLabelsRoot workspaceSlug={workspaceSlug} workspaceId={currentWorkspace.id} />
            </div>
          )}
        </div>
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(ProjectsSettingsPage);
