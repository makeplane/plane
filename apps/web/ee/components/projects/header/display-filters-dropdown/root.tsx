" use client";

import { FC } from "react";
import { observer } from "mobx-react";
// components
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
// plane web components
import { DisplayFilterGroupBy, DisplayFilterSortBy, DisplayFilterSortOrder } from "@/plane-web/components/projects";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store";
import { EProjectLayouts } from "@/plane-web/types/workspace-project-filters";

type TProjectDisplayFiltersDropdown = {
  workspaceSlug: string;
  menuButton?: React.ReactNode;
  isArchived?: boolean;
};

export const ProjectDisplayFiltersDropdown: FC<TProjectDisplayFiltersDropdown> = observer((props) => {
  const { workspaceSlug, menuButton, isArchived = false } = props;
  // hooks
  const { filters, updateDisplayFilters } = useProjectFilter();
  return (
    <div className="">
      <FiltersDropdown title="Display" placement="bottom-end" menuButton={menuButton}>
        <div className="vertical-scrollbar scrollbar-sm relative h-full w-full divide-y divide-custom-border-200 overflow-hidden overflow-y-auto px-2.5">
          {/* group by */}
          {filters?.layout && [EProjectLayouts.BOARD, EProjectLayouts.TABLE].includes(filters?.layout) && (
            <div className="py-2">
              <DisplayFilterGroupBy
                filterValue={filters?.display_filters?.group_by}
                handleUpdate={(val) => updateDisplayFilters(workspaceSlug, "group_by", val, isArchived)}
              />
            </div>
          )}
          {/* sort by */}
          <div className="py-2">
            <DisplayFilterSortBy
              filterValue={filters?.display_filters?.sort_by}
              handleUpdate={(val) => updateDisplayFilters(workspaceSlug, "sort_by", val, isArchived)}
            />
          </div>
          {/* order by */}
          <div className="py-2">
            <DisplayFilterSortOrder
              filterValue={filters?.display_filters?.sort_order}
              handleUpdate={(val) => updateDisplayFilters(workspaceSlug, "sort_order", val, isArchived)}
            />
          </div>
        </div>
      </FiltersDropdown>
    </div>
  );
});
