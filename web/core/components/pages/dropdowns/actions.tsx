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
// constants
import { EPageAccess } from "@/constants/page";
// helpers
import { cn } from "@/helpers/common.helper";
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

export type TPageOperations = {
  toggleLock: () => void;
  toggleAccess: () => void;
  openInNewTab: () => void;
  copyLink: () => void;
  duplicate: () => void;
  toggleArchive: () => void;
};

export type TPageConfig = {
  canArchive: boolean;
  canDelete: boolean;
  canDuplicate: boolean;
  canLock: boolean;
  canMove: boolean;
  canToggleAccess: boolean;
  isArchived: boolean;
  isLocked: boolean;
  pageAccess: EPageAccess;
};

type Props = {
  extraOptions?: (TContextMenuItem & { key: TPageActions })[];
  optionsOrder: TPageActions[];
  pageConfig: TPageConfig;
  page: IPage;
  pageOperations: TPageOperations;
  parentRef?: React.RefObject<HTMLElement>;
};

export const PageActions: React.FC<Props> = observer((props) => {
  const { extraOptions, optionsOrder, pageConfig, page, pageOperations, parentRef } = props;
  // states
  const [deletePageModal, setDeletePageModal] = useState(false);
  const [movePageModal, setMovePageModal] = useState(false);

  const MENU_ITEMS: (TContextMenuItem & { key: TPageActions })[] = useMemo(
    () => [
      {
        key: "toggle-lock",
        action: pageOperations.toggleLock,
        title: pageConfig.isLocked ? "Unlock page" : "Lock page",
        icon: pageConfig.isLocked ? LockKeyholeOpen : LockKeyhole,
        shouldRender: pageConfig.canLock,
      },
      {
        key: "toggle-access",
        action: pageOperations.toggleAccess,
        title: pageConfig.pageAccess === 0 ? "Make private" : "Make public",
        icon: pageConfig.pageAccess === 0 ? Lock : Globe2,
        shouldRender: pageConfig.canToggleAccess,
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
        shouldRender: pageConfig.canDuplicate,
      },
      {
        key: "archive-restore",
        action: pageOperations.toggleArchive,
        title: pageConfig.isArchived ? "Restore" : "Archive",
        icon: pageConfig.isArchived ? ArchiveRestoreIcon : ArchiveIcon,
        shouldRender: pageConfig.canArchive,
      },
      {
        key: "delete",
        action: () => setDeletePageModal(true),
        title: "Delete",
        icon: Trash2,
        shouldRender: pageConfig.canDelete,
      },

      {
        key: "move",
        action: () => setMovePageModal(true),
        title: "Move",
        icon: FileOutput,
        shouldRender: pageConfig.canMove,
      },
    ],
    [pageConfig, pageOperations]
  );
  if (extraOptions) {
    MENU_ITEMS.push(...extraOptions);
  }
  // arrange options
  const arrangedOptions = optionsOrder
    .map((key) => MENU_ITEMS.find((item) => item.key === key))
    .filter((item) => !!item);

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
