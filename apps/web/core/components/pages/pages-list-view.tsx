/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import useSWR from "swr";
import type { TPageNavigationTabs } from "@plane/types";
// hooks
import { EPageStoreType, usePageStore } from "@/hooks/store";
// local imports
import { PagesListHeaderRoot } from "./header";
import { PagesListMainContent } from "./pages-list-main-content";

type TPageView = {
  children: React.ReactNode;
  pageType: TPageNavigationTabs;
  /** Optional — absent for workspace-level (wiki) pages. */
  projectId?: string;
  storeType: EPageStoreType;
  workspaceSlug: string;
};

export const PagesListView = observer(function PagesListView(props: TPageView) {
  const { children, pageType, projectId, storeType, workspaceSlug } = props;
  // store hooks
  const { isAnyPageAvailable, fetchPagesList } = usePageStore(storeType);
  // workspace (wiki) pages have no project scope; project pages require a projectId
  const shouldFetch = !!workspaceSlug && !!pageType && (storeType === EPageStoreType.WORKSPACE || !!projectId);
  // fetching pages list
  useSWR(
    shouldFetch ? `PAGES_LIST_${storeType}_${projectId ?? workspaceSlug}_${pageType}` : null,
    shouldFetch ? () => fetchPagesList(workspaceSlug, projectId, pageType) : null
  );

  // pages loader
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* tab header */}
      {isAnyPageAvailable && (
        <PagesListHeaderRoot
          pageType={pageType}
          projectId={projectId}
          storeType={storeType}
          workspaceSlug={workspaceSlug}
        />
      )}
      <PagesListMainContent pageType={pageType} storeType={storeType}>
        {children}
      </PagesListMainContent>
    </div>
  );
});
