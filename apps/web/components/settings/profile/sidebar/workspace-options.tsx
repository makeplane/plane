/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { MailOutline, PlusCircleOutline } from "@makeplane/propel/icons";
import { observer } from "mobx-react";
// plane imports
import { List } from "@makeplane/propel/components/list";
import { WorkspaceAvatar } from "@makeplane/propel/components/workspace-avatar";
import { useTranslation } from "@plane/i18n";
import { getFileURL } from "@plane/utils";
// components
import { SettingsSidebarItem } from "@/components/settings/sidebar/item";
import { SettingsSidebarSectionHeading } from "@/components/settings/sidebar/section-heading";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";

export const ProfileSettingsSidebarWorkspaceOptions = observer(function ProfileSettingsSidebarWorkspaceOptions() {
  // store hooks
  const { workspaces } = useWorkspace();
  // translation
  const { t } = useTranslation();

  return (
    <div className="shrink-0">
      <SettingsSidebarSectionHeading>{t("common.workspace")}</SettingsSidebarSectionHeading>
      <List gap="px" role="toolbar" aria-label={t("common.workspace")}>
        {Object.values(workspaces).map((workspace) => (
          <SettingsSidebarItem
            key={workspace.id}
            as="link"
            href={`/${workspace.slug}/`}
            iconNode={<WorkspaceAvatar size="sm" src={getFileURL(workspace.logo_url ?? "")} alt={workspace.name} />}
            label={workspace.name}
            isActive={false}
          />
        ))}
        <div className="mt-1.5">
          <SettingsSidebarItem
            as="link"
            href="/create-workspace/"
            icon={PlusCircleOutline}
            label={t("create_workspace")}
            isActive={false}
          />
          <SettingsSidebarItem
            as="link"
            href="/invitations/"
            icon={MailOutline}
            label={t("workspace_invites")}
            isActive={false}
          />
        </div>
      </List>
    </div>
  );
});
