/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { WorklogsRoot } from "@/components/workspace/worklogs";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import type { Route } from "./+types/page";
import { WorklogsWorkspaceSettingsHeader } from "./header";

const WorklogsSettingsPage = observer(function WorklogsSettingsPage({ params: _params }: Route.ComponentProps) {
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
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.worklogs.title")}`
    : undefined;

  // if user is not authorized to view this page
  if (workspaceUserInfo && !canPerformWorkspaceMemberActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<WorklogsWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <div
        className={cn("flex w-full flex-col gap-y-6", {
          "opacity-60": !canPerformWorkspaceMemberActions,
        })}
      >
        <SettingsHeading
          title={t("workspace_settings.settings.worklogs.heading")}
          description={t("workspace_settings.settings.worklogs.description")}
        />
        <WorklogsRoot />
      </div>
    </SettingsContentWrapper>
  );
});

export default WorklogsSettingsPage;
