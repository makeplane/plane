"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EUserProjectRoles, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast, ToggleSwitch } from "@plane/ui";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
// hook
import { useProject, useProjectState, useUserPermissions } from "@/hooks/store";
// plane web imports
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { WorkflowSettingsQuickActions } from "@/plane-web/components/workflow/page/quick-actions";
import { StateWorkflowRoot } from "@/plane-web/components/workflow/page/root";
import { WorkflowUpgrade } from "@/plane-web/components/workflow/page/upgrade";
import { useFlag } from "@/plane-web/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";

const WorkflowsSettingsPage = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
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
  const isWorkflowFeatureFlagEnabled = useFlag(workspaceSlug?.toString(), "WORKFLOWS");
  const isWorkflowEnabled = isProjectFeatureEnabled(projectId?.toString(), "is_workflow_enabled");
  const hasAdminPermission = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);

  // fetch project states
  const { isLoading } = useSWR(
    workspaceSlug && projectId ? `PROJECT_STATES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectStates(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetch project workflows
  useSWR(
    workspaceSlug && projectId && isWorkflowFeatureFlagEnabled
      ? `PROJECT_WORKFLOWS_${workspaceSlug}_${projectId}`
      : null,
    workspaceSlug && projectId && isWorkflowFeatureFlagEnabled
      ? () => fetchWorkflowStates(workspaceSlug.toString(), projectId.toString())
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (workspaceUserInfo && !hasAdminPermission) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  const handleEnableDisableWorkflow = async () => {
    const featureState = !isWorkflowEnabled;
    const featureTogglePromise = toggleProjectFeatures(workspaceSlug?.toString(), projectId?.toString(), {
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
    <div className="w-full h-full flex flex-col overflow-hidden">
      <PageHead title={pageTitle} />
      <div className="flex justify-between gap-2 border-b border-custom-border-100 pb-3.5">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-medium">{t("common.workflows")}</h3>
        </div>
        {isWorkflowFeatureFlagEnabled && (
          <div className="flex-shrink-0 flex items-center justify-center gap-2 px-4">
            <span className="text-xs text-custom-text-300">{t("common.live")}</span>
            <ToggleSwitch value={!!isWorkflowEnabled} onChange={handleEnableDisableWorkflow} disabled={isLoading} />
            <WorkflowSettingsQuickActions projectId={projectId?.toString()} workspaceSlug={workspaceSlug?.toString()} />
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <WithFeatureFlagHOC flag="WORKFLOWS" fallback={<WorkflowUpgrade />} workspaceSlug={workspaceSlug?.toString()}>
          <StateWorkflowRoot workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
        </WithFeatureFlagHOC>
      </div>
    </div>
  );
});

export default WorkflowsSettingsPage;
