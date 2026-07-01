/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { ProjectTemplatesListRoot } from "@/components/project-templates";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";
// local imports
import type { Route } from "./+types/page";
import { ProjectTemplatesSettingsHeader } from "./header";

function ProjectTemplatesListPage({ params }: Route.ComponentProps) {
  // router
  const router = useRouter();
  const { workspaceSlug } = params;
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

  const handleNavigateToNew = () => {
    router.push(`/${workspaceSlug}/settings/templates/new`);
  };

  // admin gate: non-admins cannot view this page
  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<ProjectTemplatesSettingsHeader />}>
      <PageHead title={pageTitle} />
      <SettingsHeading
        title={t("workspace_settings.settings.project_templates.title")}
        description={t("workspace_settings.settings.project_templates.description")}
        control={
          <Button variant="primary" size="lg" onClick={handleNavigateToNew}>
            {t("workspace_settings.settings.project_templates.new_template")}
          </Button>
        }
      />
      <div className="mt-6 w-full">
        <ProjectTemplatesListRoot workspaceSlug={workspaceSlug} />
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(ProjectTemplatesListPage);
