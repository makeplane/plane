/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ArrowNarrowLeftOutline } from "@makeplane/propel/icons";
import { observer } from "mobx-react";
// plane imports
import { ROLE_DETAILS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";
import { WorkspaceAvatar } from "@makeplane/propel/components/workspace-avatar";
import { getFileURL } from "@plane/utils";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { useWorkspace } from "@/hooks/store/use-workspace";

export const WorkspaceSettingsSidebarHeader = observer(function WorkspaceSettingsSidebarHeader() {
  // router
  const router = useAppRouter();
  // store hooks
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  // derived values
  const currentWorkspaceRole = currentWorkspace?.slug
    ? getWorkspaceRoleByWorkspaceSlug(currentWorkspace.slug)
    : undefined;
  // translation
  const { t } = useTranslation();

  if (!currentWorkspaceRole) return null;

  return (
    <div className="sticky top-0 z-[1] shrink-0 bg-surface-1 pb-1.5">
      <div className="flex items-center gap-2 py-3 pr-5 pl-4 text-body-md-medium">
        <IconButton
          variant="tertiary"
          size="sm"
          icon={<Icon icon={ArrowNarrowLeftOutline} size="sm" />}
          aria-label={t("back_to_workspace")}
          onClick={() => router.push(`/${currentWorkspace?.slug}/`)}
        />
        <p className="truncate">Workspace settings</p>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 px-5 py-0.5">
        <div className="flex min-w-0 items-center gap-2 truncate">
          <WorkspaceAvatar size="lg" src={getFileURL(currentWorkspace?.logo_url ?? "")} alt={currentWorkspace?.name} />
          <div className="min-w-0 truncate">
            <p className="truncate text-body-sm-medium">{currentWorkspace?.name}</p>
            <p className="truncate text-caption-md-regular">{t(ROLE_DETAILS[currentWorkspaceRole].i18n_title)}</p>
          </div>
        </div>
      </div>
    </div>
  );
});
