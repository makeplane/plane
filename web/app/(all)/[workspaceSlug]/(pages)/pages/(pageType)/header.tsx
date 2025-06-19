"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { FileText, ListFilter } from "lucide-react";
// plane imports
import { EPageAccess } from "@plane/constants";
import { TPage, TPageNavigationTabs } from "@plane/types";
import { Breadcrumbs, Button, Header, setToast, TOAST_TYPE } from "@plane/ui";
import { calculateTotalFilters, capitalizeFirstLetter } from "@plane/utils";
// components
import { BreadcrumbLink } from "@/components/common";
import { FiltersDropdown } from "@/components/issues";
import { PageFiltersSelection, PageOrderByDropdown, PageSearchInput } from "@/components/pages";
// hooks
import { useMember } from "@/hooks/store";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

type Props = {
  pageType: TPageNavigationTabs;
};

export const PageTypeHeader: React.FC<Props> = observer((props) => {
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
  const { createPage, filters, updateFilters, clearAllFilters } = usePageStore(EPageStoreType.WORKSPACE);
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
        const pageId = `/${workspaceSlug}/pages/${res?.id}`;
        router.push(pageId);
      })
      .catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.data?.error || "Page could not be created. Please try again.",
        })
      )
      .finally(() => setIsCreatingPage(false));
  };

  useEffect(() => {
    clearAllFilters();
    updateFilters("searchQuery", "");
  }, [clearAllFilters, pathname, updateFilters]);

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
                  icon={<FileText className="size-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.Item component={<BreadcrumbLink label={`${capitalizeFirstLetter(pageType)} pages`} />} />
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
        <Button
          variant="primary"
          size="sm"
          className="flex-shrink-0"
          onClick={handleCreatePage}
          loading={isCreatingPage}
        >
          {isCreatingPage ? "Adding" : "Add page"}
        </Button>
      </Header.RightItem>
    </Header>
  );
});
