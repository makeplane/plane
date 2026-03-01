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

import { useState } from "react";
import { observer } from "mobx-react";
import { NewTabIcon, LinkIcon, EditIcon, TrashIcon } from "@plane/propel/icons";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TTeamspaceView } from "@plane/types";
import { EUserWorkspaceRoles } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import { ContextMenu, CustomMenu } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
// hooks
import { useUser, useUserPermissions } from "@/hooks/store/user";
// plane web components
import { CreateUpdateTeamspaceViewModal } from "@/components/teamspaces/views/modals/create-update";
import { DeleteTeamspaceViewModal } from "@/components/teamspaces/views/modals/delete";
import { PublishTeamspaceViewModal } from "@/components/teamspaces/views/modals/publish";
import { useViewPublish } from "@/components/views/publish";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  teamspaceId: string;
  view: TTeamspaceView;
  workspaceSlug: string;
};

export const TeamspaceViewQuickActions = observer(function TeamspaceViewQuickActions(props: Props) {
  const { parentRef, teamspaceId, view, workspaceSlug } = props;
  // states
  const [createUpdateViewModal, setCreateUpdateViewModal] = useState(false);
  const [deleteViewModal, setDeleteViewModal] = useState(false);
  // store hooks
  const { data } = useUser();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isOwner = view?.owned_by === data?.id;
  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlug);
  const canPublishView = isAdmin;
  const viewDetailLink = `/${workspaceSlug}/teamspaces/${view.team}/views/${view.id}`;
  const isPublishAllowed = false && (isAdmin || isOwner); // TODO: Publish operation is not supported for teamspace views right now

  const { isPublishModalOpen, setPublishModalOpen, publishContextMenu } = useViewPublish(
    !!view.anchor,
    isPublishAllowed
  );

  const handleCopyText = () =>
    copyUrlToClipboard(viewDetailLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "View link copied to clipboard.",
      });
    });

  const handleOpenInNewTab = () => window.open(viewDetailLink, "_blank");

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      action: () => setCreateUpdateViewModal(true),
      title: "Edit",
      icon: EditIcon,
      shouldRender: isOwner,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: "Open in new tab",
      icon: NewTabIcon,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: "Copy link",
      icon: LinkIcon,
    },
    {
      key: "delete",
      action: () => setDeleteViewModal(true),
      title: "Delete",
      icon: TrashIcon,
      shouldRender: isOwner || isAdmin,
    },
  ];

  if (publishContextMenu) MENU_ITEMS.splice(2, 0, publishContextMenu);

  const CONTEXT_MENU_ITEMS: TContextMenuItem[] = MENU_ITEMS.map((item) => ({
    ...item,
    action: () => {
      item.action();
    },
  }));

  return (
    <>
      <CreateUpdateTeamspaceViewModal
        isOpen={createUpdateViewModal}
        onClose={() => setCreateUpdateViewModal(false)}
        workspaceSlug={workspaceSlug}
        teamspaceId={teamspaceId}
        data={view}
      />
      <DeleteTeamspaceViewModal
        data={view}
        teamspaceId={teamspaceId}
        isOpen={deleteViewModal}
        onClose={() => setDeleteViewModal(false)}
      />
      <PublishTeamspaceViewModal
        isOpen={isPublishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        view={view}
        teamspaceId={teamspaceId}
      />
      <ContextMenu parentRef={parentRef} items={CONTEXT_MENU_ITEMS} />
      <CustomMenu ellipsis placement="bottom-end" closeOnSelect>
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          if (item.key === "publish" && !canPublishView) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={() => {
                item.action();
              }}
              className={cn(
                "flex items-center gap-2",
                {
                  "text-placeholder": item.disabled,
                },
                item.className
              )}
              disabled={item.disabled}
            >
              {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
              <div>
                <h5>{item.title}</h5>
                {item.description && (
                  <p
                    className={cn("text-tertiary whitespace-pre-line", {
                      "text-placeholder": item.disabled,
                    })}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
