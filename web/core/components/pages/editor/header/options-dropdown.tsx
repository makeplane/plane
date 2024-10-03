"use client";

import { useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { ArchiveRestoreIcon, Clipboard, Copy, History, Link, Lock, LockOpen, LucideIcon } from "lucide-react";
// document editor
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/editor";
import { TDocumentEventsClient } from "@plane/editor/lib";
// ui
import { ArchiveIcon, CustomMenu, ISvgIcons, TOAST_TYPE, ToggleSwitch, setToast } from "@plane/ui";
// helpers
import { copyTextToClipboard, copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
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
  // create a local state to track if the current action is being processed, a
  // local action is by the client
  const [localAction, setLocalAction] = useState<string | null>(null);

  // router
  const router = useRouter();
  // store values
  const {
    archived_at,
    is_locked,
    id,
    archive,
    lock,
    unlock,
    canCurrentUserArchivePage,
    canCurrentUserDuplicatePage,
    canCurrentUserLockPage,
    restore,
  } = page;
  // store hooks
  const { workspaceSlug, projectId } = useParams();
  // page filters
  const { isFullWidth, handleFullWidth } = usePageFilters();
  // update query params
  const { updateQueryParams } = useQueryParams();

  useEffect(() => {
    if (localAction === "archived") {
      editorRef?.emitRealTimeUpdate("Archive");
    }
    if (localAction === "unarchived") {
      editorRef?.emitRealTimeUpdate("Unarchive");
    }
    if (localAction === "locked") {
      editorRef?.emitRealTimeUpdate("Lock");
    }
    if (localAction === "unlocked") {
      editorRef?.emitRealTimeUpdate("Unlock");
    }
  }, [localAction, editorRef]);

  const handleArchivePage = useCallback(
    async (isLocal: boolean = true) => {
      await archive()
        .then(() => {
          if (isLocal) {
            setLocalAction("archived");
          }
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Page could not be archived. Please try again later.",
          });
        });
    },
    [archive]
  );

  const handleRestorePage = useCallback(
    async (isLocal: boolean = true) => {
      await restore()
        .then(() => {
          if (isLocal) {
            setLocalAction("unarchived");
          }
        })
        .catch(() =>
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Page could not be restored. Please try again later.",
          })
        );
    },
    [restore]
  );

  const handleLockPage = useCallback(
    async (isLocal: boolean = true) => {
      await lock()
        .then(() => {
          if (isLocal) {
            setLocalAction("locked");
          }
        })
        .catch(() =>
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Page could not be locked. Please try again later.",
          })
        );
    },
    [lock]
  );

  const handleUnlockPage = useCallback(
    async (isLocal: boolean = true) => {
      await unlock()
        .then(() => {
          if (isLocal) {
            setLocalAction("unlocked");
          }
        })
        .catch(() =>
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Page could not be unlocked. Please try again later.",
          })
        );
    },
    [unlock]
  );

  // listen to real time updates from the live server
  useEffect(() => {
    const provider = editorRef?.listenToRealTimeUpdate();

    const handleStatelessMessage = (message: { payload: TDocumentEventsClient }) => {
      if (localAction === message.payload) {
        setLocalAction(null);
        return;
      }

      switch (message.payload) {
        case "locked":
          handleLockPage(false);
          break;
        case "unlocked":
          handleUnlockPage(false);
          break;
        case "archived":
          handleArchivePage(false);
          break;
        case "unarchived":
          handleRestorePage(false);
          break;
      }
    };

    provider?.on("stateless", handleStatelessMessage);

    return () => {
      provider?.off("stateless", handleStatelessMessage);
    };
  }, [editorRef, localAction, handleArchivePage, handleRestorePage, handleLockPage, handleUnlockPage]);

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
      action: is_locked ? handleUnlockPage : handleLockPage,
      label: is_locked ? "Unlock page" : "Lock page",
      icon: is_locked ? LockOpen : Lock,
      shouldRender: canCurrentUserLockPage,
    },
    {
      key: "archive-restore-page",
      action: archived_at ? handleRestorePage : handleArchivePage,
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
  ];

  return (
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
  );
});
