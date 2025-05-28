"use client";

import { observer } from "mobx-react";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import ExportGuide from "@/components/exporter/guide";
// helpers
import { SettingsContentWrapper, SettingsHeading } from "@/components/settings";
import { cn } from "@/helpers/common.helper";
// hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";

const ExportsPage = observer(() => {
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  // derived values
  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.exports.title")}`
    : undefined;

  // if user is not authorized to view this page
  if (workspaceUserInfo && !canPerformWorkspaceMemberActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper size="lg">
      <PageHead title={pageTitle} />
      <div
        className={cn("w-full", {
          "opacity-60": !canPerformWorkspaceMemberActions,
        })}
      >
        <SettingsHeading
          title={t("workspace_settings.settings.exports.title")}
          description="Export your project data in various formats and access your export history with download links."
        />
        <ExportGuide />
      </div>
    </SettingsContentWrapper>
  );
});

export default ExportsPage;
