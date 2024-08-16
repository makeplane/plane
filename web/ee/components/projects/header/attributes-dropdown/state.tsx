"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
// hooks
import { FilterHeader, FilterOption } from "@/components/issues";
// plane web components
import { ProjectStateIcon } from "@/plane-web/components/workspace-project-states";
// plane web hooks
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";

type TFilterState = {
  workspaceId: string;
  searchQuery: string;
  appliedFilters: string[] | null;
  handleUpdate: (val: string[]) => void;
};

export const FilterState: React.FC<TFilterState> = observer((props) => {
  const { workspaceId, searchQuery, appliedFilters, handleUpdate } = props;
  // hooks
  const { getProjectStateById, getProjectStateIdsWithGroupingByWorkspaceId } = useWorkspaceProjectStates();
  // states
  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  // derived values
  const appliedFiltersCount = appliedFilters?.length ?? 0;
  const groupedProjectStateIds = getProjectStateIdsWithGroupingByWorkspaceId(workspaceId);
  const stateDetails = (groupedProjectStateIds ? Object.values(groupedProjectStateIds).flat() : []).map((stateId) =>
    getProjectStateById(stateId)
  );
  const sortedOptions = useMemo(
    () =>
      (stateDetails ?? []).filter(
        (state) =>
          (state?.name || "").includes(searchQuery.toLowerCase()) ||
          (state?.group || "").includes(searchQuery.toLowerCase()) ||
          searchQuery === ""
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchQuery]
  );

  const handleViewToggle = () => {
    if (!sortedOptions) return;
    if (itemsToRender === sortedOptions.length) setItemsToRender(5);
    else setItemsToRender(sortedOptions.length);
  };

  const handleFilter = (val: string) => {
    if (appliedFilters?.includes(val)) {
      handleUpdate(appliedFilters.filter((priority) => priority !== val));
    } else {
      handleUpdate([...(appliedFilters ?? []), val]);
    }
  };

  return (
    <>
      <FilterHeader
        title={`State${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {sortedOptions.length > 0 ? (
            <>
              {sortedOptions
                .slice(0, itemsToRender)
                .map(
                  (state) =>
                    state?.id &&
                    state?.group &&
                    state?.name && (
                      <FilterOption
                        key={state?.id}
                        isChecked={appliedFilters?.includes(state?.id) ? true : false}
                        onClick={() => state?.id && handleFilter(state?.id)}
                        icon={<ProjectStateIcon projectStateGroup={state?.group} width="14" height="14" />}
                        title={state?.name.charAt(0).toUpperCase() + state?.name.slice(1)}
                      />
                    )
                )}
              {sortedOptions.length > 5 && (
                <button
                  type="button"
                  className="ml-8 text-xs font-medium text-custom-primary-100"
                  onClick={handleViewToggle}
                >
                  {itemsToRender === sortedOptions.length ? "View less" : "View all"}
                </button>
              )}
            </>
          ) : (
            <p className="text-xs italic text-custom-text-400">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});
