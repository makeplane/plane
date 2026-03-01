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
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ChevronRightIcon, PageIcon } from "@plane/propel/icons";
import type { ICustomSearchSelectOption } from "@plane/types";
import { Breadcrumbs, Header, CustomMenu, BreadcrumbNavigationSearchDropdown } from "@plane/ui";
import { getPageName } from "@plane/utils";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { PageAccessIcon } from "@/components/common/page-access-icon";
import { SwitcherIcon, SwitcherLabel } from "@/components/common/switcher-label";
import { PageBreadcrumbItem } from "@/components/pages/editor/breadcrumb-page-item";
import { PageHeaderActions } from "@/components/pages/header/actions";
import { PageSyncingBadge } from "@/components/pages/header/syncing-badge";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { ProjectBreadcrumbWithPreference } from "@/components/breadcrumbs/project/with-preference";
import { CollaboratorsList, PageDetailsHeaderExtraActions } from "@/plane-web/components/pages";
import { EPageStoreType, usePage, usePageStore } from "@/plane-web/hooks/store";

export interface IPagesHeaderProps {
  showButton?: boolean;
}

const storeType = EPageStoreType.PROJECT;

export const PageDetailsHeader = observer(function PageDetailsHeader() {
  const router = useAppRouter();
  const { workspaceSlug, pageId, projectId } = useParams();
  // store hooks
  const { loader } = useProject();
  const { getPageById, getCurrentProjectPageIds, fetchParentPages, getOrderedParentPages, isNestedPagesEnabled } =
    usePageStore(storeType);
  const page = usePage({
    pageId: pageId?.toString() ?? "",
    storeType,
  });
  // derived values
  const projectPageIds = projectId ? getCurrentProjectPageIds(projectId.toString()) : [];

  // Always fetch parent pages to keep the cache up-to-date
  const { isLoading: isParentPagesLoading } = useSWR(
    workspaceSlug && projectId && pageId ? `PROJECT_PARENT_PAGES_LIST_${pageId.toString()}` : null,
    workspaceSlug && projectId && pageId ? () => fetchParentPages(pageId.toString()) : null
  );

  // Get ordered parent pages from store
  const orderedParentPages = pageId ? getOrderedParentPages(pageId.toString()) : undefined;

  // Now use orderedParentPages from store for UI logic
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

  const switcherOptions = projectPageIds
    .map((id) => {
      const _page = id === pageId ? page : getPageById(id);
      if (!_page || _page.deleted_at) return;
      return {
        value: _page.id,
        query: _page.name,
        content: (
          <div className="flex gap-2 items-center justify-between">
            <SwitcherLabel logo_props={_page.logo_props} name={getPageName(_page.name)} LabelIcon={PageIcon} />
            <PageAccessIcon {..._page} />
          </div>
        ),
      };
    })
    .filter((option) => option !== undefined) as ICustomSearchSelectOption[];

  if (!page || !page.canCurrentUserAccessPage) return null;

  return (
    <Header>
      <Header.LeftItem>
        <div className="w-full overflow-hidden">
          <Breadcrumbs isLoading={loader === "init-loader"}>
            <ProjectBreadcrumbWithPreference
              workspaceSlug={workspaceSlug?.toString()}
              projectId={projectId?.toString()}
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label="Pages"
                  href={`/${workspaceSlug}/projects/${projectId}/pages/`}
                  icon={<PageIcon className="h-4 w-4 text-tertiary" />}
                />
              }
            />
            {isNestedPagesEnabled(workspaceSlug?.toString()) && (
              <>
                {isParentPagesLoading ? (
                  <div className="flex items-center">
                    <div className="flex items-center animate-pulse">
                      <div className="h-4 w-24 bg-layer-1 rounded" />
                    </div>
                  </div>
                ) : (
                  <>
                    {!isRootPage && rootParentDetails?.id && (
                      <div className="flex items-center">
                        <PageBreadcrumbItem
                          pageId={rootParentDetails.id}
                          storeType={storeType}
                          href={`/${workspaceSlug}/projects/${projectId}/pages/${rootParentDetails.id}`}
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
                                    onClick={() =>
                                      router.push(`/${workspaceSlug}/projects/${projectId}/pages/${parent.id}`)
                                    }
                                  >
                                    <PageBreadcrumbItem pageId={parent.id} storeType={storeType} showLogo />
                                  </CustomMenu.MenuItem>
                                </div>
                              )
                          )}
                        </CustomMenu>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {orderedParentPages && orderedParentPages.length > 1 && <BreadcrumbSeparator />}
            <Breadcrumbs.Item
              component={
                <BreadcrumbNavigationSearchDropdown
                  selectedItem={pageId?.toString() ?? ""}
                  navigationItems={switcherOptions}
                  onChange={(value: string) => {
                    router.push(`/${workspaceSlug}/projects/${projectId}/pages/${value}`);
                  }}
                  title={getPageName(page?.name)}
                  icon={
                    <Breadcrumbs.Icon>
                      <SwitcherIcon logo_props={page.logo_props} LabelIcon={PageIcon} size={16} />
                    </Breadcrumbs.Icon>
                  }
                  isLast
                />
              }
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <PageSyncingBadge syncStatus={page.isSyncingWithServer} />
        <CollaboratorsList page={page} />
        <PageDetailsHeaderExtraActions page={page} storeType={storeType} />
        <PageHeaderActions page={page} storeType={storeType} />
      </Header.RightItem>
    </Header>
  );
});
