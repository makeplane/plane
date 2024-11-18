"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import {
  ArchiveRestoreIcon,
  Copy,
  ExternalLink,
  Globe2,
  Link,
  Lock,
  LockKeyhole,
  LockKeyholeOpen,
  Trash2,
} from "lucide-react";
// plane ui
import { ArchiveIcon, ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { DeletePageModal } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useProjectPages } from "@/hooks/store";
// plane web types
import { TPageExtraActions } from "@/plane-web/types/page";

export type TPageActions =
  | "full-screen"
  | "copy-markdown"
  | "toggle-lock"
  | "toggle-privacy"
  | "open-in-new-tab"
  | "copy-link"
  | "make-a-copy"
  | "archive-restore"
  | "delete"
  | "version-history"
  | "export"
  | TPageExtraActions;

type Props = {
  extraOptions?: TContextMenuItem[];
  optionsOrder: TPageActions[];
  pageId: string;
  parentRef?: React.RefObject<HTMLElement>;
};

export const PageActions: React.FC<Props> = observer((props) => {
  const { extraOptions, optionsOrder, pageId, parentRef } = props;
  // states
  const [deletePageModal, setDeletePageModal] = useState(false);
  // params
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { pageById } = useProjectPages();
  const page = pageById(pageId);
  if (!page) return null;
  const {
    access,
    archived_at,
    archive,
    is_locked,
    restore,
    lock,
    unlock,
    makePublic,
    makePrivate,
    duplicate,
    canCurrentUserArchivePage,
    canCurrentUserDuplicatePage,
    canCurrentUserChangeAccess,
    canCurrentUserDeletePage,
    canCurrentUserLockPage,
  } = page;
  // derived values
  const pageLink = projectId
    ? `${workspaceSlug}/projects/${projectId}/pages/${pageId}`
    : `${workspaceSlug}/pages/${pageId}`;

  const handleCopyText = () =>
    copyUrlToClipboard(pageLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "Page link copied to clipboard.",
      });
    });

  const handleOpenInNewTab = () => window.open(`/${pageLink}`, "_blank");

  const handleLockPage = async () =>
    await lock().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Page could not be locked. Please try again later.",
      })
    );

  const handleUnlockPage = async () =>
    await unlock().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Page could not be unlocked. Please try again later.",
      })
    );

  const MENU_ITEMS: (TContextMenuItem & { key: TPageActions })[] = [
    {
      key: "toggle-lock",
      action: is_locked ? handleUnlockPage : handleLockPage,
      title: is_locked ? "Unlock page" : "Lock page",
      icon: is_locked ? LockKeyholeOpen : LockKeyhole,
      shouldRender: canCurrentUserLockPage,
    },
    {
      key: "toggle-privacy",
      action: async () => {
        const changedPageType = access === 0 ? "private" : "public";

        try {
          if (access === 0) await makePrivate();
          else await makePublic();

          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: `The page has been marked ${changedPageType} and moved to the ${changedPageType} section.`,
          });
        } catch {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: `The page couldn't be marked ${changedPageType}. Please try again.`,
          });
        }
      },
      title: access === 0 ? "Make private" : "Make public",
      icon: access === 0 ? Lock : Globe2,
      shouldRender: canCurrentUserChangeAccess && !archived_at,
    },
    {
      key: "open-in-new-tab",
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
      key: "make-a-copy",
      action: duplicate,
      title: "Make a copy",
      icon: Copy,
      shouldRender: canCurrentUserDuplicatePage,
    },
    {
      key: "archive-restore",
      action: archived_at ? restore : archive,
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
  if (extraOptions) {
    // @ts-expect-error type mismatch, not necessary to fix
    MENU_ITEMS.push(...extraOptions);
  }
  // arrange options
  const arrangedOptions = optionsOrder
    .map((key) => MENU_ITEMS.find((item) => item.key === key))
    .filter((item) => !!item);

  return (
    <>
      <DeletePageModal isOpen={deletePageModal} onClose={() => setDeletePageModal(false)} pageId={page.id ?? ""} />
      {parentRef && <ContextMenu parentRef={parentRef} items={arrangedOptions} />}
      <CustomMenu placement="bottom-end" optionsClassName="max-h-[90vh]" ellipsis closeOnSelect>
        {arrangedOptions.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                item.action();
              }}
              className={cn("flex items-center gap-2", item.className)}
              disabled={item.disabled}
            >
              {item.customContent ? (
                item.customContent
              ) : (
                <>
                  {item.icon && <item.icon className="size-3" />}
                  {item.title}
                </>
              )}
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
