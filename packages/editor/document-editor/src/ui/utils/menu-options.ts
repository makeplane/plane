import { Editor } from "@tiptap/react"
import { ArchiveIcon, ClipboardIcon, Copy, Link, Lock, XCircle } from "lucide-react"
import { NextRouter } from "next/router"
import { IVerticalDropdownItemProps } from "../components/vertical-dropdown-menu"
import { IDuplicationConfig, IPageArchiveConfig, IPageLockConfig } from "../types/menu-actions"
import { copyMarkdownToClipboard, CopyPageLink } from "./menu-actions"

export interface MenuOptionsProps{
	editor: Editor,
	router: NextRouter,
	duplicationConfig: IDuplicationConfig | undefined,
	pageLockConfig: IPageLockConfig | undefined,
	pageArchiveConfig: IPageArchiveConfig | undefined
}

export const getMenuOptions = ({ editor, router, duplicationConfig, pageLockConfig, pageArchiveConfig } : MenuOptionsProps) => {

  const KanbanMenuOptions: IVerticalDropdownItemProps[] = [
    {
      type: "copy_markdown",
      Icon: ClipboardIcon,
      action: () => copyMarkdownToClipboard(editor),
      label: "Copy Markdown"
    },
    {
      type: "close_page",
      Icon: XCircle,
      action: () => router.back(),
      label: "Close the page"
    },
    {
      type: "copy_page_link",
      Icon: Link,
      action: () => CopyPageLink(),
      label: "Copy Page Link"
    },
  ]

  // If duplicateConfig is given, page duplication will be allowed
  if (duplicationConfig) {
    KanbanMenuOptions.push({
      type: "duplicate_page",
      Icon: Copy,
      action: duplicationConfig.action,
      label: "Make a copy"
    })
  }
  // If Lock Configuration is given then, lock page option will be available in the kanban menu
  if (pageLockConfig) {
    KanbanMenuOptions.push({
      type: "lock_page",
      Icon: Lock,
      label: "Lock Page",
      action: pageLockConfig.action
    })
  }

  // Archiving will be visible in the menu bar config once the pageArchiveConfig is given.
  if (pageArchiveConfig) {
    KanbanMenuOptions.push({
      type: "archive_page",
      Icon: ArchiveIcon,
      label: "Archive Page",
      action: pageArchiveConfig.action,
    })
  }

	return KanbanMenuOptions
}
