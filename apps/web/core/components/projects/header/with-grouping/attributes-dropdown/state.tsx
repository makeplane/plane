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

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
// hooks
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters/header";
// plane web components
import { ProjectStateIcon } from "@/components/workspace-project-states";
// plane web hooks
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";

type TFilterState = {
  workspaceId: string;
  searchQuery: string;
  appliedFilters: string[] | null;
  handleUpdate: (val: string[]) => void;
};

export const FilterState = observer(function FilterState(props: TFilterState) {
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
                  className="ml-8 text-11 font-medium text-accent-primary"
                  onClick={handleViewToggle}
                >
                  {itemsToRender === sortedOptions.length ? "View less" : "View all"}
                </button>
              )}
            </>
          ) : (
            <p className="text-11 italic text-placeholder">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});
