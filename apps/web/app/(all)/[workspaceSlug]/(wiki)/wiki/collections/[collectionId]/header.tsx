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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
import { Book, Ellipsis } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { PageIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EPageAccess } from "@plane/types";
import type { TLogoProps, TPage } from "@plane/types";
import { Breadcrumbs, Header } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { PageSearchInput } from "@/components/pages/list/search-input";
import { useAppRouter } from "@/hooks/use-app-router";
import { CollectionContextMenu } from "@/plane-web/components/pages/sidebar/collection";
import { AddExistingPageModal, CollectionAddPageMenu } from "@/plane-web/components/pages/sidebar/section";
import { EPageStoreType, useCollection, usePageStore } from "@/plane-web/hooks/store";
import {
  DEFAULT_WIKI_COLLECTION,
  DefaultWikiCollectionIcon,
  getPredefinedWikiCollection,
  isPredefinedWikiCollection,
  PREDEFINED_WIKI_COLLECTION_TRANSLATION_KEYS,
  resolveWikiCollectionId,
} from "@/plane-web/components/pages/collections";

export const CollectionPageTypeHeader = observer(function CollectionPageTypeHeader() {
  const [isAddExistingPageModalOpen, setIsAddExistingPageModalOpen] = useState(false);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const { workspaceSlug, collectionId } = useParams();
  const pathname = usePathname();
  const router = useAppRouter();
  const collectionStore = useCollection();
  const { t } = useTranslation();
  const { createPage, filters, updateFilters, clearAllFilters } = usePageStore(EPageStoreType.WORKSPACE);
  const resolvedCollectionId = resolveWikiCollectionId(pathname, collectionId?.toString());
  const predefinedCollection = getPredefinedWikiCollection(resolvedCollectionId);
  const isGeneralCollection = resolvedCollectionId === DEFAULT_WIKI_COLLECTION.slug;
  const isPredefinedNonGeneral = isPredefinedWikiCollection(resolvedCollectionId) && !isGeneralCollection;
  const actualCollectionId = isGeneralCollection ? collectionStore.defaultCollectionId : resolvedCollectionId;

  useEffect(() => {
    updateFilters("searchQuery", "");
    clearAllFilters();
  }, [pathname, updateFilters, clearAllFilters]);

  const handleCreatePage = async () => {
    if (!workspaceSlug || isCreatingPage) return;

    setIsCreatingPage(true);
    const payload: Partial<TPage> = {
      access: predefinedCollection?.pageStoreType === "private" ? EPageAccess.PRIVATE : EPageAccess.PUBLIC,
    };

    try {
      const res = await createPage(payload);
      router.push(`/${workspaceSlug.toString()}/wiki/${res?.id}`);
    } catch (err: unknown) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message:
          (err as { data?: { error?: string } } | undefined)?.data?.error ||
          t("wiki_collections.toasts.create_page_error"),
      });
    } finally {
      setIsCreatingPage(false);
    }
  };

  const { isLoading: isLoadingCollections } = useSWR(
    workspaceSlug ? ["workspace-collections", workspaceSlug.toString()] : null,
    workspaceSlug ? () => collectionStore.fetchCollections(workspaceSlug.toString()) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (!workspaceSlug || !isGeneralCollection || isLoadingCollections || collectionStore.defaultCollectionId) return;

    router.replace(`/${workspaceSlug.toString()}/wiki`);
  }, [collectionStore.defaultCollectionId, isGeneralCollection, isLoadingCollections, router, workspaceSlug]);

  useEffect(() => {
    if (isLoadingCollections || !actualCollectionId || isGeneralCollection) return;
    const collection = collectionStore.getCollectionById(actualCollectionId);
    if (!collection) {
      router.replace(`/${workspaceSlug.toString()}/wiki`);
    }
  }, [actualCollectionId, collectionStore, isGeneralCollection, isLoadingCollections, router, workspaceSlug]);

  if (isGeneralCollection && !isLoadingCollections && !collectionStore.defaultCollectionId) {
    return null;
  }

  const collection =
    actualCollectionId && !isGeneralCollection
      ? collectionStore.getCollectionById(actualCollectionId)?.asJSON
      : undefined;
  const collectionLogoProps = collection?.logo_props as TLogoProps | undefined;
  const collectionName = isGeneralCollection
    ? DEFAULT_WIKI_COLLECTION.displayName
    : resolvedCollectionId && isPredefinedWikiCollection(resolvedCollectionId)
      ? t(PREDEFINED_WIKI_COLLECTION_TRANSLATION_KEYS[resolvedCollectionId])
      : collection?.name || t("wiki_collections.fallback_name");

  return (
    <>
      <Header>
        <Header.LeftItem>
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  href={`/${workspaceSlug?.toString() ?? ""}/wiki/collections/${DEFAULT_WIKI_COLLECTION.slug}`}
                  label={t("common.pages")}
                  icon={<PageIcon className="size-4 text-tertiary" />}
                />
              }
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={collectionName}
                  icon={
                    collectionLogoProps?.in_use ? (
                      <Logo logo={collectionLogoProps} size={14} type="lucide" />
                    ) : isGeneralCollection ? (
                      <DefaultWikiCollectionIcon className="size-3.5 text-tertiary" />
                    ) : (
                      <Book className="size-3.5 text-tertiary" />
                    )
                  }
                />
              }
            />
          </Breadcrumbs>
        </Header.LeftItem>
        <Header.RightItem className="flex h-full items-center gap-2 self-end">
          <PageSearchInput
            searchQuery={filters.searchQuery}
            updateSearchQuery={(value) => updateFilters("searchQuery", value)}
          />
          {isPredefinedNonGeneral ? (
            <Button variant="primary" size="base" onClick={() => void handleCreatePage()} loading={isCreatingPage}>
              {isCreatingPage ? t("common.adding") : t("wiki_collections.header.add_page")}
            </Button>
          ) : (
            <CollectionAddPageMenu
              workspaceSlug={workspaceSlug?.toString() ?? ""}
              targetCollectionId={actualCollectionId ?? undefined}
              showAddExisting={!!actualCollectionId}
              onOpenAddExisting={actualCollectionId ? () => setIsAddExistingPageModalOpen(true) : undefined}
              buttonType="header"
            />
          )}
          {collection && workspaceSlug && (
            <CollectionContextMenu
              collection={collection}
              workspaceSlug={workspaceSlug.toString()}
              customButton={
                <IconButton
                  variant="secondary"
                  size="lg"
                  icon={Ellipsis}
                  aria-label={t("wiki_collections.menu.collection_options")}
                />
              }
            />
          )}
        </Header.RightItem>
      </Header>
      {actualCollectionId && workspaceSlug && (
        <AddExistingPageModal
          isOpen={isAddExistingPageModalOpen}
          onClose={() => setIsAddExistingPageModalOpen(false)}
          collectionId={actualCollectionId}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
    </>
  );
});
