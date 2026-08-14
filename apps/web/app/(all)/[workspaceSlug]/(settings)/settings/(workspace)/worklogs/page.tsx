/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { ExportGuide } from "@/components/exporter/guide";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { WorklogsWorkspaceSettingsHeader } from "./header";

function WorklogsPage() {
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.worklogs.title")}`
    : undefined;

  if (workspaceUserInfo && !canPerformWorkspaceMemberActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<WorklogsWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <div className={cn("flex w-full flex-col gap-y-6", { "opacity-60": !canPerformWorkspaceMemberActions })}>
        <SettingsHeading
          title={t("workspace_settings.settings.worklogs.heading")}
          description={t("workspace_settings.settings.worklogs.description")}
        />
        <p className="text-13 text-secondary">{t("workspace_settings.settings.worklogs.hint")}</p>
        <ExportGuide exportType="issue_worklogs" />
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(WorklogsPage);
