"use client";

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { FileText, ListFilter } from "lucide-react";
// types
import { TPage, TPageFilterProps, TPageNavigationTabs } from "@plane/types";
// ui
import { Breadcrumbs, Button, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { FiltersDropdown } from "@/components/issues";
import { PageAppliedFiltersList, PageFiltersSelection, PageOrderByDropdown, PageSearchInput } from "@/components/pages";
// constants
import { EPageAccess } from "@/constants/page";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
import { capitalizeFirstLetter } from "@/helpers/string.helper";
// hooks
import { useMember } from "@/hooks/store";
// plane web hooks
import { useWorkspacePages } from "@/plane-web/hooks/store";

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
  const { createPage, filters, updateFilters, clearAllFilters } = useWorkspacePages();
  // derived values
  const isFiltersApplied = calculateTotalFilters(filters?.filters ?? {}) !== 0;
  // handle remove filter
  const handleRemoveFilter = useCallback(
    (key: keyof TPageFilterProps, value: string | null) => {
      let newValues = filters.filters?.[key];

      if (key === "favorites") newValues = !!value;
      if (Array.isArray(newValues)) {
        if (!value) newValues = [];
        else newValues = newValues.filter((val) => val !== value);
      }

      updateFilters("filters", { [key]: newValues });
    },
    [filters.filters, updateFilters]
  );
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
    <>
      <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
        <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
          <div>
            <Breadcrumbs>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink
                    href={`/${workspaceSlug}/pages`}
                    label="Pages"
                    icon={<FileText className="size-4 text-custom-text-300" />}
                  />
                }
              />
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={<BreadcrumbLink label={`${capitalizeFirstLetter(pageType)} pages`} />}
              />
            </Breadcrumbs>
          </div>
        </div>
        <div className="h-full flex items-center gap-2 self-end">
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
        </div>
      </div>
      {isFiltersApplied && (
        <div className="border-b border-custom-border-200 px-5 py-3">
          <PageAppliedFiltersList
            appliedFilters={filters.filters ?? {}}
            handleClearAllFilters={clearAllFilters}
            handleRemoveFilter={handleRemoveFilter}
            alwaysAllowEditing
          />
        </div>
      )}
    </>
  );
});
