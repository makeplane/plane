"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { ArchiveRestoreIcon, ExternalLink, Link, Lock, Trash2, UsersRound } from "lucide-react";
import { ArchiveIcon, ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
// plane imports
import { copyUrlToClipboard } from "@plane/utils";
// plane web components
import { WikiDeletePageModal } from "@/plane-web/components/pages";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
  pageLink: string;
  parentRef: React.RefObject<HTMLElement>;
};

export const WorkspacePageQuickActions: React.FC<Props> = observer((props) => {
  const { page, pageLink, parentRef } = props;
  // states
  const [deletePageModal, setDeletePageModal] = useState(false);
  // store hooks
  const {
    access,
    archive,
    archived_at,
    makePublic,
    makePrivate,
    restore,
    canCurrentUserArchivePage,
    canCurrentUserChangeAccess,
    canCurrentUserDeletePage,
  } = page;

  const handleCopyText = () =>
    copyUrlToClipboard(pageLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "Page link copied to clipboard.",
      });
    });

  const handleOpenInNewTab = () => window.open(`/${pageLink}`, "_blank");

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "make-public-private",
      action: access === 0 ? () => makePrivate({}) : () => makePublic({}),
      title: access === 0 ? "Make private" : "Make public",
      icon: access === 0 ? Lock : UsersRound,
      shouldRender: canCurrentUserChangeAccess && !archived_at,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: "Open in new tab",
      icon: ExternalLink,
      shouldRender: true,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: "Copy link",
      icon: Link,
      shouldRender: true,
    },
    {
      key: "archive-restore",
      action: archived_at ? () => restore({}) : () => archive({}),
      title: archived_at ? "Restore" : "Archive",
      icon: archived_at ? ArchiveRestoreIcon : ArchiveIcon,
      shouldRender: canCurrentUserArchivePage,
    },
    {
      key: "delete",
      action: () => setDeletePageModal(true),
      title: "Delete",
      icon: Trash2,
      shouldRender: canCurrentUserDeletePage && !!archived_at,
    },
  ];

  return (
    <>
      <WikiDeletePageModal isOpen={deletePageModal} onClose={() => setDeletePageModal(false)} page={page} />
      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />
      <CustomMenu placement="bottom-end" ellipsis closeOnSelect>
        {MENU_ITEMS.map((item) => {
          if (!item.shouldRender) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                item.action();
              }}
              className="flex items-center gap-2"
              disabled={item.disabled}
            >
              {item.icon && <item.icon className="h-3 w-3" />}
              {item.title}
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
