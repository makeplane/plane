"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { E_FEATURE_FLAGS, ETemplateLevel, EUserPermissionsLevel } from "@plane/constants";
// component
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
// store hooks
import { SettingsContentWrapper, SettingsHeading } from "@/components/settings";
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web components
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import {
  CreateTemplatesButton,
  TemplatesUpgrade,
  WorkspaceTemplatesSettingsRoot,
} from "@/plane-web/components/templates/settings";
import { useFlag, useProjectTemplates, useWorkItemTemplates, usePageTemplates } from "@/plane-web/hooks/store";
const TemplatesWorkspaceSettingsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { isAnyProjectTemplatesAvailable } = useProjectTemplates();
  const { isAnyWorkItemTemplatesAvailable } = useWorkItemTemplates();
  const { isAnyPageTemplatesAvailable } = usePageTemplates();
  // derived values
  const isProjectTemplatesEnabled = useFlag(workspaceSlug?.toString(), "PROJECT_TEMPLATES");
  const isProjectTemplatesAvailable = isAnyProjectTemplatesAvailable(workspaceSlug?.toString());
  const isWorkItemTemplatesEnabled = useFlag(workspaceSlug?.toString(), "WORKITEM_TEMPLATES");
  const isWorkItemTemplatesAvailable = isAnyWorkItemTemplatesAvailable(workspaceSlug?.toString());
  const isPageTemplatesEnabled = useFlag(workspaceSlug?.toString(), "PAGE_TEMPLATES");
  const isPageTemplatesAvailable = isAnyPageTemplatesAvailable(workspaceSlug?.toString());
  const isAnyTemplatesEnabled = isProjectTemplatesEnabled || isWorkItemTemplatesEnabled || isPageTemplatesEnabled;
  const isAnyTemplatesAvailable =
    isProjectTemplatesAvailable || isWorkItemTemplatesAvailable || isPageTemplatesAvailable;
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - ${t("common.templates")}` : undefined;
  const hasAdminPermission = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (!workspaceSlug || !currentWorkspace?.id) return <></>;

  if (workspaceUserInfo && !hasAdminPermission) {
    return <NotAuthorizedView section="settings" />;
  }

  return (
    <SettingsContentWrapper>
      <PageHead title={pageTitle} />
      <SettingsHeading
        title={t("workspace_settings.settings.templates.heading")}
        description={t("workspace_settings.settings.templates.description")}
        appendToRight={
          <>
            {isAnyTemplatesEnabled && isAnyTemplatesAvailable && hasAdminPermission && (
              <CreateTemplatesButton
                workspaceSlug={workspaceSlug?.toString()}
                currentLevel={ETemplateLevel.WORKSPACE}
                buttonSize="sm"
              />
            )}
          </>
        }
      />
      <WithFeatureFlagHOC
        flag={E_FEATURE_FLAGS.WORKITEM_TEMPLATES}
        fallback={<TemplatesUpgrade flag={E_FEATURE_FLAGS.WORKITEM_TEMPLATES} />}
        workspaceSlug={workspaceSlug?.toString()}
      >
        <WorkspaceTemplatesSettingsRoot workspaceSlug={workspaceSlug?.toString()} />
      </WithFeatureFlagHOC>
    </SettingsContentWrapper>
  );
});

export default TemplatesWorkspaceSettingsPage;
