import { useState } from "react";
import { observer } from "mobx-react";
import { Clipboard, Copy, History, Link, Lock } from "lucide-react";
// document editor
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/document-editor";
// ui
import { ArchiveIcon, CustomMenu, TOAST_TYPE, ToggleSwitch, setToast } from "@plane/ui";
// components
import { PageEditHistoryModal } from "@/components/pages";
// helpers
import { copyTextToClipboard, copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useApplication } from "@/hooks/store";
// store
import { IPageStore } from "@/store/pages/page.store";

type Props = {
  editorRef: EditorRefApi | EditorReadOnlyRefApi | null;
  handleDuplicatePage: () => void;
  pageStore: IPageStore;
};

type TMenuItems = {
  key: string;
  action: () => void;
  label: string;
  icon: React.FC<any>;
  shouldRender: boolean;
};

export const PageOptionsDropdown: React.FC<Props> = observer((props) => {
  const { editorRef, handleDuplicatePage, pageStore } = props;
  // states
  const [editHistoryModal, setEditHistoryModal] = useState(false);
  // store values
  const {
    archive,
    lock,
    unlock,
    canCurrentUserArchivePage,
    canCurrentUserDuplicatePage,
    canCurrentUserLockPage,
    restore,
    view_props,
    updateViewProps,
  } = pageStore;
  // store hooks
  const {
    router: { workspaceSlug, projectId },
  } = useApplication();

  const handleArchivePage = async () =>
    await archive().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Page could not be archived. Please try again later.",
      })
    );

  const handleRestorePage = async () =>
    await restore().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Page could not be restored. Please try again later.",
      })
    );

  const handleLockPage = async () =>
    await lock().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Page could not be locked. Please try again later.",
      })
    );

  const handleUnlockPage = async () =>
    await unlock().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Page could not be unlocked. Please try again later.",
      })
    );

  // menu items list
  const PAGE_ACTIONS: TMenuItems[] = [
    {
      key: "copy-markdown",
      action: () => {
        if (!editorRef) return;
        copyTextToClipboard(editorRef.getMarkDown()).then(() =>
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Successful!",
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
        copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/pages/${pageStore.id}`).then(() =>
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Successful!",
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
      key: "lock-page",
      action: handleLockPage,
      label: "Lock page",
      icon: Lock,
      shouldRender: !pageStore.is_locked && canCurrentUserLockPage,
    },
    {
      key: "unlock-page",
      action: handleUnlockPage,
      label: "Unlock page",
      icon: Lock,
      shouldRender: pageStore.is_locked && canCurrentUserLockPage,
    },
    {
      key: "archive-page",
      action: handleArchivePage,
      label: "Archive page",
      icon: ArchiveIcon,
      shouldRender: !pageStore.archived_at && canCurrentUserArchivePage,
    },
    {
      key: "restore-page",
      action: handleRestorePage,
      label: "Restore page",
      icon: ArchiveIcon,
      shouldRender: !!pageStore.archived_at && canCurrentUserArchivePage,
    },
  ];

  const EXTRA_OPTIONS: TMenuItems[] = [
    {
      key: "edit-history",
      action: () => setEditHistoryModal(true),
      label: "View edit history",
      icon: History,
      shouldRender: true,
    },
  ];

  return (
    <>
      <PageEditHistoryModal isOpen={editHistoryModal} onClose={() => setEditHistoryModal(false)} />
      <CustomMenu maxHeight="lg" placement="bottom-start" verticalEllipsis closeOnSelect>
        <CustomMenu.MenuItem
          className="flex w-full items-center justify-between gap-2"
          onClick={() =>
            updateViewProps({
              full_width: !view_props?.full_width,
            })
          }
        >
          Full width
          <ToggleSwitch value={!!view_props?.full_width} onChange={() => {}} />
        </CustomMenu.MenuItem>
        <hr className="my-2 border-custom-border-200" />
        {PAGE_ACTIONS.map((item) => {
          if (!item.shouldRender) return null;
          return (
            <CustomMenu.MenuItem key={item.key} onClick={item.action} className="flex items-center gap-2">
              <item.icon className="h-3 w-3" />
              <span>{item.label}</span>
            </CustomMenu.MenuItem>
          );
        })}
        <hr className="my-2 border-custom-border-200" />
        {EXTRA_OPTIONS.map((item) => {
          if (!item.shouldRender) return null;
          return (
            <CustomMenu.MenuItem key={item.key} onClick={item.action} className="flex items-center gap-2">
              <item.icon className="h-3 w-3" />
              <span>{item.label}</span>
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
