"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { E_FEATURE_FLAGS, ETemplateLevel, EUserPermissionsLevel, EUserProjectRoles } from "@plane/constants";
// component
import { useTranslation } from "@plane/i18n";
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
// store hooks
import { SettingsContentWrapper, SettingsHeading } from "@/components/settings";
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
  const { isAnyWorkItemTemplatesAvailableForProject } = useWorkItemTemplates();
  // derived values
  const isWorkItemTemplatesEnabled = useFlag(workspaceSlug?.toString(), "WORKITEM_TEMPLATES");
  const isWorkItemTemplatesAvailableForProject = isAnyWorkItemTemplatesAvailableForProject(
    workspaceSlug?.toString(),
    projectId?.toString()
  );
  const isAnyTemplatesEnabled = isWorkItemTemplatesEnabled;
  const isAnyTemplatesAvailableForProject = isWorkItemTemplatesAvailableForProject;
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
    <SettingsContentWrapper>
      <PageHead title={pageTitle} />
      <SettingsHeading
        title={t("project_settings.templates.heading")}
        description={t("project_settings.templates.description")}
        showButton={isAnyTemplatesEnabled && isAnyTemplatesAvailableForProject && hasAdminPermission}
        customButton={
          <CreateTemplatesButton
            workspaceSlug={workspaceSlug?.toString()}
            projectId={projectId?.toString()}
            currentLevel={ETemplateLevel.PROJECT}
            buttonSize="sm"
          />
        }
      />
      <WithFeatureFlagHOC
        flag={E_FEATURE_FLAGS.WORKITEM_TEMPLATES}
        fallback={<TemplatesUpgrade flag={E_FEATURE_FLAGS.WORKITEM_TEMPLATES} />}
        workspaceSlug={workspaceSlug?.toString()}
      >
        <ProjectTemplatesSettingsRoot workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
      </WithFeatureFlagHOC>
    </SettingsContentWrapper>
  );
});

export default TemplatesProjectSettingsPage;
