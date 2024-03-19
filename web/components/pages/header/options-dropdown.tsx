import { observer } from "mobx-react";
import { Clipboard, Copy, Link, Lock } from "lucide-react";
// hooks
import { useApplication, useUser } from "hooks/store";
import { useProjectPages } from "hooks/store/use-project-specific-pages";
// ui
import { ArchiveIcon, CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
// types
import { IPageStore } from "store/page.store";
import { IPage } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";

type Props = {
  pageStore: IPageStore;
};

export const PageOptionsDropdown: React.FC<Props> = observer((props) => {
  const { pageStore } = props;
  // store values
  const { lockPage, unlockPage, owned_by } = pageStore;
  // store hooks
  const {
    router: { workspaceSlug, projectId },
  } = useApplication();
  const {
    currentUser,
    membership: { currentProjectRole },
  } = useUser();
  const { archivePage, createPage, restorePage } = useProjectPages();

  const handleCreatePage = async (payload: Partial<IPage>) => {
    if (!workspaceSlug || !projectId) return;
    await createPage(workspaceSlug.toString(), projectId.toString(), payload);
  };

  const handleDuplicatePage = async () => {
    const currentPageValues = getValues();

    if (!currentPageValues?.description_html) {
      // TODO: We need to get latest data the above variable will give us stale data
      currentPageValues.description_html = pageStore.description_html;
    }

    const formData: Partial<IPage> = {
      name: "Copy of " + pageStore.name,
      description_html: currentPageValues.description_html,
    };

    try {
      await handleCreatePage(formData);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Page could not be duplicated. Please try again later.",
      });
    }
  };

  const handleArchivePage = async () => {
    if (!workspaceSlug || !projectId) return;
    try {
      await archivePage(workspaceSlug.toString(), projectId.toString(), pageStore.id);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Page could not be archived. Please try again later.",
      });
    }
  };

  const handleRestorePage = async () => {
    if (!workspaceSlug || !projectId) return;
    try {
      await restorePage(workspaceSlug.toString(), projectId.toString(), pageStore.id);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Page could not be restored. Please try again later.",
      });
    }
  };

  const handleLockPage = async () => {
    try {
      await lockPage();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Page could not be locked. Please try again later.",
      });
    }
  };

  const handleUnlockPage = async () => {
    try {
      await unlockPage();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Page could not be unlocked. Please try again later.",
      });
    }
  };

  // auth
  const isCurrentUserOwner = owned_by === currentUser?.id;
  const canUserDuplicate = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  const canUserArchive = isCurrentUserOwner || currentProjectRole === EUserProjectRoles.ADMIN;
  const canUserLock = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
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
      action: () => {},
      label: "Copy markdown",
      icon: Clipboard,
      shouldRender: true,
    },
    {
      key: "copy-page-;ink",
      action: () => {},
      label: "Copy page link",
      icon: Link,
      shouldRender: true,
    },
    {
      key: "make-a-copy",
      action: handleDuplicatePage,
      label: "Make a copy",
      icon: Copy,
      shouldRender: canUserDuplicate,
    },
    {
      key: "lock-page",
      action: handleLockPage,
      label: "Lock page",
      icon: Lock,
      shouldRender: !pageStore.is_locked && canUserLock,
    },
    {
      key: "unlock-page",
      action: handleUnlockPage,
      label: "Unlock page",
      icon: Lock,
      shouldRender: pageStore.is_locked && canUserLock,
    },
    {
      key: "archive-page",
      action: handleArchivePage,
      label: "Archive page",
      icon: ArchiveIcon,
      shouldRender: !pageStore.archived_at && canUserArchive,
    },
    {
      key: "restore-page",
      action: handleRestorePage,
      label: "Restore page",
      icon: ArchiveIcon,
      shouldRender: !!pageStore.archived_at && canUserArchive,
    },
  ];

  return (
    <CustomMenu maxHeight="md" placement="bottom-start" verticalEllipsis closeOnSelect>
      {MENU_ITEMS.map((item) => {
        if (!item.shouldRender) return null;
        return (
          <CustomMenu.MenuItem key={item.key} onClick={item.action} className="flex items-center gap-2">
            <item.icon className="h-3 w-3" />
            <div className="text-custom-text-300">{item.label}</div>
          </CustomMenu.MenuItem>
        );
      })}
    </CustomMenu>
  );
});
