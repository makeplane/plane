/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel, SETTINGS_DOCS_URLS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { cn } from "@plane/utils";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { ExportGuide } from "@/components/exporter/guide";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { ExportsWorkspaceSettingsHeader } from "./header";

function ExportsPage() {
  // states
  const [isExportFormOpen, setIsExportFormOpen] = useState(false);
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
    <SettingsContentWrapper header={<ExportsWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <div
        className={cn("flex w-full flex-col gap-y-6", {
          "opacity-60": !canPerformWorkspaceMemberActions,
        })}
      >
        <SettingsHeading
          title={t("workspace_settings.settings.exports.heading")}
          description={t("workspace_settings.settings.exports.description")}
          docHref={SETTINGS_DOCS_URLS.exports}
          control={
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              label={t("export")}
              onClick={() => setIsExportFormOpen(true)}
            />
          }
        />
        <ExportGuide isExportFormOpen={isExportFormOpen} onExportFormClose={() => setIsExportFormOpen(false)} />
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(ExportsPage);
