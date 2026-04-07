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

import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { ChevronRightIcon, PageIcon } from "@plane/propel/icons";
// plane imports
import type { TPage } from "@plane/types";
// ui
import { CustomMenu, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { PageBreadcrumbItem } from "@/components/pages/editor/breadcrumb-page-item";
import { PageHeaderActions } from "@/components/pages/header/actions";
import { PageSyncingBadge } from "@/components/pages/header/syncing-badge";
// plane web components
import { CollaboratorsList, PageDetailsHeaderExtraActions } from "@/plane-web/components/pages";
// plane web hooks
import { EPageStoreType, usePage, usePageStore } from "@/plane-web/hooks/store";

const storeType = EPageStoreType.WORKSPACE;

export interface IPagesHeaderProps {
  showButton?: boolean;
}

export const PageDetailsHeader = observer(function PageDetailsHeader() {
  // params
  const { workspaceSlug, pageId } = useParams();
  const router = useRouter();
  // store hooks
  const { fetchParentPages, getPageById } = usePageStore(storeType);
  const page = usePage({
    pageId: pageId?.toString() ?? "",
    storeType,
  });

  // Always fetch parent pages to keep the cache up-to-date
  const { data: parentPagesList, isLoading: isParentPagesLoading } = useSWR(
    workspaceSlug && pageId ? `WORKSPACE_PARENT_PAGES_LIST_${pageId.toString()}` : null,
    workspaceSlug && pageId ? () => fetchParentPages(pageId.toString()) : null
  );

  const storeParentPagesList = page?.id
    ? [
        ...[...page.parentPageIds]
          .reverse()
          .map((parentPageId) => getPageById(parentPageId)?.asJSON)
          .filter((parentPage): parentPage is TPage => !!parentPage?.id),
        ...(page.asJSON?.id ? [page.asJSON] : []),
      ]
    : undefined;

  const effectiveParentPagesList = storeParentPagesList?.length ? storeParentPagesList : parentPagesList;
  const orderedParentPages = effectiveParentPagesList
    ? createOrderedParentChildArray(effectiveParentPagesList)
    : undefined;

  // Now use orderedParentPages instead of parentPagesList for your UI logic
  const isRootPage = orderedParentPages?.length === 1;
  const rootParentDetails = orderedParentPages?.[0]; // First item is the root
  const middleParents = orderedParentPages?.slice(1, -1) ?? []; // Middle items (excluding root and current)

  function BreadcrumbSeparator() {
    return (
      <div className="flex items-center px-2 text-tertiary">
        <ChevronRightIcon className="size-3" />
      </div>
    );
  }

  if (!page || !page.canCurrentUserAccessPage) return null;

  return (
    <Header>
      <Header.LeftItem>
        <div className="w-full overflow-hidden">
          <div className="flex items-center">
            <div>
              <BreadcrumbLink
                href={`/${workspaceSlug}/pages`}
                label="Pages"
                icon={<PageIcon className="size-4 text-tertiary" />}
              />
            </div>

            {isParentPagesLoading ? (
              <div className="flex items-center">
                <BreadcrumbSeparator />
                <div className="flex items-center animate-pulse">
                  <div className="h-4 w-24 bg-layer-1 rounded" />
                </div>
              </div>
            ) : (
              <>
                {!isRootPage && rootParentDetails?.id && (
                  <div className="flex items-center">
                    <BreadcrumbSeparator />
                    <PageBreadcrumbItem
                      pageId={rootParentDetails.id}
                      storeType={EPageStoreType.WORKSPACE}
                      href={`/${workspaceSlug}/wiki/${rootParentDetails.id}`}
                    />
                  </div>
                )}

                {middleParents.length > 0 && (
                  <div className="flex items-center">
                    <BreadcrumbSeparator />
                    <CustomMenu placement="bottom-start" ellipsis>
                      {middleParents.map(
                        (parent, index) =>
                          parent.id && (
                            <div
                              key={parent.id}
                              style={{
                                paddingLeft: `${index * 16}px`,
                              }}
                            >
                              <CustomMenu.MenuItem
                                className="flex items-center gap-1 transition-colors duration-200 ease-in-out"
                                onClick={() => router.push(`/${workspaceSlug}/wiki/${parent.id}`)}
                              >
                                <PageBreadcrumbItem pageId={parent.id} storeType={EPageStoreType.WORKSPACE} showLogo />
                              </CustomMenu.MenuItem>
                            </div>
                          )
                      )}
                    </CustomMenu>
                  </div>
                )}
              </>
            )}

            <div className={`flex items-center animate-quickFadeIn`}>
              <BreadcrumbSeparator />
              <PageBreadcrumbItem pageId={pageId?.toString() ?? ""} storeType={EPageStoreType.WORKSPACE} />
            </div>
          </div>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <div className="flex items-center gap-2">
          <PageSyncingBadge syncStatus={page.isSyncingWithServer} />
          <CollaboratorsList page={page} />
          <PageDetailsHeaderExtraActions page={page} storeType={storeType} />
          <PageHeaderActions page={page} storeType={storeType} />
        </div>
      </Header.RightItem>
    </Header>
  );
});

function createOrderedParentChildArray(parentPagesList: TPage[]) {
  // If the list is empty or has only one item, return it as is
  if (!parentPagesList || parentPagesList.length <= 1) {
    return parentPagesList;
  }

  // Create a map for quick lookups by ID
  const pagesMap = new Map();
  parentPagesList.forEach((page) => {
    pagesMap.set(page.id, page);
  });

  const rootPage = parentPagesList.find((page) => page.parent_id === null);

  if (!rootPage) {
    console.error("No root page found in the list");
    return parentPagesList;
  }

  const result: TPage[] = [];

  function buildHierarchy(currentPage: TPage) {
    result.push(currentPage);

    // Find all direct children of the current page
    const children = parentPagesList.filter((page) => page.parent_id === currentPage.id);

    // Process each child
    children.forEach((child) => {
      buildHierarchy(child);
    });
  }

  // Start building from the root
  buildHierarchy(rootPage);

  return result;
}
