import { useCallback } from "react";
import { observer } from "mobx-react";
import { ListFilter } from "lucide-react";
import { TPageFilterProps, TPageNavigationTabs } from "@plane/types";
// components
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
import { useLabel, useMember, useProjectPages } from "@/hooks/store";

type Props = {
  pageType: TPageNavigationTabs;
  projectId: string;
  workspaceSlug: string;
};

export const PagesListHeaderRoot: React.FC<Props> = observer((props) => {
  const { pageType, projectId, workspaceSlug } = props;
  // store hooks
  const { filters, updateFilters, clearAllFilters } = useProjectPages(projectId);
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  const { projectLabels } = useLabel();

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

  return (
    <>
      <div className="flex-shrink-0 w-full border-b border-custom-border-200 px-3 relative flex items-center gap-4 justify-between">
        <PageTabNavigation workspaceSlug={workspaceSlug} projectId={projectId} pageType={pageType} />
        <div className="h-full flex items-center gap-2 self-end">
          <PageSearchInput projectId={projectId} />
          <PageOrderByDropdown
            sortBy={filters.sortBy}
            sortKey={filters.sortKey}
            onChange={(val) => {
              if (val.key) updateFilters("sortKey", val.key);
              if (val.order) updateFilters("sortBy", val.order);
            }}
          />
          <FiltersDropdown icon={<ListFilter className="h-3 w-3" />} title="Filters" placement="bottom-end">
            <PageFiltersSelection
              filters={filters}
              handleFiltersUpdate={updateFilters}
              labels={projectLabels}
              memberIds={workspaceMemberIds ?? undefined}
            />
          </FiltersDropdown>
        </div>
      </div>
      {calculateTotalFilters(filters?.filters ?? {}) !== 0 && (
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
