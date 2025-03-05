"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { ETemplateLevel, EUserPermissionsLevel, EUserProjectRoles } from "@plane/constants";
// component
import { useTranslation } from "@plane/i18n";
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
// store hooks
import { useProject, useUserPermissions } from "@/hooks/store";
// plane web components
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import {
  CreateTemplatesButton,
  TemplatesUpgrade,
  ProjectTemplatesSettingsRoot,
} from "@/plane-web/components/templates/settings";
import { useFlag, useWorkItemTemplates } from "@/plane-web/hooks/store";

const TemplatesProjectSettingsPage = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { getProjectById } = useProject();
  const { getAllWorkItemTemplatesForProject } = useWorkItemTemplates();
  // derived values
  const isTemplatesEnabled = useFlag(workspaceSlug?.toString(), "WORKITEM_TEMPLATES");
  const workItemTemplateIds = getAllWorkItemTemplatesForProject(projectId?.toString());
  const currentProjectDetails = getProjectById(projectId?.toString());
  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails.name} - ${t("common.templates")}`
    : undefined;
  const hasAdminPermission = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
  const hasMemberLevelPermission = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  if (!workspaceSlug || !currentProjectDetails?.id) return <></>;

  if (workspaceUserInfo && !hasMemberLevelPermission) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex items-center justify-between border-b border-custom-border-200 pb-3 tracking-tight">
        <div>
          <h3 className="text-xl font-medium">{t("templates.settings.title")}</h3>
          <span className="text-custom-sidebar-text-300 text-sm font-medium">
            {t("templates.settings.description")}
          </span>
        </div>
        {isTemplatesEnabled && workItemTemplateIds.length > 0 && hasAdminPermission && (
          <CreateTemplatesButton
            workspaceSlug={workspaceSlug?.toString()}
            projectId={projectId?.toString()}
            currentLevel={ETemplateLevel.PROJECT}
            buttonSize="sm"
          />
        )}
      </div>
      <WithFeatureFlagHOC
        flag="WORKITEM_TEMPLATES"
        fallback={<TemplatesUpgrade />}
        workspaceSlug={workspaceSlug?.toString()}
      >
        <ProjectTemplatesSettingsRoot workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
      </WithFeatureFlagHOC>
    </>
  );
});

export default TemplatesProjectSettingsPage;
