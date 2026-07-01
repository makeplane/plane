/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, WORKSPACE_PROJECT_TEMPLATE_DETAIL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { ProjectTemplateEditorRoot } from "@/components/project-templates";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { ProjectService } from "@/services/project";
// local imports
import type { Route } from "./+types/page";
import { EditProjectTemplateSettingsHeader } from "./header";

const projectService = new ProjectService();

function EditProjectTemplatePage({ params }: Route.ComponentProps) {
  const { workspaceSlug, templateId } = params;
  // plane hooks
  const { t } = useTranslation();
  // mobx store
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.project_templates.title")}`
    : undefined;

  // Fetch template detail by id; SWR key is parameterized so revalidations are
  // scoped to a single template (e.g. on reactivate). The list key is mutated
  // separately by the editor's onSubmit handler.
  const { data: template, isLoading } = useSWR(
    workspaceSlug && templateId && canPerformWorkspaceAdminActions
      ? WORKSPACE_PROJECT_TEMPLATE_DETAIL(workspaceSlug, templateId)
      : null,
    workspaceSlug && templateId && canPerformWorkspaceAdminActions
      ? () => projectService.getProjectTemplate(workspaceSlug, templateId)
      : null
  );

  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  // While loading, render the empty editor shell — the root will reset the form
  // when the fetch resolves. This avoids a hard flash before the data arrives.
  return (
    <SettingsContentWrapper header={<EditProjectTemplateSettingsHeader workspaceSlug={workspaceSlug} />}>
      <PageHead title={pageTitle} />
      <ProjectTemplateEditorRoot
        workspaceSlug={workspaceSlug}
        templateId={templateId}
        mode="edit"
        initialTemplate={isLoading || !template ? null : template}
        // When the loaded template is a system template, render read-only (D-08).
        readOnly={Boolean(template?.is_system)}
      />
    </SettingsContentWrapper>
  );
}

export default observer(EditProjectTemplatePage);
