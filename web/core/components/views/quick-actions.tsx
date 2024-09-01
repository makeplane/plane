"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { ExternalLink, Link, Pencil, Trash2 } from "lucide-react";
// types
import { IProjectView } from "@plane/types";
// ui
import { ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { CreateUpdateProjectViewModal, DeleteProjectViewModal } from "@/components/views";
// helpers
import { cn } from "@/helpers/common.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useUser, useUserPermissions } from "@/hooks/store";
import { PublishViewModal, useViewPublish } from "@/plane-web/components/views/publish";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  projectId: string;
  view: IProjectView;
  workspaceSlug: string;
};

export const ViewQuickActions: React.FC<Props> = observer((props) => {
  const { parentRef, projectId, view, workspaceSlug } = props;
  // states
  const [createUpdateViewModal, setCreateUpdateViewModal] = useState(false);
  const [deleteViewModal, setDeleteViewModal] = useState(false);
  // store hooks
  const { data } = useUser();
  const { allowPermissions } = useUserPermissions();
  // auth
  const isOwner = view?.owned_by === data?.id;
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);

  const { isPublishModalOpen, setPublishModalOpen, publishContextMenu } = useViewPublish(
    !!view.anchor,
    isAdmin || isOwner
  );

  const viewLink = `${workspaceSlug}/projects/${projectId}/views/${view.id}`;
  const handleCopyText = () =>
    copyUrlToClipboard(viewLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "View link copied to clipboard.",
      });
    });
  const handleOpenInNewTab = () => window.open(`/${viewLink}`, "_blank");

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
      <CreateUpdateProjectViewModal
        isOpen={createUpdateViewModal}
        onClose={() => setCreateUpdateViewModal(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        data={view}
      />
      <DeleteProjectViewModal data={view} isOpen={deleteViewModal} onClose={() => setDeleteViewModal(false)} />
      <PublishViewModal isOpen={isPublishModalOpen} onClose={() => setPublishModalOpen(false)} view={view} />
      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />
      <CustomMenu ellipsis placement="bottom-end" closeOnSelect>
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
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
