/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
// plane imports
import { PageIcon } from "@plane/propel/icons";
import type { ICustomSearchSelectOption } from "@plane/types";
import { Breadcrumbs, Header, BreadcrumbNavigationSearchDropdown } from "@plane/ui";
import { getPageName } from "@plane/utils";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { PageAccessIcon } from "@/components/common/page-access-icon";
import { SwitcherIcon, SwitcherLabel } from "@/components/common/switcher-label";
import { PageHeaderActions } from "@/components/pages/header/actions";
import { PageSyncingBadge } from "@/components/pages/header/syncing-badge";
import { CommonProjectBreadcrumbs } from "@/components/breadcrumbs/common";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { EPageStoreType, usePage, usePageStore } from "@/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";

// guards against malformed (cyclic) hierarchies
const MAX_BREADCRUMB_DEPTH = 20;

export interface IPagesHeaderProps {
  showButton?: boolean;
}

const storeType = EPageStoreType.PROJECT;

export const PageDetailsHeader = observer(function PageDetailsHeader() {
  // router
  const router = useAppRouter();
  const { workspaceSlug, pageId, projectId } = useParams();
  const searchParams = useSearchParams();
  const fromPageId = searchParams.get("from");
  // store hooks
  const { loader } = useProject();
  const { getPageById, getCurrentProjectPageIds } = usePageStore(storeType);
  const page = usePage({
    pageId: pageId?.toString() ?? "",
    storeType,
  });
  // derived values
  const projectPageIds = getCurrentProjectPageIds(projectId?.toString());

  const switcherOptions = projectPageIds
    .map((id) => {
      const _page = id === pageId ? page : getPageById(id);
      if (!_page) return;
      return {
        value: _page.id,
        query: _page.name,
        content: (
          <div className="flex items-center justify-between gap-2">
            <SwitcherLabel logo_props={_page.logo_props} name={getPageName(_page.name)} LabelIcon={PageIcon} />
            <PageAccessIcon {..._page} />
          </div>
        ),
      };
    })
    .filter((option) => option !== undefined) as ICustomSearchSelectOption[];

  // hierarchy: follow the page it was opened from (a page can be linked from several places), else its parent chain
  const ancestorPages: TPageInstance[] = [];
  const visitedPageIds = new Set<string>([pageId?.toString() ?? ""]);
  let ancestorId: string | null | undefined =
    fromPageId && fromPageId !== pageId && getPageById(fromPageId) ? fromPageId : page?.parent;
  while (ancestorId && !visitedPageIds.has(ancestorId) && ancestorPages.length < MAX_BREADCRUMB_DEPTH) {
    const ancestorPage = getPageById(ancestorId);
    if (!ancestorPage) break;
    visitedPageIds.add(ancestorId);
    ancestorPages.unshift(ancestorPage);
    ancestorId = ancestorPage.parent;
  }

  if (!page) return null;

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <Breadcrumbs isLoading={loader === "init-loader"}>
            <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label="Pages"
                  href={`/${workspaceSlug}/projects/${projectId}/pages/`}
                  icon={<PageIcon className="h-4 w-4 text-tertiary" />}
                />
              }
            />

            {ancestorPages.map((ancestorPage) => (
              <Breadcrumbs.Item
                key={ancestorPage.id}
                component={
                  <BreadcrumbLink
                    label={getPageName(ancestorPage.name)}
                    href={`/${workspaceSlug}/projects/${projectId}/pages/${ancestorPage.id}`}
                    icon={<SwitcherIcon logo_props={ancestorPage.logo_props} LabelIcon={PageIcon} size={16} />}
                  />
                }
              />
            ))}

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
        <PageHeaderActions page={page} storeType={storeType} />
      </Header.RightItem>
    </Header>
  );
});
