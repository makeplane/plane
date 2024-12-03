"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import {
  ArchiveRestoreIcon,
  ArrowUpToLine,
  Clipboard,
  Copy,
  History,
  Link,
  Lock,
  LockOpen,
  LucideIcon,
} from "lucide-react";
// document editor
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/editor";
// ui
import { ArchiveIcon, CustomMenu, type ISvgIcons, TOAST_TYPE, ToggleSwitch, setToast } from "@plane/ui";
// components
import { ExportPageModal } from "@/components/pages";
// helpers
import { copyTextToClipboard, copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useCollaborativePageActions } from "@/hooks/use-collaborative-page-actions";
import { usePageFilters } from "@/hooks/use-page-filters";
import { useQueryParams } from "@/hooks/use-query-params";
// store
import { IPage } from "@/store/pages/page";

type Props = {
  editorRef: EditorRefApi | EditorReadOnlyRefApi | null;
  handleDuplicatePage: () => void;
  page: IPage;
};

export const PageOptionsDropdown: React.FC<Props> = observer((props) => {
  const { editorRef, handleDuplicatePage, page } = props;
  // router
  const router = useRouter();
  // store values
  const {
    name,
    archived_at,
    is_locked,
    id,
    canCurrentUserArchivePage,
    canCurrentUserDuplicatePage,
    canCurrentUserLockPage,
  } = page;
  // states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  // store hooks
  const { workspaceSlug, projectId } = useParams();
  // page filters
  const { isFullWidth, handleFullWidth } = usePageFilters();
  // update query params
  const { updateQueryParams } = useQueryParams();
  // collaborative actions
  const { executeCollaborativeAction } = useCollaborativePageActions(editorRef, page);

  // menu items list
  const MENU_ITEMS: {
    key: string;
    action: () => void;
    label: string;
    icon: LucideIcon | React.FC<ISvgIcons>;
    shouldRender: boolean;
  }[] = [
    {
      key: "copy-markdown",
      action: () => {
        if (!editorRef) return;
        copyTextToClipboard(editorRef.getMarkDown()).then(() =>
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Markdown copied to clipboard.",
          })
        );
      },
      label: "Copy markdown",
      icon: Clipboard,
      shouldRender: true,
    },
    {
      key: "copy-page-link",
      action: () => {
        const pageLink = projectId
          ? `${workspaceSlug?.toString()}/projects/${projectId?.toString()}/pages/${id}`
          : `${workspaceSlug?.toString()}/pages/${id}`;
        copyUrlToClipboard(pageLink).then(() =>
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Page link copied to clipboard.",
          })
        );
      },
      label: "Copy page link",
      icon: Link,
      shouldRender: true,
    },
    {
      key: "make-a-copy",
      action: handleDuplicatePage,
      label: "Make a copy",
      icon: Copy,
      shouldRender: canCurrentUserDuplicatePage,
    },
    {
      key: "lock-unlock-page",
      action: is_locked
        ? () => executeCollaborativeAction({ type: "sendMessageToServer", message: "unlock" })
        : () => executeCollaborativeAction({ type: "sendMessageToServer", message: "lock" }),
      label: is_locked ? "Unlock page" : "Lock page",
      icon: is_locked ? LockOpen : Lock,
      shouldRender: canCurrentUserLockPage,
    },
    {
      key: "archive-restore-page",
      action: archived_at
        ? () => executeCollaborativeAction({ type: "sendMessageToServer", message: "unarchive" })
        : () => executeCollaborativeAction({ type: "sendMessageToServer", message: "archive" }),
      label: archived_at ? "Restore page" : "Archive page",
      icon: archived_at ? ArchiveRestoreIcon : ArchiveIcon,
      shouldRender: canCurrentUserArchivePage,
    },
    {
      key: "version-history",
      action: () => {
        // add query param, version=current to the route
        const updatedRoute = updateQueryParams({
          paramsToAdd: { version: "current" },
        });
        router.push(updatedRoute);
      },
      label: "Version history",
      icon: History,
      shouldRender: true,
    },
    {
      key: "export",
      action: () => setIsExportModalOpen(true),
      label: "Export",
      icon: ArrowUpToLine,
      shouldRender: true,
    },
  ];

  return (
    <>
      <ExportPageModal
        editorRef={editorRef}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        pageTitle={name ?? ""}
      />
      <CustomMenu maxHeight="lg" placement="bottom-start" verticalEllipsis closeOnSelect>
        <CustomMenu.MenuItem
          className="hidden md:flex w-full items-center justify-between gap-2"
          onClick={() => handleFullWidth(!isFullWidth)}
        >
          Full width
          <ToggleSwitch value={isFullWidth} onChange={() => {}} />
        </CustomMenu.MenuItem>
        {MENU_ITEMS.map((item) => {
          if (!item.shouldRender) return null;
          return (
            <CustomMenu.MenuItem key={item.key} onClick={item.action} className="flex items-center gap-2">
              <item.icon className="h-3 w-3" />
              {item.label}
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
