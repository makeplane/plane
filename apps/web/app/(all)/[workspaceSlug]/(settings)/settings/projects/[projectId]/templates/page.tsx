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
// plane imports
import { E_FEATURE_FLAGS, ETemplateLevel, EUserPermissionsLevel } from "@plane/constants";
// component
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles } from "@plane/types";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
// store hooks
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { CreateTemplatesButton, TemplatesUpgrade, ProjectTemplatesSettingsRoot } from "@/components/templates/settings";
import { useFlag, usePageTemplates, useWorkItemTemplates } from "@/plane-web/hooks/store";
// local imports
import type { Route } from "./+types/page";
import { TemplatesProjectSettingsHeader } from "./header";

function TemplatesProjectSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { getProjectById } = useProject();
  const { isAnyWorkItemTemplatesAvailableForProject } = useWorkItemTemplates();
  const { isAnyPageTemplatesAvailableForProject } = usePageTemplates();
  // derived values
  const isWorkItemTemplatesEnabled = useFlag(workspaceSlug, "WORKITEM_TEMPLATES");
  const isPageTemplatesEnabled = useFlag(workspaceSlug, "PAGE_TEMPLATES");
  const isWorkItemTemplatesAvailableForProject = isAnyWorkItemTemplatesAvailableForProject(workspaceSlug, projectId);
  const isPageTemplatesAvailableForProject = isAnyPageTemplatesAvailableForProject(workspaceSlug, projectId);
  const isAnyTemplatesEnabled = isWorkItemTemplatesEnabled || isPageTemplatesEnabled;
  const isAnyTemplatesAvailableForProject =
    isWorkItemTemplatesAvailableForProject || isPageTemplatesAvailableForProject;
  const currentProjectDetails = getProjectById(projectId);
  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails.name} - ${t("common.templates")}`
    : undefined;
  const hasAdminPermission = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
  const hasMemberLevelPermission = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  if (!currentProjectDetails?.id) return <></>;

  if (workspaceUserInfo && !hasMemberLevelPermission) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <SettingsContentWrapper header={<TemplatesProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <SettingsHeading
        title={t("project_settings.templates.heading")}
        description={t("project_settings.templates.description")}
        control={
          isAnyTemplatesEnabled &&
          isAnyTemplatesAvailableForProject &&
          hasAdminPermission && (
            <CreateTemplatesButton
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              currentLevel={ETemplateLevel.PROJECT}
              buttonSize="base"
              variant="settings"
            />
          )
        }
      />
      <WithFeatureFlagHOC
        flag={E_FEATURE_FLAGS.WORKITEM_TEMPLATES}
        fallback={<TemplatesUpgrade flag={E_FEATURE_FLAGS.WORKITEM_TEMPLATES} />}
        workspaceSlug={workspaceSlug}
      >
        <ProjectTemplatesSettingsRoot workspaceSlug={workspaceSlug} projectId={projectId} />
      </WithFeatureFlagHOC>
    </SettingsContentWrapper>
  );
}

export default observer(TemplatesProjectSettingsPage);
