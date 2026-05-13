/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { calculateTotalFilters } from "@plane/utils";
// types
import type { TPageNavigationTabs } from "@plane/types";
// components
import { ListLayout } from "@/components/core/list";
// plane web hooks
import type { EPageStoreType } from "@/plane-web/hooks/store";
import { usePageStore } from "@/plane-web/hooks/store";
// local imports
import { PageListBlock } from "./block";

type TPagesListRoot = {
  pageType: TPageNavigationTabs;
  storeType: EPageStoreType;
};

export const PagesListRoot = observer(function PagesListRoot(props: TPagesListRoot) {
  const { pageType, storeType } = props;
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { filters, canCurrentUserCreatePage, getCurrentProjectFilteredPageIdsByTab, reorderPage } =
    usePageStore(storeType);
  // derived values
  const filteredPageIds = getCurrentProjectFilteredPageIdsByTab(pageType);
  const canReorderPages =
    pageType !== "archived" &&
    filters.sortKey === "sort_order" &&
    filters.searchQuery.trim().length === 0 &&
    calculateTotalFilters(filters.filters ?? {}) === 0 &&
    canCurrentUserCreatePage;

  const handlePageDrop = async (
    sourcePageId: string,
    destinationPageId: string,
    edge: "reorder-above" | "reorder-below"
  ) => {
    if (!workspaceSlug || !projectId || sourcePageId === destinationPageId || !filteredPageIds?.length) return;
    try {
      await reorderPage(
        workspaceSlug.toString(),
        projectId.toString(),
        sourcePageId,
        destinationPageId,
        edge,
        filteredPageIds
      );
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: "Failed to reorder page. Please try again.",
      });
    }
  };

  if (!filteredPageIds) return <></>;
  return (
    <ListLayout>
      {filteredPageIds.map((pageId, index) => (
        <PageListBlock
          key={pageId}
          pageId={pageId}
          storeType={storeType}
          isLastChild={index === filteredPageIds.length - 1}
          isReorderEnabled={canReorderPages && filteredPageIds.length > 1}
          onPageDrop={handlePageDrop}
        />
      ))}
    </ListLayout>
  );
});
