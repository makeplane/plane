import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ArchiveRestoreIcon, LockKeyhole, LockKeyholeOpen, ArchiveIcon } from "lucide-react";
import { AlertModalCore, TContextMenuItem } from "@plane/ui";
import { TPageActions } from "@/components/pages";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { TPageOperations } from "@/hooks/use-page-operations";

// components
import { LockPageModal } from "@/plane-web/components/pages";

// hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

// store types
import { TPageInstance } from "@/store/pages/base-page";

export const usePageActionsMenu = (props: {
  page: TPageInstance;
  storeType: EPageStoreType;
  pageOperations: TPageOperations;
}) => {
  const { page, storeType, pageOperations } = props;
  const { getPageById, getOrFetchPageInstance, isNestedPagesEnabled } = usePageStore(storeType);
  // states
  const [lockPageModal, setLockPageModal] = useState(false);
  const [restorePageModal, setRestorePageModal] = useState(false);

  // params
  const { workspaceSlug } = useParams();

  const router = useAppRouter();

  // derived values
  const { is_locked, archived_at, canCurrentUserLockPage, editorRef } = page;

  // Custom menu items
  const customMenuItems: (TContextMenuItem & { key: TPageActions })[] = [
    {
      key: "toggle-lock",
      action: () =>
        isNestedPagesEnabled(workspaceSlug.toString())
          ? setLockPageModal(true)
          : pageOperations.toggleLock({ recursive: false }),
      title: is_locked ? "Unlock" : "Lock",
      icon: is_locked ? LockKeyholeOpen : LockKeyhole,
      shouldRender: canCurrentUserLockPage,
    },
    {
      key: "archive-restore",
      action: () => {
        if (isNestedPagesEnabled(workspaceSlug.toString()) && page?.parent_id && page?.archived_at) {
          const parentPageInstance = getPageById(page?.parent_id);
          if (parentPageInstance?.archived_at) {
            setRestorePageModal(true);
            return;
          }
        }
        return pageOperations.toggleArchive();
      },
      title: archived_at ? "Restore" : "Archive",
      icon: archived_at ? ArchiveRestoreIcon : ArchiveIcon,
      shouldRender: page.canCurrentUserArchivePage,
    },
  ];

  // Modal components
  const ModalsComponent = observer(() => (
    <>
      <LockPageModal
        editorRef={editorRef}
        page={page}
        setLockPageModal={setLockPageModal}
        lockPageModal={lockPageModal}
      />
      <AlertModalCore
        variant="primary"
        isOpen={restorePageModal}
        handleClose={() => setRestorePageModal(false)}
        handleSubmit={async () => {
          setRestorePageModal(false);
          async function findLastArchivedParent(page: TPageInstance): Promise<TPageInstance | undefined> {
            let currentPage: TPageInstance | undefined = page;
            let lastArchivedParent: TPageInstance | undefined = undefined;
            // Traverse up the parent chain until we reach the root
            while (currentPage?.parent_id) {
              // Get the parent page
              currentPage = (await getOrFetchPageInstance({ pageId: currentPage.parent_id })) as TPageInstance;
              // If we found an archived parent, remember it
              if (currentPage?.archived_at) {
                lastArchivedParent = currentPage;
              }
              // If we've reached the root, stop traversing
              if (currentPage?.parent_id == null) {
                break;
              }
            }
            return lastArchivedParent;
          }
          const lastArchivedParent = await findLastArchivedParent(page);
          if (lastArchivedParent?.getRedirectionLink) {
            router.push(lastArchivedParent.getRedirectionLink());
          } else if (page?.parent_id) {
            const parentPageInstance = getPageById(page.parent_id);
            if (parentPageInstance?.getRedirectionLink) {
              router.push(parentPageInstance.getRedirectionLink());
            }
          }
        }}
        isSubmitting={false}
        title={`You can't restore this page.`}
        content={`Restore the parent this page is nested in or make this page a parent.`}
        primaryButtonText={{
          loading: "Redirecting...",
          default: "Go to parent page",
        }}
        secondaryButtonText="Cancel"
      />
    </>
  ));

  return {
    customMenuItems,
    ModalsComponent,
  };
};
