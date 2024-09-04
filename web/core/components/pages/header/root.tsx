import { useCallback } from "react";
import { observer } from "mobx-react";
import { ListFilter } from "lucide-react";
import { TPageFilterProps, TPageNavigationTabs } from "@plane/types";
// components
import { CustomHeader, EHeaderVariant } from "@plane/ui";
import { FiltersDropdown } from "@/components/issues";
import {
  PageAppliedFiltersList,
  PageFiltersSelection,
  PageOrderByDropdown,
  PageSearchInput,
  PageTabNavigation,
} from "@/components/pages";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useMember, useProjectPages } from "@/hooks/store";

type Props = {
  pageType: TPageNavigationTabs;
  projectId: string;
  workspaceSlug: string;
};

export const PagesListHeaderRoot: React.FC<Props> = observer((props) => {
  const { pageType, projectId, workspaceSlug } = props;
  // store hooks
  const { filters, updateFilters, clearAllFilters } = useProjectPages();
  const {
    workspace: { workspaceMemberIds },
  } = useMember();

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

  const isFiltersApplied = calculateTotalFilters(filters?.filters ?? {}) !== 0;

  return (
    <>
      <CustomHeader variant={EHeaderVariant.SECONDARY} className="flex">
        <CustomHeader.LeftItem>
          <PageTabNavigation workspaceSlug={workspaceSlug} projectId={projectId} pageType={pageType} />
        </CustomHeader.LeftItem>
        <CustomHeader.RightItem>
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
        </CustomHeader.RightItem>
      </CustomHeader>
      {calculateTotalFilters(filters?.filters ?? {}) !== 0 && (
        <CustomHeader variant={EHeaderVariant.TERNARY}>
          <PageAppliedFiltersList
            appliedFilters={filters.filters ?? {}}
            handleClearAllFilters={clearAllFilters}
            handleRemoveFilter={handleRemoveFilter}
            alwaysAllowEditing
          />
        </CustomHeader>
      )}
    </>
  );
});
