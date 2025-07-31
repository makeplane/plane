"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
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
  FolderPlus,
  Archive,
} from "lucide-react";
// constants
import { EPageAccess } from "@plane/constants";
// components
import { DeletePageModal } from "@/components/pages";
import { AddToFolderModal } from "@/components/pages/folder/add-to-folder-modal";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { usePageOperations } from "@/hooks/use-page-operations";
// plane web components
import { MovePageModal } from "@/plane-web/components/pages";
// plane web hooks
import { EPageStoreType } from "@/plane-web/hooks/store";
import { usePageFlag } from "@/plane-web/hooks/use-page-flag";
// store types
import { TPageInstance } from "@/store/pages/base-page";

export type TPageActions =
  | "full-screen"
  | "sticky-toolbar"
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
  | "move"
  | "add-to-folder";

type Props = {
  extraOptions?: (any & { key: TPageActions })[];
  optionsOrder: TPageActions[];
  page: TPageInstance;
  parentRef?: React.RefObject<HTMLElement>;
  storeType: EPageStoreType;
};

export const PageActions: React.FC<Props> = observer((props) => {
  const { extraOptions, optionsOrder, page, parentRef, storeType } = props;
  // states
  const [deletePageModal, setDeletePageModal] = useState(false);
  const [movePageModal, setMovePageModal] = useState(false);
  const [addToFolderModal, setAddToFolderModal] = useState(false);
  // params
  const { workspaceSlug } = useParams();
  // page flag
  const { isMovePageEnabled } = usePageFlag({
    workspaceSlug: workspaceSlug?.toString() ?? "",
  });
  // page operations
  const { pageOperations } = usePageOperations({
    page,
  });
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
  const MENU_ITEMS: (any & { key: TPageActions })[] = useMemo(() => {
    const menuItems: (any & { key: TPageActions })[] = [
      {
        key: "toggle-lock",
        action: pageOperations.toggleLock,
        title: is_locked ? "Unlock" : "Lock",
        icon: is_locked ? LockKeyholeOpen : LockKeyhole,
        shouldRender: canCurrentUserLockPage,
      },
      {
        key: "toggle-access",
        action: pageOperations.toggleAccess,
        title: access === EPageAccess.PUBLIC ? "Make private" : "Make public",
        icon: access === EPageAccess.PUBLIC ? Lock : Globe2,
        shouldRender: canCurrentUserChangeAccess && !archived_at,
      },
      {
        key: "add-to-folder",
        action: () => setAddToFolderModal(true),
        title: "Add to folder",
        icon: FolderPlus,
        shouldRender: !archived_at,
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
        title: archived_at ? "Restore" : "Archive",
        icon: archived_at ? ArchiveRestoreIcon : Archive,
        shouldRender: canCurrentUserArchivePage,
      },
      {
        key: "delete",
        action: () => setDeletePageModal(true),
        title: "Delete",
        icon: Trash2,
        shouldRender: canCurrentUserDeletePage && !!archived_at,
      },
      {
        key: "move",
        action: () => setMovePageModal(true),
        title: "Move",
        icon: FileOutput,
        shouldRender: canCurrentUserMovePage && isMovePageEnabled,
      },
    ];
    if (extraOptions) {
      menuItems.push(...extraOptions);
    }
    return menuItems;
  }, [
    access,
    archived_at,
    extraOptions,
    is_locked,
    isMovePageEnabled,
    canCurrentUserArchivePage,
    canCurrentUserChangeAccess,
    canCurrentUserDeletePage,
    canCurrentUserDuplicatePage,
    canCurrentUserLockPage,
    canCurrentUserMovePage,
    pageOperations,
  ]);
  // arrange options
  const arrangedOptions = useMemo(
    () =>
      optionsOrder.map((key) => MENU_ITEMS.find((item) => item.key === key)).filter((item) => !!item) as (any & {
        key: TPageActions;
      })[],
    [optionsOrder, MENU_ITEMS]
  );

  return (
    <>
      <MovePageModal isOpen={movePageModal} onClose={() => setMovePageModal(false)} page={page} />
      <DeletePageModal
        isOpen={deletePageModal}
        onClose={() => setDeletePageModal(false)}
        page={page}
        storeType={storeType}
      />
      <AddToFolderModal isOpen={addToFolderModal} onClose={() => setAddToFolderModal(false)} pageId={page.id || ""} />
      {/* Context menu and custom menu would be implemented here */}
    </>
  );
});
