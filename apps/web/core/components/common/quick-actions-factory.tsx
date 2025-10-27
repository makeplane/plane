import {
  Pencil,
  ExternalLink,
  Link,
  Trash2,
  ArchiveRestoreIcon,
  StopCircle,
  Download,
  Lock,
  LockOpen,
} from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { ArchiveIcon } from "@plane/propel/icons";
import type { TContextMenuItem } from "@plane/ui";

/**
 * Unified factory for creating menu items across all entities (cycles, modules, views, epics)
 * Contains ALL menu item creators including EE-specific ones
 */
export const useQuickActionsFactory = () => {
  const { t } = useTranslation();

  return {
    // Common menu items
    createEditMenuItem: (handler: () => void, shouldRender: boolean = true): TContextMenuItem => ({
      key: "edit",
      title: t("edit"),
      icon: Pencil,
      action: handler,
      shouldRender,
    }),

    createOpenInNewTabMenuItem: (handler: () => void): TContextMenuItem => ({
      key: "open-new-tab",
      title: t("open_in_new_tab"),
      icon: ExternalLink,
      action: handler,
    }),

    createCopyLinkMenuItem: (handler: () => void): TContextMenuItem => ({
      key: "copy-link",
      title: t("copy_link"),
      icon: Link,
      action: handler,
    }),

    createArchiveMenuItem: (
      handler: () => void,
      opts: { shouldRender?: boolean; disabled?: boolean; description?: string }
    ): TContextMenuItem => ({
      key: "archive",
      title: t("archive"),
      icon: ArchiveIcon,
      action: handler,
      className: "items-start",
      iconClassName: "mt-1",
      description: opts.description,
      disabled: opts.disabled,
      shouldRender: opts.shouldRender,
    }),

    createRestoreMenuItem: (handler: () => void, shouldRender: boolean = true): TContextMenuItem => ({
      key: "restore",
      title: t("restore"),
      icon: ArchiveRestoreIcon,
      action: handler,
      shouldRender,
    }),

    createDeleteMenuItem: (handler: () => void, shouldRender: boolean = true): TContextMenuItem => ({
      key: "delete",
      title: t("delete"),
      icon: Trash2,
      action: handler,
      shouldRender,
    }),

    // EE-specific menu items (defined in core but used only in EE)
    createEndCycleMenuItem: (handler: () => void, shouldRender: boolean = true): TContextMenuItem => ({
      key: "end-cycle",
      title: "End Cycle",
      icon: StopCircle,
      action: handler,
      shouldRender,
    }),

    createExportMenuItem: (handler: () => void, shouldRender: boolean = true): TContextMenuItem => ({
      key: "export",
      title: "Export",
      icon: Download,
      action: handler,
      shouldRender,
    }),

    createLockMenuItem: (
      handler: () => void,
      opts: { isLocked: boolean; shouldRender?: boolean }
    ): TContextMenuItem => ({
      key: "toggle-lock",
      title: opts.isLocked ? "Unlock" : "Lock",
      icon: opts.isLocked ? LockOpen : Lock,
      action: handler,
      shouldRender: opts.shouldRender,
    }),

    // Layout-level actions (for issues/epics list views)
    createOpenInNewTab: (handler: () => void): TContextMenuItem => ({
      key: "open-in-new-tab",
      title: "Open in new tab",
      icon: ExternalLink,
      action: handler,
    }),

    createCopyLayoutLinkMenuItem: (handler: () => void): TContextMenuItem => ({
      key: "copy-link",
      title: "Copy link",
      icon: Link,
      action: handler,
    }),
  };
};
