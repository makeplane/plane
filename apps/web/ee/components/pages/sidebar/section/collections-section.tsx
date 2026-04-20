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

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
import { Loader } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Collapsible } from "@plane/propel/collapsible";
import { ChevronRightIcon, PlusIcon } from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
import { CreateCollectionModal } from "@/components/collections";
import { COLLECTION_SWR_OPTIONS, collectionListKey } from "../../collection/swr";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { DEFAULT_WIKI_COLLECTION, DefaultWikiCollectionIcon } from "@/plane-web/components/pages/collections";
import { EPageStoreType, useCollection, usePageStore } from "@/plane-web/hooks/store";
import { AddExistingPageModal } from "./add-existing-page-modal";
import { BaseCollectionItem } from "./base-collection-item";
import { CollectionAddPageMenu } from "./collection-add-page-menu";
import { CollectionItem } from "./collection-item";
import { SidebarSectionContent, SidebarSectionHeader } from "./components/sidebar-section";

const DefaultCollectionItem = observer(function DefaultCollectionItem({
  workspaceSlug,
  isActive,
  onOpenAddExistingPage,
}: {
  workspaceSlug: string;
  isActive: boolean;
  onOpenAddExistingPage: (collectionId: string) => void;
}) {
  const router = useAppRouter();
  const collectionStore = useCollection();
  const { t } = useTranslation();
  const defaultCollectionId = collectionStore.defaultCollectionId;
  const defaultCollectionPath = `/${workspaceSlug}/wiki/collections/${DEFAULT_WIKI_COLLECTION.slug}`;

  if (!defaultCollectionId) return null;

  return (
    <BaseCollectionItem
      collectionId={defaultCollectionId}
      workspaceSlug={workspaceSlug}
      isCollectionActive={isActive}
      label={t("wiki_collections.predefined.general")}
      onClick={() => router.push(defaultCollectionPath)}
      icon={
        <span className="grid size-5 shrink-0 place-items-center rounded-md bg-label-grey-bg">
          <DefaultWikiCollectionIcon className="size-3.5 text-label-grey-icon" />
        </span>
      }
      actions={
        <CollectionAddPageMenu
          workspaceSlug={workspaceSlug}
          targetCollectionId={defaultCollectionId}
          showAddExisting
          onOpenAddExisting={() => onOpenAddExistingPage(defaultCollectionId)}
          buttonType="icon"
        />
      }
    />
  );
});

const CollectionsSectionContent = observer(function CollectionsSectionContent() {
  const { workspaceSlug, pageId: currentPageIdParam } = useParams();
  const pathname = usePathname();
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false);
  const [addExistingPageCollectionId, setAddExistingPageCollectionId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const prefetchedBranchPageIdRef = useRef<string | null>(null);
  const wsSlug = workspaceSlug?.toString() ?? "";
  const isCollectionRoute = pathname?.includes("/wiki/collections/");
  const collectionStore = useCollection();
  const { t } = useTranslation();
  const { fetchParentPages } = usePageStore(EPageStoreType.WORKSPACE);
  const { allowPermissions } = useUserPermissions();
  const canCreateCollections = wsSlug
    ? allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.WORKSPACE, wsSlug)
    : false;

  const { isLoading: isLoadingCollections } = useSWR(
    wsSlug ? collectionListKey(wsSlug) : null,
    wsSlug ? () => collectionStore.fetchCollections(wsSlug) : null,
    COLLECTION_SWR_OPTIONS
  );
  const currentPageId = !isCollectionRoute && currentPageIdParam ? currentPageIdParam.toString() : undefined;
  const { data: parentPagesList } = useSWR(
    wsSlug && currentPageId ? ["collection-parent-pages", wsSlug, currentPageId] : null,
    wsSlug && currentPageId ? () => fetchParentPages(currentPageId) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (!wsSlug || !currentPageId || parentPagesList === undefined) return;
    if (prefetchedBranchPageIdRef.current === currentPageId) return;

    const ancestorPageIds = parentPagesList
      .map((page) => page.id)
      .filter((pageId): pageId is string => !!pageId && pageId !== currentPageId);

    void (async () => {
      const effectiveCollectionId = await collectionStore.resolveCollectionIdForPage(
        wsSlug,
        currentPageId,
        ancestorPageIds
      );
      if (effectiveCollectionId) {
        collectionStore.setCollectionExpanded(effectiveCollectionId);
        const existingExpandedPageIds = [...collectionStore.getCollectionSidebarExpandedRowIds(effectiveCollectionId)];
        const nextExpandedPageIds = [...new Set([...existingExpandedPageIds, ...ancestorPageIds])];

        if (nextExpandedPageIds.length !== existingExpandedPageIds.length) {
          collectionStore.replaceCollectionSidebarExpandedRowIds(effectiveCollectionId, nextExpandedPageIds);
        }
      }

      prefetchedBranchPageIdRef.current = currentPageId;
    })();
  }, [collectionStore, currentPageId, parentPagesList, wsSlug]);

  const customCollections = useMemo(
    () => (collectionStore.workspaceCollections ?? []).filter((collection) => !collection.is_default),
    [collectionStore.workspaceCollections]
  );
  const hasDefaultCollection = !!collectionStore.defaultCollectionId;

  return (
    <>
      <CreateCollectionModal
        isOpen={isCreateCollectionModalOpen}
        onClose={() => setIsCreateCollectionModalOpen(false)}
        workspaceSlug={wsSlug}
      />

      {addExistingPageCollectionId && (
        <AddExistingPageModal
          isOpen={!!addExistingPageCollectionId}
          onClose={() => setAddExistingPageCollectionId(null)}
          collectionId={addExistingPageCollectionId}
          workspaceSlug={wsSlug}
        />
      )}

      <div className="flex flex-col rounded-md transition-colors">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <SidebarSectionHeader
            label={t("wiki_collections.sidebar.title")}
            actions={
              <>
                {canCreateCollections && (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    icon={PlusIcon}
                    aria-label={t("wiki_collections.create_modal.submit")}
                    onClick={() => setIsCreateCollectionModalOpen(true)}
                  />
                )}
                <button
                  type="button"
                  className="grid size-5 place-items-center rounded-md hover:bg-layer-transparent-hover"
                  aria-expanded={isOpen}
                  onClick={() => setIsOpen((state) => !state)}
                >
                  <ChevronRightIcon
                    className={
                      isOpen
                        ? "size-3.5 rotate-90 transform transition-transform duration-300 ease-in-out"
                        : "size-3.5 transform transition-transform duration-300 ease-in-out"
                    }
                  />
                </button>
              </>
            }
          />

          {isOpen &&
            (isLoadingCollections && !hasDefaultCollection && customCollections.length === 0 ? (
              <div className="ml-2 mt-2 flex items-center justify-center py-3">
                <Loader className="size-4 animate-spin text-placeholder" />
                <span className="ml-2 text-13 text-placeholder">
                  {t("wiki_collections.sidebar.loading_collections")}
                </span>
              </div>
            ) : (
              <SidebarSectionContent>
                <div className="space-y-0.5">
                  {hasDefaultCollection && (
                    <DefaultCollectionItem
                      workspaceSlug={wsSlug}
                      isActive={
                        pathname.replace(/\/$/, "") === `/${wsSlug}/wiki/collections/${DEFAULT_WIKI_COLLECTION.slug}`
                      }
                      onOpenAddExistingPage={setAddExistingPageCollectionId}
                    />
                  )}

                  {customCollections.map((collection) => (
                    <CollectionItem
                      key={collection.id}
                      collection={collection}
                      workspaceSlug={wsSlug}
                      isCollectionActive={
                        pathname.replace(/\/$/, "") === `/${wsSlug}/wiki/collections/${collection.id}`
                      }
                      onOpenAddExistingPage={setAddExistingPageCollectionId}
                    />
                  ))}
                </div>
              </SidebarSectionContent>
            ))}
        </Collapsible>
      </div>
    </>
  );
});

export const CollectionsSection = memo(CollectionsSectionContent);
