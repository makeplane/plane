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
import { useParams, usePathname, useRouter } from "next/navigation";
import { ListFilter } from "lucide-react";
// plane imports
import { EPageAccess } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { PageIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TPage, TPageNavigationTabs } from "@plane/types";
import { Breadcrumbs, Header } from "@plane/ui";
import { calculateTotalFilters, capitalizeFirstLetter } from "@plane/utils";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import { PageFiltersSelection } from "@/components/pages/list/filters";
import { PageOrderByDropdown } from "@/components/pages/list/order-by";
import { PageSearchInput } from "@/components/pages/list/search-input";
// hooks
import { useMember } from "@/hooks/store/use-member";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

type Props = {
  pageType: TPageNavigationTabs;
};

export const PageTypeHeader = observer(function PageTypeHeader(props: Props) {
  const { pageType } = props;
  // states
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  // params
  const router = useRouter();
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // store hooks
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  const { createPage, filters, updateFilters } = usePageStore(EPageStoreType.WORKSPACE);
  // derived values
  const isFiltersApplied = calculateTotalFilters(filters?.filters ?? {}) !== 0;
  // handle page create
  const handleCreatePage = async () => {
    setIsCreatingPage(true);

    const payload: Partial<TPage> = {
      access: pageType === "private" ? EPageAccess.PRIVATE : EPageAccess.PUBLIC,
    };

    await createPage(payload)
      .then((res) => {
        const pageId = `/${workspaceSlug}/wiki/${res?.id}`;
        router.push(pageId);
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.data?.error || "Page could not be created. Please try again.",
        });
      })
      .finally(() => setIsCreatingPage(false));
  };

  // Clear search query on tab change, but preserve filters
  useEffect(() => {
    updateFilters("searchQuery", "");
  }, [pathname, updateFilters]);

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/pages`}
                  label="Pages"
                  icon={<PageIcon className="size-4 text-tertiary" />}
                />
              }
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={`${pageType === "public" ? "General" : capitalizeFirstLetter(pageType)} pages`}
                />
              }
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem className="h-full flex items-center gap-2 self-end">
        <PageSearchInput
          searchQuery={filters.searchQuery}
          updateSearchQuery={(val) => updateFilters("searchQuery", val)}
        />
        <PageOrderByDropdown
          sortBy={filters.sortBy}
          sortKey={filters.sortKey}
          onChange={(val) => {
            if (val.key) updateFilters("sortKey", val.key);
            if (val.order) updateFilters("sortBy", val.order);
          }}
        />
        <FiltersDropdown
          icon={<ListFilter className="h-3 w-3" />}
          title="Filters"
          placement="bottom-end"
          isFiltersApplied={isFiltersApplied}
        >
          <PageFiltersSelection
            filters={filters}
            handleFiltersUpdate={updateFilters}
            memberIds={workspaceMemberIds ?? undefined}
          />
        </FiltersDropdown>
        <Button variant="primary" className="flex-shrink-0" onClick={handleCreatePage} loading={isCreatingPage}>
          {isCreatingPage ? "Adding" : "Add page"}
        </Button>
      </Header.RightItem>
    </Header>
  );
});
