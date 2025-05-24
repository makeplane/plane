"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { E_FEATURE_FLAGS, ETemplateLevel, EUserPermissionsLevel, EUserWorkspaceRoles } from "@plane/constants";
// component
import { useTranslation } from "@plane/i18n";
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
// store hooks
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
    <>
      <PageHead title={pageTitle} />
      <div className="flex items-center justify-between border-b border-custom-border-200 pb-3 tracking-tight">
        <div>
          <h3 className="text-xl font-medium">{t("templates.settings.title")}</h3>
          <span className="text-custom-sidebar-text-300 text-sm font-medium">
            {t("templates.settings.description")}
          </span>
        </div>
        {isAnyTemplatesEnabled && isAnyTemplatesAvailable && hasAdminPermission && (
          <CreateTemplatesButton
            workspaceSlug={workspaceSlug?.toString()}
            currentLevel={ETemplateLevel.WORKSPACE}
            buttonSize="sm"
          />
        )}
      </div>
      <WithFeatureFlagHOC
        flag={E_FEATURE_FLAGS.WORKITEM_TEMPLATES}
        fallback={<TemplatesUpgrade flag={E_FEATURE_FLAGS.WORKITEM_TEMPLATES} />}
        workspaceSlug={workspaceSlug?.toString()}
      >
        <WorkspaceTemplatesSettingsRoot workspaceSlug={workspaceSlug?.toString()} />
      </WithFeatureFlagHOC>
    </>
  );
});

export default TemplatesWorkspaceSettingsPage;
