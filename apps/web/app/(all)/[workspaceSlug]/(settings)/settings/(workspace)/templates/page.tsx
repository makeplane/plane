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
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import {
  CreateTemplatesButton,
  TemplatesUpgrade,
  WorkspaceTemplatesSettingsRoot,
} from "@/components/templates/settings";
import { useFlag, useProjectTemplates, useWorkItemTemplates, usePageTemplates } from "@/plane-web/hooks/store";
// local imports
import type { Route } from "./+types/page";
import { TemplatesWorkspaceSettingsHeader } from "./header";

function TemplatesWorkspaceSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { isAnyProjectTemplatesAvailable } = useProjectTemplates();
  const { isAnyWorkItemTemplatesAvailable } = useWorkItemTemplates();
  const { isAnyPageTemplatesAvailable } = usePageTemplates();
  // derived values
  const isProjectTemplatesEnabled = useFlag(workspaceSlug, "PROJECT_TEMPLATES");
  const isProjectTemplatesAvailable = isAnyProjectTemplatesAvailable(workspaceSlug);
  const isWorkItemTemplatesEnabled = useFlag(workspaceSlug, "WORKITEM_TEMPLATES");
  const isWorkItemTemplatesAvailable = isAnyWorkItemTemplatesAvailable(workspaceSlug);
  const isPageTemplatesEnabled = useFlag(workspaceSlug, "PAGE_TEMPLATES");
  const isPageTemplatesAvailable = isAnyPageTemplatesAvailable(workspaceSlug);
  const isAnyTemplatesEnabled = isProjectTemplatesEnabled || isWorkItemTemplatesEnabled || isPageTemplatesEnabled;
  const isAnyTemplatesAvailable =
    isProjectTemplatesAvailable || isWorkItemTemplatesAvailable || isPageTemplatesAvailable;
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - ${t("common.templates")}` : undefined;
  const hasAdminPermission = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (!currentWorkspace?.id) return <></>;

  if (workspaceUserInfo && !hasAdminPermission) {
    return <NotAuthorizedView section="settings" />;
  }

  return (
    <SettingsContentWrapper header={<TemplatesWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <SettingsHeading
        title={t("workspace_settings.settings.templates.heading")}
        description={t("workspace_settings.settings.templates.description")}
        control={
          <>
            {isAnyTemplatesEnabled && isAnyTemplatesAvailable && hasAdminPermission && (
              <CreateTemplatesButton
                workspaceSlug={workspaceSlug}
                currentLevel={ETemplateLevel.WORKSPACE}
                buttonSize="lg"
                variant="settings"
              />
            )}
          </>
        }
      />
      <WithFeatureFlagHOC
        flag={E_FEATURE_FLAGS.WORKITEM_TEMPLATES}
        fallback={<TemplatesUpgrade flag={E_FEATURE_FLAGS.WORKITEM_TEMPLATES} />}
        workspaceSlug={workspaceSlug}
      >
        <WorkspaceTemplatesSettingsRoot workspaceSlug={workspaceSlug} />
      </WithFeatureFlagHOC>
    </SettingsContentWrapper>
  );
}

export default observer(TemplatesWorkspaceSettingsPage);
