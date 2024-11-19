"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { DocumentRealtimeEvents, TDocumentEventsClient, getServerEventName } from "@plane/editor/lib";
// ui
import { ArchiveIcon, CustomMenu, TOAST_TYPE, ToggleSwitch, setToast } from "@plane/ui";
// components
import { ExportPageModal } from "@/components/pages";
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

type ActionDetails = {
  action: () => Promise<void>;
  errorMessage: string;
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
    archive,
    lock,
    unlock,
    canCurrentUserArchivePage,
    canCurrentUserDuplicatePage,
    canCurrentUserLockPage,
    restore,
  } = page;
  // states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  // currentUserAction local state to track if the current action is being processed, a
  // local action is basically the action performed by the current user to avoid double operations
  const [currentUserAction, setCurrentUserAction] = useState<TDocumentEventsClient | null>(null);
  // store hooks
  const { workspaceSlug, projectId } = useParams();
  // page filters
  const { isFullWidth, handleFullWidth } = usePageFilters();
  // update query params
  const { updateQueryParams } = useQueryParams();

  const EVENT_ACTION_DETAILS_MAP: Record<TDocumentEventsClient, ActionDetails> = useMemo(
    () => ({
      [DocumentRealtimeEvents.Lock.client]: {
        action: lock,
        errorMessage: "Page could not be locked. Please try again later.",
      },
      [DocumentRealtimeEvents.Unlock.client]: {
        action: unlock,
        errorMessage: "Page could not be unlocked. Please try again later.",
      },
      [DocumentRealtimeEvents.Archive.client]: {
        action: archive,
        errorMessage: "Page could not be archived. Please try again later.",
      },
      [DocumentRealtimeEvents.Unarchive.client]: {
        action: restore,
        errorMessage: "Page could not be restored. Please try again later.",
      },
    }),
    [lock, unlock, archive, restore]
  );

  const handlePageAction = useCallback(
    async (actionDetails: ActionDetails, event: TDocumentEventsClient, isPerformedByCurrentUser: boolean = true) => {
      try {
        await actionDetails.action();
        if (isPerformedByCurrentUser) {
          setCurrentUserAction(event);
        }
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: actionDetails.errorMessage,
        });
      }
    },
    []
  );

  // sending the current user action to the server
  useEffect(() => {
    if (currentUserAction) {
      const serverEventName = getServerEventName(currentUserAction);
      if (serverEventName) {
        editorRef?.emitRealTimeUpdate(serverEventName);
      }
    }
  }, [currentUserAction, editorRef]);

  // this is for listening to real time updates from the live server for remote
  // users' actions
  useEffect(() => {
    const provider = editorRef?.listenToRealTimeUpdate();

    const handleStatelessMessage = (message: { payload: TDocumentEventsClient }) => {
      if (currentUserAction === message.payload) {
        setCurrentUserAction(null);
        return;
      }

      const eventActions = EVENT_ACTION_DETAILS_MAP[message.payload];
      if (eventActions) {
        handlePageAction(eventActions, message.payload, false);
      }
    };

    provider?.on("stateless", handleStatelessMessage);

    return () => {
      provider?.off("stateless", handleStatelessMessage);
    };
  }, [editorRef, currentUserAction, handlePageAction, EVENT_ACTION_DETAILS_MAP]);

  // menu items list
  const MENU_ITEMS: {
    key: string;
    action: () => void;
    label: string;
    icon: LucideIcon;
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
      // action: is_locked ? handleUnlockPage : handleLockPage,
      action: is_locked
        ? () => {
            const clientAction = DocumentRealtimeEvents["Unlock"].client;
            handlePageAction(EVENT_ACTION_DETAILS_MAP[clientAction], clientAction, true);
          }
        : () => {
            const clientAction = DocumentRealtimeEvents["Lock"].client;
            handlePageAction(EVENT_ACTION_DETAILS_MAP[clientAction], clientAction, true);
          },
      label: is_locked ? "Unlock page" : "Lock page",
      icon: is_locked ? LockOpen : Lock,
      shouldRender: canCurrentUserLockPage,
    },
    {
      key: "archive-restore-page",
      // action: archived_at ? handleRestorePage : handleArchivePage,
      action: archived_at
        ? () => {
            const clientAction = DocumentRealtimeEvents["Unarchive"].client;
            handlePageAction(EVENT_ACTION_DETAILS_MAP[clientAction], clientAction, true);
          }
        : () => {
            const clientAction = DocumentRealtimeEvents["Archive"].client;
            handlePageAction(EVENT_ACTION_DETAILS_MAP[clientAction], clientAction, true);
          },
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
