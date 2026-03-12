/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { CustomMenu, ToggleSwitch } from "@plane/ui";
import { RotateCcw, History } from "lucide-react";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkflowStore } from "@/hooks/store/use-workflow";
// ce components
import { WorkflowSettingsRoot } from "@/plane-web/components/projects/settings/workflows/root";
// local
import { WorkflowsProjectSettingsHeader } from "./header";

function WorkflowsSettingsPage() {
  const { workspaceSlug, projectId } = useParams();
  const { t } = useTranslation();
  const { currentProjectDetails } = useProject();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const workflowStore = useWorkflowStore();

  const canPerformProjectAdminActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails.name} - Workflows` : undefined;

  const isLive = projectId ? workflowStore.isLive(projectId) : false;

  const handleToggleLive = async (value: boolean) => {
    if (!workspaceSlug || !projectId) return;
    try {
      await workflowStore.updateIsLive(workspaceSlug, projectId, value);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: value ? t("project_settings.workflows.live_toggle_on") : t("project_settings.workflows.live_toggle_off"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error") });
    }
  };

  const handleReset = async () => {
    if (!workspaceSlug || !projectId) return;
    if (!confirm(t("project_settings.workflows.reset_confirm_title"))) return;
    try {
      await workflowStore.resetWorkflow(workspaceSlug, projectId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("project_settings.workflows.reset") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error") });
    }
  };

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  if (!workspaceSlug || !projectId) return null;

  const headerControl = (
    <div className="flex items-center gap-3">
      <span className="text-sm text-secondary">{t("project_settings.workflows.live_toggle_label")}</span>
      <ToggleSwitch value={isLive} onChange={(v) => void handleToggleLive(v)} size="sm" />
      <CustomMenu ellipsis customButtonClassName="flex items-center text-secondary hover:text-primary">
        <CustomMenu.MenuItem onClick={() => void handleReset()}>
          <div className="flex items-center gap-2 text-sm">
            <RotateCcw className="h-4 w-4" />
            {t("project_settings.workflows.reset")}
          </div>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem>
          <div className="flex items-center gap-2 text-sm">
            <History className="h-4 w-4" />
            {t("project_settings.workflows.view_history")}
          </div>
        </CustomMenu.MenuItem>
      </CustomMenu>
    </div>
  );

  return (
    <SettingsContentWrapper header={<WorkflowsProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className="w-full">
        <SettingsHeading
          title={t("project_settings.workflows.heading")}
          description={t("project_settings.workflows.description")}
          control={headerControl}
        />
        <div className="mt-6">
          <WorkflowSettingsRoot workspaceSlug={workspaceSlug} projectId={projectId} />
        </div>
      </div>
    </SettingsContentWrapper>
  );
}

const WorkflowsSettingsPageObserved = observer(WorkflowsSettingsPage);
export default WorkflowsSettingsPageObserved;
