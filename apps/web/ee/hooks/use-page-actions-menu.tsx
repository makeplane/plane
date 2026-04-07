/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { ArchiveRestoreIcon, FolderX, LockKeyhole, LockKeyholeOpen, ArchiveIcon } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TContextMenuItem } from "@plane/ui";
import { AlertModalCore } from "@plane/ui";
// components
import type { TPageActions } from "@/components/pages/dropdowns";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import type { TPageOperations } from "@/hooks/use-page-operations";
// plane web imports
import { LockPageModal } from "@/plane-web/components/pages";
import type { EPageStoreType } from "@/plane-web/hooks/store";
import { useCollection, usePageStore } from "@/plane-web/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";
import { resolveWikiCollectionId } from "@/plane-web/components/pages/collections";

export const usePageActionsMenu = (props: {
  page: TPageInstance;
  storeType: EPageStoreType;
  pageOperations: TPageOperations;
}) => {
  const { page, storeType, pageOperations } = props;
  const { t } = useTranslation();
  const { getPageById, getOrFetchPageInstance, isNestedPagesEnabled } = usePageStore(storeType);
  const collectionStore = useCollection();
  // states
  const [lockPageModal, setLockPageModal] = useState(false);
  const [restorePageModal, setRestorePageModal] = useState(false);

  // params
  const { workspaceSlug, collectionId } = useParams();
  const pathname = usePathname();

  const router = useAppRouter();

  // derived values
  const { is_locked, archived_at, canCurrentUserLockPage } = page;
  const resolvedCollectionId = resolveWikiCollectionId(pathname, collectionId?.toString());
  const actualCollectionId =
    resolvedCollectionId && resolvedCollectionId !== "general" ? resolvedCollectionId : undefined;

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
    {
      key: "remove-from-collection",
      action: async () => {
        if (!workspaceSlug || !actualCollectionId || !page.id) return;

        try {
          await collectionStore.removePageFromCollection(workspaceSlug.toString(), page.id, actualCollectionId);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("common.success"),
            message: t("page_actions.remove_from_collection.success_message"),
          });
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("common.error.label"),
            message:
              (error as { detail?: string; error?: string })?.detail ??
              (error as { error?: string })?.error ??
              t("page_actions.remove_from_collection.error_message"),
          });
        }
      },
      title: t("page_actions.remove_from_collection.label"),
      icon: FolderX,
      shouldRender:
        !!actualCollectionId &&
        !!page.id &&
        collectionStore.canCurrentUserRemovePageFromCollection(actualCollectionId, page.id),
      className: "text-danger-primary",
    },
  ];

  // Modal components
  const ModalsComponent = observer(function ModalsComponent() {
    return (
      <>
        <LockPageModal page={page} setLockPageModal={setLockPageModal} lockPageModal={lockPageModal} />
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
                currentPage = (await getOrFetchPageInstance({
                  pageId: currentPage.parent_id,
                  trackVisit: false,
                })) as TPageInstance;
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
    );
  });

  return {
    customMenuItems,
    ModalsComponent,
  };
};
