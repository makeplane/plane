"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { ExternalLink, Link, Pencil, Trash2 } from "lucide-react";
// types
import { TTeamView } from "@plane/types";
// ui
import { ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useUser, useUserPermissions } from "@/hooks/store";
// plane web components
import { CreateUpdateTeamViewModal } from "@/plane-web/components/teams/views/modals/create-update";
import { DeleteTeamViewModal } from "@/plane-web/components/teams/views/modals/delete";
import { PublishTeamViewModal } from "@/plane-web/components/teams/views/modals/publish";
import { useViewPublish } from "@/plane-web/components/views/publish";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  teamId: string;
  view: TTeamView;
  workspaceSlug: string;
};

export const TeamViewQuickActions: React.FC<Props> = observer((props) => {
  const { parentRef, teamId, view, workspaceSlug } = props;
  // states
  const [createUpdateViewModal, setCreateUpdateViewModal] = useState(false);
  const [deleteViewModal, setDeleteViewModal] = useState(false);
  // store hooks
  const { data } = useUser();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isOwner = view?.owned_by === data?.id;
  const isAdmin = view.is_team_view
    ? allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlug)
    : allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, view.project);
  const canPublishView = isAdmin;
  const viewDetailLink = view.is_team_view
    ? `/${workspaceSlug}/teams/${view.team}/views/${view.id}`
    : `/${workspaceSlug}/projects/${view.project}/views/${view.id}`;

  const { isPublishModalOpen, setPublishModalOpen, publishContextMenu } = useViewPublish(
    !!view.anchor,
    !view.is_team_view && (isAdmin || isOwner)
  );

  const handleCopyText = () =>
    copyUrlToClipboard(viewDetailLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "View link copied to clipboard.",
      });
    });

  const handleOpenInNewTab = () => window.open(`/${viewDetailLink}`, "_blank");

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      action: () => setCreateUpdateViewModal(true),
      title: "Edit",
      icon: Pencil,
      shouldRender: isOwner,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: "Open in new tab",
      icon: ExternalLink,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: "Copy link",
      icon: Link,
    },
    {
      key: "delete",
      action: () => setDeleteViewModal(true),
      title: "Delete",
      icon: Trash2,
      shouldRender: isOwner || isAdmin,
    },
  ];

  if (publishContextMenu) MENU_ITEMS.splice(2, 0, publishContextMenu);

  return (
    <>
      <CreateUpdateTeamViewModal
        isOpen={createUpdateViewModal}
        onClose={() => setCreateUpdateViewModal(false)}
        workspaceSlug={workspaceSlug}
        teamId={teamId}
        data={view}
      />
      <DeleteTeamViewModal
        data={view}
        teamId={teamId}
        isOpen={deleteViewModal}
        onClose={() => setDeleteViewModal(false)}
      />
      <PublishTeamViewModal
        isOpen={isPublishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        view={view}
        teamId={teamId}
      />
      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />
      <CustomMenu ellipsis placement="bottom-end" closeOnSelect>
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          if (item.key === "publish" && !canPublishView) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                item.action();
              }}
              className={cn(
                "flex items-center gap-2",
                {
                  "text-custom-text-400": item.disabled,
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
                    className={cn("text-custom-text-300 whitespace-pre-line", {
                      "text-custom-text-400": item.disabled,
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
