"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EUserPermissionsLevel, WORKFLOW_TRACKER_ELEMENTS, WORKFLOW_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles } from "@plane/types";
import { setPromiseToast, ToggleSwitch } from "@plane/ui";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
// hook
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";
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
    })
      .then(() => {
        captureSuccess({
          eventName: WORKFLOW_TRACKER_EVENTS.WORKFLOW_ENABLED_DISABLED,
          payload: {
            project_id: projectId,
            is_workflow_enabled: featureState,
          },
        });
      })
      .catch((error) => {
        captureError({
          eventName: WORKFLOW_TRACKER_EVENTS.WORKFLOW_ENABLED_DISABLED,
          payload: {
            project_id: projectId,
            is_workflow_enabled: featureState,
          },
          error: error as Error,
        });
        throw error;
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
    <SettingsContentWrapper>
      <div className="w-full h-full flex flex-col">
        <PageHead title={pageTitle} />
        <SettingsHeading
          title={t("project_settings.workflows.heading")}
          description={t("project_settings.workflows.description")}
          appendToRight={
            <>
              {isWorkflowFeatureFlagEnabled && (
                <div className="flex-shrink-0 flex items-center justify-center gap-2 px-4">
                  <span className="text-xs text-custom-text-300">{t("common.live")}</span>
                  <ToggleSwitch
                    value={!!isWorkflowEnabled}
                    onChange={handleEnableDisableWorkflow}
                    disabled={isLoading}
                    data-ph-element={WORKFLOW_TRACKER_ELEMENTS.WORK_FLOW_ENABLE_DISABLE_BUTTON}
                  />
                  <WorkflowSettingsQuickActions
                    projectId={projectId?.toString()}
                    workspaceSlug={workspaceSlug?.toString()}
                  />
                </div>
              )}
            </>
          }
        />

        <div className="flex-1">
          <WithFeatureFlagHOC flag="WORKFLOWS" fallback={<WorkflowUpgrade />} workspaceSlug={workspaceSlug?.toString()}>
            <StateWorkflowRoot workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
          </WithFeatureFlagHOC>
        </div>
      </div>
    </SettingsContentWrapper>
  );
});

export default WorkflowsSettingsPage;
