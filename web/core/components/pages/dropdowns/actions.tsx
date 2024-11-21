"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import {
  ArchiveRestoreIcon,
  Copy,
  ExternalLink,
  FileOutput,
  Globe2,
  Link,
  Lock,
  LockKeyhole,
  LockKeyholeOpen,
  Trash2,
} from "lucide-react";
// plane ui
import { ArchiveIcon, ContextMenu, CustomMenu, TContextMenuItem } from "@plane/ui";
// components
import { DeletePageModal } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { usePageOperations } from "@/hooks/use-page-operations";
// plane web components
import { MovePageModal } from "@/plane-web/components/pages";
// store types
import { IPage } from "@/store/pages/page";

export type TPageActions =
  | "full-screen"
  | "copy-markdown"
  | "toggle-lock"
  | "toggle-access"
  | "open-in-new-tab"
  | "copy-link"
  | "make-a-copy"
  | "archive-restore"
  | "delete"
  | "version-history"
  | "export"
  | "move";

type Props = {
  extraOptions?: (TContextMenuItem & { key: TPageActions })[];
  optionsOrder: TPageActions[];
  page: IPage;
  parentRef?: React.RefObject<HTMLElement>;
};

export const PageActions: React.FC<Props> = observer((props) => {
  const { extraOptions, optionsOrder, page, parentRef } = props;
  // states
  const [deletePageModal, setDeletePageModal] = useState(false);
  const [movePageModal, setMovePageModal] = useState(false);
  // page operations
  const { pageOperations } = usePageOperations(page);
  // derived values
  const {
    access,
    archived_at,
    is_locked,
    canCurrentUserArchivePage,
    canCurrentUserChangeAccess,
    canCurrentUserDeletePage,
    canCurrentUserDuplicatePage,
    canCurrentUserLockPage,
    canCurrentUserMovePage,
  } = page;
  // menu items
  const MENU_ITEMS: (TContextMenuItem & { key: TPageActions })[] = useMemo(
    () => [
      {
        key: "toggle-lock",
        action: pageOperations.toggleLock,
        title: is_locked ? "Unlock page" : "Lock page",
        icon: is_locked ? LockKeyholeOpen : LockKeyhole,
        shouldRender: canCurrentUserLockPage,
      },
      {
        key: "toggle-access",
        action: pageOperations.toggleAccess,
        title: access === 0 ? "Make private" : "Make public",
        icon: access === 0 ? Lock : Globe2,
        shouldRender: canCurrentUserChangeAccess,
      },
      {
        key: "open-in-new-tab",
        action: pageOperations.openInNewTab,
        title: "Open in new tab",
        icon: ExternalLink,
        shouldRender: true,
      },
      {
        key: "copy-link",
        action: pageOperations.copyLink,
        title: "Copy link",
        icon: Link,
        shouldRender: true,
      },
      {
        key: "make-a-copy",
        action: pageOperations.duplicate,
        title: "Make a copy",
        icon: Copy,
        shouldRender: canCurrentUserDuplicatePage,
      },
      {
        key: "archive-restore",
        action: pageOperations.toggleArchive,
        title: !!archived_at ? "Restore" : "Archive",
        icon: !!archived_at ? ArchiveRestoreIcon : ArchiveIcon,
        shouldRender: canCurrentUserArchivePage,
      },
      {
        key: "delete",
        action: () => setDeletePageModal(true),
        title: "Delete",
        icon: Trash2,
        shouldRender: canCurrentUserDeletePage,
      },

      {
        key: "move",
        action: () => setMovePageModal(true),
        title: "Move",
        icon: FileOutput,
        shouldRender: canCurrentUserMovePage,
      },
    ],
    [
      access,
      archived_at,
      is_locked,
      canCurrentUserArchivePage,
      canCurrentUserChangeAccess,
      canCurrentUserDeletePage,
      canCurrentUserDuplicatePage,
      canCurrentUserLockPage,
      canCurrentUserMovePage,
      pageOperations,
    ]
  );
  if (extraOptions) {
    MENU_ITEMS.push(...extraOptions);
  }
  // arrange options
  const arrangedOptions = useMemo(
    () =>
      optionsOrder
        .map((key) => MENU_ITEMS.find((item) => item.key === key))
        .filter((item) => !!item),
    [optionsOrder, MENU_ITEMS]
  );

  return (
    <>
      <MovePageModal isOpen={movePageModal} onClose={() => setMovePageModal(false)} page={page} />
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
                item.action?.();
              }}
              className={cn("flex items-center gap-2", item.className)}
              disabled={item.disabled}
            >
              {item.customContent ?? (
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
