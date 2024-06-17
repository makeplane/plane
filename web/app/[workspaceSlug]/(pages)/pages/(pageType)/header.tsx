"use client";

import { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { FileText, ListFilter } from "lucide-react";
// types
import { TPageFilterProps, TPageNavigationTabs } from "@plane/types";
// ui
import { Breadcrumbs, Button } from "@plane/ui";
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
import { useCommandPalette, useMember } from "@/hooks/store";
// plane web hooks
import { useWorkspacePages } from "@/plane-web/hooks/store";

type Props = {
  pageType: TPageNavigationTabs;
};

export const PageTypeHeader: React.FC<Props> = observer((props) => {
  const { pageType } = props;
  // params
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // store hooks
  const { toggleCreatePageModal } = useCommandPalette();
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  const { filters, updateFilters, clearAllFilters } = useWorkspacePages();
  // derived values
  const isFiltersApplied = calculateTotalFilters(filters?.filters ?? {}) !== 0;

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
            onClick={() =>
              toggleCreatePageModal({
                isOpen: true,
                pageAccess: pageType === "private" ? EPageAccess.PRIVATE : EPageAccess.PUBLIC,
              })
            }
          >
            Add page
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
