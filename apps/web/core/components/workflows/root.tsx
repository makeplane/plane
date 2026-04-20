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
import { ToggleWorkflow } from "./toggle-workflow";
import { setPromiseToast } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import { WorkflowsListRoot } from "./list/workflow-list-root";
import { useWorkflows } from "@/hooks/store/use-workflows";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const WorkflowsRoot = observer(function WorkflowsRoot(props: Props) {
  const { workspaceSlug, projectId } = props;

  // hooks
  const { t } = useTranslation();
  const {
    isWorkflowsEnabled,
    toggleWorkflows,
    permissions: { getCanCreate },
  } = useWorkflows();

  // derived values
  const isEnabled = isWorkflowsEnabled(workspaceSlug, projectId);
  const canCreateWorkflow = getCanCreate(workspaceSlug, projectId);

  // handlers
  function handleToggleWorkflow() {
    if (!canCreateWorkflow) return;
    const featureTogglePromise = toggleWorkflows(workspaceSlug, projectId, !isEnabled);

    setPromiseToast(featureTogglePromise, {
      loading: !isEnabled
        ? t("project_settings.workflows.toggle.toast.loading.enabling")
        : t("project_settings.workflows.toggle.toast.loading.disabling"),
      success: {
        title: t("project_settings.workflows.toggle.toast.success.title"),
        message: () => t("project_settings.workflows.toggle.toast.success.message"),
      },
      error: {
        title: t("project_settings.workflows.toggle.toast.error.title"),
        message: () => t("project_settings.workflows.toggle.toast.error.message"),
      },
    });
  }

  return (
    <div className="flex flex-col gap-12">
      <ToggleWorkflow isEnabled={isEnabled} onToggle={handleToggleWorkflow} disabled={!canCreateWorkflow} />
      {isEnabled ? <WorkflowsListRoot projectId={projectId} workspaceSlug={workspaceSlug} /> : null}
    </div>
  );
});
