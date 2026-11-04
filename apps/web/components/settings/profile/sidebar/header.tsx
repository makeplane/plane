/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ArrowNarrowLeftOutline } from "@makeplane/propel/icons";
import { observer } from "mobx-react";
// plane imports
import { Avatar } from "@makeplane/propel/components/avatar";
import { useTranslation } from "@plane/i18n";
import { getFileURL } from "@plane/utils";
// components
import { SettingsSidebarItem } from "@/components/settings/sidebar/item";
// hooks
import { useUser } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";

export const ProfileSettingsSidebarHeader = observer(function ProfileSettingsSidebarHeader() {
  // store hooks
  const { data: currentUser } = useUser();
  const { workspaces } = useWorkspace();
  // translation
  const { t } = useTranslation();
  // derived values
  const workspaceList = Object.values(workspaces ?? {});
  const workspace =
    workspaceList.find((w) => w.id === currentUser?.last_workspace_id) ?? workspaceList[0];

  return (
    <div className="flex shrink-0 flex-col gap-3">
      {workspace && (
        <SettingsSidebarItem
          as="link"
          href={`/${workspace.slug}/`}
          icon={ArrowNarrowLeftOutline}
          label={t("back_to_workspace")}
          isActive={false}
        />
      )}
      <div className="flex shrink-0 items-center gap-2">
        <div className="shrink-0">
          <Avatar
            alt={currentUser?.display_name}
            fallback={currentUser?.display_name?.[0]?.toUpperCase()}
            src={getFileURL(currentUser?.avatar_url ?? "")}
            size="lg"
          />
        </div>
        <div className="truncate">
          <p className="truncate text-body-sm-medium">
            {currentUser?.first_name} {currentUser?.last_name}
          </p>
          <p className="truncate text-caption-md-regular">{currentUser?.email}</p>
        </div>
      </div>
    </div>
  );
});
