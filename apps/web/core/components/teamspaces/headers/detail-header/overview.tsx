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
import { useParams } from "next/navigation";
import { Sidebar } from "lucide-react";
import { LinkIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { cn, copyUrlToClipboard } from "@plane/utils";
// components
import { NameDescriptionUpdateStatus } from "@/components/issues/issue-update-status";
// plane web imports
import { TeamQuickActions } from "@/components/teamspaces/actions/quick-actions";
import { useTeamspaces } from "@/plane-web/hooks/store";
// types
import type { TTeamspaceDetailPermissions } from "@/store/teamspace/permissions/root";

type TeamOverviewHeaderActionsProps = {
  teamspaceId: string;
  permissions: Pick<TTeamspaceDetailPermissions, "canEdit" | "canDelete">;
};

export const TeamOverviewHeaderActions = observer(function TeamOverviewHeaderActions(
  props: TeamOverviewHeaderActionsProps
) {
  const { teamspaceId, permissions } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { t } = useTranslation();
  const {
    isTeamSidebarCollapsed,
    isCurrentUserMemberOfTeamspace,
    toggleTeamsSidebar,
    getTeamspaceNameDescriptionLoaderById,
  } = useTeamspaces();
  // derived values
  const isTeamspaceMember = isCurrentUserMemberOfTeamspace(teamspaceId);
  const isSubmitting = getTeamspaceNameDescriptionLoaderById(teamspaceId);
  const teamLink = `${workspaceSlug}/teamspaces/${teamspaceId}`;

  const handleCopyText = async () => {
    try {
      await copyUrlToClipboard(teamLink);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("common.link_copied_to_clipboard"),
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("common.link_copy_failed"),
      });
    }
  };

  const commonButtonClassName = "flex-shrink-0 flex items-center justify-center size-6 bg-layer-1 rounded";

  if (!workspaceSlug || !isTeamspaceMember) return;
  return (
    <div className="flex items-center gap-2">
      {isSubmitting && <NameDescriptionUpdateStatus isSubmitting={isSubmitting} />}

      <IconButton
        variant="tertiary"
        size="lg"
        icon={Sidebar}
        onClick={() => toggleTeamsSidebar(!isTeamSidebarCollapsed)}
        className={cn({
          "text-accent-primary bg-accent-subtle": !isTeamSidebarCollapsed,
        })}
      />

      <IconButton variant="tertiary" size="lg" icon={LinkIcon} onClick={handleCopyText} />

      <TeamQuickActions
        teamspaceId={teamspaceId?.toString()}
        workspaceSlug={workspaceSlug?.toString()}
        parentRef={null}
        permissions={{ canEdit: false, canDelete: permissions.canDelete }}
        buttonClassName={commonButtonClassName}
      />
    </div>
  );
});
