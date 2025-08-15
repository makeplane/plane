"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { PriorityIcon } from "@plane/ui";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters/header";
// plane web constants
import { PROJECT_PRIORITIES } from "@/plane-web/constants/project";
// plane web types
import { TProjectPriority } from "@/plane-web/types/workspace-project-filters";

type TFilterPriority = {
  searchQuery: string;
  appliedFilters: TProjectPriority[] | null;
  handleUpdate: (val: TProjectPriority[]) => void;
};

export const FilterPriority: React.FC<TFilterPriority> = observer((props) => {
  const { searchQuery, appliedFilters, handleUpdate } = props;
  // states
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const sortedOptions = useMemo(
    () =>
      PROJECT_PRIORITIES.filter((priority) => priority.key.includes(searchQuery.toLowerCase()) || searchQuery === ""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchQuery]
  );

  const handleFilter = (val: TProjectPriority) => {
    if (appliedFilters?.includes(val)) {
      handleUpdate(appliedFilters.filter((priority) => priority !== val));
    } else {
      handleUpdate([...(appliedFilters ?? []), val]);
    }
  };

  return (
    <>
      <FilterHeader
        title={`Priority${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {sortedOptions.length > 0 ? (
            sortedOptions.map((priority) => (
              <FilterOption
                key={priority.key}
                isChecked={appliedFilters?.includes(priority.key) ? true : false}
                onClick={() => handleFilter(priority.key)}
                icon={<PriorityIcon priority={priority.key} className={`h-3 w-3`} />}
                title={priority.label}
              />
            ))
          ) : (
            <p className="text-xs italic text-custom-text-400">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});
