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
import useSWR from "swr";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
import { Switch } from "@plane/propel/switch";
import { EUserProjectRoles } from "@plane/types";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
// hook
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { WorkflowSettingsQuickActions } from "@/components/workflow/page/quick-actions";
import { StateWorkflowRoot } from "@/components/workflow/page/root";
import { WorkflowUpgrade } from "@/components/workflow/page/upgrade";
import { useFlag } from "@/plane-web/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
// local imports
import type { Route } from "./+types/page";
import { WorkflowsProjectSettingsHeader } from "./header";

function WorkflowsSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  // plane hooks
  const { t } = useTranslation();
  // store
  const { currentProjectDetails } = useProject();
  const { fetchProjectStates, fetchWorkflowStates } = useProjectState();
  const { isProjectFeatureEnabled, toggleProjectFeatures } = useProjectAdvanced();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  // derived values
  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails?.name} - ${t("common.workflows")}`
    : undefined;
  const isWorkflowFeatureFlagEnabled = useFlag(workspaceSlug, "WORKFLOWS");
  const isWorkflowEnabled = isProjectFeatureEnabled(projectId, "is_workflow_enabled");
  const hasAdminPermission = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);

  // fetch project states
  const { isLoading } = useSWR(
    `PROJECT_STATES_${workspaceSlug}_${projectId}`,
    () => fetchProjectStates(workspaceSlug, projectId),
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetch project workflows
  useSWR(
    isWorkflowFeatureFlagEnabled ? `PROJECT_WORKFLOWS_${workspaceSlug}_${projectId}` : null,
    isWorkflowFeatureFlagEnabled ? () => fetchWorkflowStates(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (workspaceUserInfo && !hasAdminPermission) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  const handleEnableDisableWorkflow = async () => {
    const featureState = !isWorkflowEnabled;
    const featureTogglePromise = toggleProjectFeatures(workspaceSlug, projectId, {
      is_workflow_enabled: featureState,
    });
    setPromiseToast(featureTogglePromise, {
      loading: t("workflows.toasts.enable_disable.loading", {
        action: featureState ? t("common.enabling") : t("common.disabling"),
      }),
      success: {
        title: t("workflows.toasts.enable_disable.success.title"),
        message: () =>
          t("workflows.toasts.enable_disable.success.message", {
            action: featureState ? t("common.enabled").toLowerCase() : t("common.disabled").toLowerCase(),
          }),
      },
      error: {
        title: t("workflows.toasts.enable_disable.error.title"),
        message: () =>
          t("workflows.toasts.enable_disable.error.message", {
            action: featureState ? t("common.enabled").toLowerCase() : t("common.disabled").toLowerCase(),
          }),
      },
    });
  };

  return (
    <SettingsContentWrapper header={<WorkflowsProjectSettingsHeader />}>
      <div className="w-full h-full flex flex-col">
        <PageHead title={pageTitle} />
        <SettingsHeading
          title={t("project_settings.workflows.heading")}
          description={t("project_settings.workflows.description")}
          control={
            <>
              {isWorkflowFeatureFlagEnabled && (
                <div className="shrink-0 flex items-center justify-center gap-2 px-4">
                  <span className="text-11 text-tertiary">{t("common.live")}</span>
                  <Switch value={!!isWorkflowEnabled} onChange={handleEnableDisableWorkflow} disabled={isLoading} />
                  <WorkflowSettingsQuickActions projectId={projectId} workspaceSlug={workspaceSlug} />
                </div>
              )}
            </>
          }
        />
        <div className="flex-1 mt-6">
          <WithFeatureFlagHOC flag="WORKFLOWS" fallback={<WorkflowUpgrade />} workspaceSlug={workspaceSlug}>
            <StateWorkflowRoot workspaceSlug={workspaceSlug} projectId={projectId} />
          </WithFeatureFlagHOC>
        </div>
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(WorkflowsSettingsPage);
