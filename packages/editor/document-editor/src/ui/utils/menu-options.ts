import { Editor } from "@tiptap/react";
import {
  Archive,
  ArchiveIcon,
  ArchiveRestoreIcon,
  ClipboardIcon,
  Copy,
  Link,
  Lock,
  Unlock,
  XCircle,
} from "lucide-react";
import { NextRouter } from "next/router";
import { IVerticalDropdownItemProps } from "../components/vertical-dropdown-menu";
import {
  IDuplicationConfig,
  IPageArchiveConfig,
  IPageLockConfig,
} from "../types/menu-actions";
import { copyMarkdownToClipboard, CopyPageLink } from "./menu-actions";

export interface MenuOptionsProps {
  editor: Editor;
  router: NextRouter;
  duplicationConfig?: IDuplicationConfig;
  pageLockConfig?: IPageLockConfig;
  pageArchiveConfig?: IPageArchiveConfig;
}

export const getMenuOptions = ({
  editor,
  router,
  duplicationConfig,
  pageLockConfig,
  pageArchiveConfig,
}: MenuOptionsProps) => {
  const KanbanMenuOptions: IVerticalDropdownItemProps[] = [
    {
      key: 1,
      type: "copy_markdown",
      Icon: ClipboardIcon,
      action: () => copyMarkdownToClipboard(editor),
      label: "Copy markdown",
    },
    // {
    //   key: 2,
    //   type: "close_page",
    //   Icon: XCircle,
    //   action: () => router.back(),
    //   label: "Close page",
    // },
    {
      key: 3,
      type: "copy_page_link",
      Icon: Link,
      action: () => CopyPageLink(),
      label: "Copy page link",
    },
  ];

  // If duplicateConfig is given, page duplication will be allowed
  if (duplicationConfig) {
    KanbanMenuOptions.push({
      key: KanbanMenuOptions.length++,
      type: "duplicate_page",
      Icon: Copy,
      action: duplicationConfig.action,
      label: "Make a copy",
    });
  }
  // If Lock Configuration is given then, lock page option will be available in the kanban menu
  if (pageLockConfig) {
    KanbanMenuOptions.push({
      key: KanbanMenuOptions.length++,
      type: pageLockConfig.is_locked ? "unlock_page" : "lock_page",
      Icon: pageLockConfig.is_locked ? Unlock : Lock,
      label: pageLockConfig.is_locked ? "Unlock page" : "Lock page",
      action: pageLockConfig.action,
    });
  }

  // Archiving will be visible in the menu bar config once the pageArchiveConfig is given.
  if (pageArchiveConfig) {
    KanbanMenuOptions.push({
      key: KanbanMenuOptions.length++,
      type: pageArchiveConfig.is_archived ? "unarchive_page" : "archive_page",
      Icon: pageArchiveConfig.is_archived ? ArchiveRestoreIcon : Archive,
      label: pageArchiveConfig.is_archived ? "Restore page" : "Archive page",
      action: pageArchiveConfig.action,
    });
  }

  return KanbanMenuOptions;
};
