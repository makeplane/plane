"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { ExternalLink, Link, Pencil, Trash2 } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles, TTeamspaceView } from "@plane/types";
import { ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
// hooks
import { useUser, useUserPermissions } from "@/hooks/store";
// plane web components
import { CreateUpdateTeamspaceViewModal } from "@/plane-web/components/teamspaces/views/modals/create-update";
import { DeleteTeamspaceViewModal } from "@/plane-web/components/teamspaces/views/modals/delete";
import { PublishTeamspaceViewModal } from "@/plane-web/components/teamspaces/views/modals/publish";
import { useViewPublish } from "@/plane-web/components/views/publish";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  teamspaceId: string;
  view: TTeamspaceView;
  workspaceSlug: string;
};

export const TeamspaceViewQuickActions: React.FC<Props> = observer((props) => {
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
