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
} from "lucide-react";
// constants
import { EPageAccess, PROJECT_PAGE_TRACKER_ELEMENTS } from "@plane/constants";
// plane editor
import { EditorRefApi } from "@plane/editor";
// plane ui
import { ArchiveIcon, ContextMenu, CustomMenu, TContextMenuItem } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { DeletePageModal } from "@/components/pages";
// helpers
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
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
  | "move";

type Props = {
  editorRef?: EditorRefApi | null;
  extraOptions?: (TContextMenuItem & { key: TPageActions })[];
  optionsOrder: TPageActions[];
  page: TPageInstance;
  parentRef?: React.RefObject<HTMLElement>;
  storeType: EPageStoreType;
};

export const PageActions: React.FC<Props> = observer((props) => {
  const { editorRef, extraOptions, optionsOrder, page, parentRef, storeType } = props;
  // states
  const [deletePageModal, setDeletePageModal] = useState(false);
  const [movePageModal, setMovePageModal] = useState(false);
  // params
  const { workspaceSlug } = useParams();
  // page flag
  const { isMovePageEnabled } = usePageFlag({
    workspaceSlug: workspaceSlug?.toString() ?? "",
  });
  // page operations
  const { pageOperations } = usePageOperations({
    editorRef,
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
  const MENU_ITEMS: (TContextMenuItem & { key: TPageActions })[] = useMemo(() => {
    const menuItems: (TContextMenuItem & { key: TPageActions })[] = [
      {
        key: "toggle-lock",
        action: () => {
          captureClick({
            elementName: PROJECT_PAGE_TRACKER_ELEMENTS.LOCK_BUTTON,
          });
          pageOperations.toggleLock();
        },
        title: is_locked ? "Unlock" : "Lock",
        icon: is_locked ? LockKeyholeOpen : LockKeyhole,
        shouldRender: canCurrentUserLockPage,
      },
      {
        key: "toggle-access",
        action: () => {
          captureClick({
            elementName: PROJECT_PAGE_TRACKER_ELEMENTS.ACCESS_TOGGLE,
          });
          pageOperations.toggleAccess();
        },
        title: access === EPageAccess.PUBLIC ? "Make private" : "Make public",
        icon: access === EPageAccess.PUBLIC ? Lock : Globe2,
        shouldRender: canCurrentUserChangeAccess && !archived_at,
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
        action: () => {
          captureClick({
            elementName: PROJECT_PAGE_TRACKER_ELEMENTS.DUPLICATE_BUTTON,
          });
          pageOperations.duplicate();
        },
        title: "Make a copy",
        icon: Copy,
        shouldRender: canCurrentUserDuplicatePage,
      },
      {
        key: "archive-restore",
        action: () => {
          captureClick({
            elementName: PROJECT_PAGE_TRACKER_ELEMENTS.ARCHIVE_BUTTON,
          });
          pageOperations.toggleArchive();
        },
        title: archived_at ? "Restore" : "Archive",
        icon: archived_at ? ArchiveRestoreIcon : ArchiveIcon,
        shouldRender: canCurrentUserArchivePage,
      },
      {
        key: "delete",
        action: () => {
          captureClick({
            elementName: PROJECT_PAGE_TRACKER_ELEMENTS.CONTEXT_MENU,
          });
          setDeletePageModal(true);
        },
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
      optionsOrder
        .map((key) => MENU_ITEMS.find((item) => item.key === key))
        .filter((item) => !!item) as (TContextMenuItem & { key: TPageActions })[],
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
