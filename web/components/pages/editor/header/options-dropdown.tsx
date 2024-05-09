import { observer } from "mobx-react";
import { ArchiveRestoreIcon, Clipboard, Copy, Link, Lock, LockOpen } from "lucide-react";
// document editor
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/document-editor";
// ui
import { ArchiveIcon, CustomMenu, TOAST_TYPE, ToggleSwitch, setToast } from "@plane/ui";
// helpers
import { copyTextToClipboard, copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useAppRouter } from "@/hooks/store";
import { usePageFilters } from "@/hooks/use-page-filters";

// store
import { IPageStore } from "@/store/pages/page.store";

type Props = {
  editorRef: EditorRefApi | EditorReadOnlyRefApi | null;
  handleDuplicatePage: () => void;
  pageStore: IPageStore;
};

export const PageOptionsDropdown: React.FC<Props> = observer((props) => {
  const { editorRef, handleDuplicatePage, pageStore } = props;
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
  } = pageStore;
  // store hooks
  const { workspaceSlug, projectId } = useAppRouter();
  // page filters
  const { isFullWidth, handleFullWidth } = usePageFilters();
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
  const MENU_ITEMS: {
    key: string;
    action: () => void;
    label: string;
    icon: React.FC<any>;
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
        copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/pages/${id}`).then(() =>
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
  ];

  return (
    <CustomMenu maxHeight="md" placement="bottom-start" verticalEllipsis closeOnSelect>
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
