"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { ExternalLink, LinkIcon, Pencil, Trash2, Lock } from "lucide-react";
// types
import { IWorkspaceView } from "@plane/types";
// ui
import { ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { CreateUpdateWorkspaceViewModal, DeleteGlobalViewModal } from "@/components/workspace";
// constants
import { EViewAccess } from "@/constants/views";
// helpers
import { cn } from "@/helpers/common.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useUser, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  workspaceSlug: string;
  globalViewId: string;
  viewId: string;
  view: IWorkspaceView;
};

export const WorkspaceViewQuickActions: React.FC<Props> = observer((props) => {
  const { parentRef, view, globalViewId, viewId, workspaceSlug } = props;
  // states
  const [updateViewModal, setUpdateViewModal] = useState(false);
  const [deleteViewModal, setDeleteViewModal] = useState(false);
  // store hooks
  const { data } = useUser();
  const { allowPermissions } = useUserPermissions();
  // auth
  const isOwner = view?.owned_by === data?.id;
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const viewLink = `${workspaceSlug}/workspace-views/${view.id}`;
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
      action: () => setUpdateViewModal(true),
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
      icon: LinkIcon,
    },
    {
      key: "delete",
      action: () => setDeleteViewModal(true),
      title: "Delete",
      icon: Trash2,
      shouldRender: isOwner || isAdmin,
    },
  ];

  const isSelected = viewId === globalViewId;
  const isPrivateView = view.access === EViewAccess.PRIVATE;

  let customButton = (
    <div
      className={`flex gap-1 items-center flex-shrink-0 whitespace-nowrap border-b-2 p-3  text-sm font-medium outline-none ${
        isSelected
          ? "border-custom-primary-100 text-custom-primary-100"
          : "border-transparent hover:border-custom-border-200 hover:text-custom-text-400"
      } ${isPrivateView ? "pr-2" : ""}`}
    >
      <span className={`flex min-w-min flex-shrink-0 whitespace-nowrap text-sm font-medium outline-none`}>
        {view.name}
      </span>
      {isPrivateView && (
        <Lock className={`${isSelected ? "text-custom-primary-100" : "text-custom-text-400"} h-4 w-4`} />
      )}
    </div>
  );

  if (!isSelected) {
    customButton = (
      <Link key={viewId} id={`global-view-${viewId}`} href={`/${workspaceSlug}/workspace-views/${viewId}`}>
        {customButton}
      </Link>
    );
  }

  return (
    <>
      <CreateUpdateWorkspaceViewModal data={view} isOpen={updateViewModal} onClose={() => setUpdateViewModal(false)} />
      <DeleteGlobalViewModal data={view} isOpen={deleteViewModal} onClose={() => setDeleteViewModal(false)} />

      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />

      {customButton}
    </>
  );
});
