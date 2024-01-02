import { Editor } from "@tiptap/react";
import { Archive, ArchiveRestoreIcon, ClipboardIcon, Copy, Link, Lock, Unlock } from "lucide-react";
import { NextRouter } from "next/router";
import { IVerticalDropdownItemProps } from "src/ui/components/vertical-dropdown-menu";
import { IDuplicationConfig, IPageArchiveConfig, IPageLockConfig } from "src/types/menu-actions";
import { copyMarkdownToClipboard, CopyPageLink } from "src/utils/menu-actions";

export interface MenuOptionsProps {
  editor: Editor;
  router: NextRouter;
  duplicationConfig?: IDuplicationConfig;
  pageLockConfig?: IPageLockConfig;
  pageArchiveConfig?: IPageArchiveConfig;
  onActionCompleteHandler: (action: {
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }) => void;
}

export const getMenuOptions = ({
  editor,
  router,
  duplicationConfig,
  pageLockConfig,
  pageArchiveConfig,
  onActionCompleteHandler,
}: MenuOptionsProps) => {
  const KanbanMenuOptions: IVerticalDropdownItemProps[] = [
    {
      key: 1,
      type: "copy_markdown",
      Icon: ClipboardIcon,
      action: () => {
        onActionCompleteHandler({
          title: "Markdown Copied",
          message: "Page Copied as Markdown",
          type: "success",
        });
        copyMarkdownToClipboard(editor);
      },
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
      action: () => {
        onActionCompleteHandler({
          title: "Link Copied",
          message: "Link to the page has been copied to clipboard",
          type: "success",
        });
        CopyPageLink();
      },
      label: "Copy page link",
    },
  ];

  // If duplicateConfig is given, page duplication will be allowed
  if (duplicationConfig) {
    KanbanMenuOptions.push({
      key: KanbanMenuOptions.length++,
      type: "duplicate_page",
      Icon: Copy,
      action: () => {
        duplicationConfig
          .action()
          .then(() => {
            onActionCompleteHandler({
              title: "Page Copied",
              message: "Page has been copied as 'Copy of' followed by page title",
              type: "success",
            });
          })
          .catch(() => {
            onActionCompleteHandler({
              title: "Copy Failed",
              message: "Sorry, page cannot be copied, please try again later.",
              type: "error",
            });
          });
      },
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
      action: () => {
        const state = pageLockConfig.is_locked ? "Unlocked" : "Locked";
        pageLockConfig
          .action()
          .then(() => {
            onActionCompleteHandler({
              title: `Page ${state}`,
              message: `Page has been ${state}, no one will be able to change the state of lock except you.`,
              type: "success",
            });
          })
          .catch(() => {
            onActionCompleteHandler({
              title: `Page cannot be ${state}`,
              message: `Sorry, page cannot be ${state}, please try again later`,
              type: "error",
            });
          });
      },
    });
  }

  // Archiving will be visible in the menu bar config once the pageArchiveConfig is given.
  if (pageArchiveConfig) {
    KanbanMenuOptions.push({
      key: KanbanMenuOptions.length++,
      type: pageArchiveConfig.is_archived ? "unarchive_page" : "archive_page",
      Icon: pageArchiveConfig.is_archived ? ArchiveRestoreIcon : Archive,
      label: pageArchiveConfig.is_archived ? "Restore page" : "Archive page",
      action: () => {
        const state = pageArchiveConfig.is_archived ? "Unarchived" : "Archived";
        pageArchiveConfig
          .action()
          .then(() => {
            onActionCompleteHandler({
              title: `Page ${state}`,
              message: `Page has been ${state}, you can checkout all archived tab and can restore the page later.`,
              type: "success",
            });
          })
          .catch(() => {
            onActionCompleteHandler({
              title: `Page cannot be ${state}`,
              message: `Sorry, page cannot be ${state}, please try again later.`,
              type: "success",
            });
          });
      },
    });
  }

  return KanbanMenuOptions;
};
