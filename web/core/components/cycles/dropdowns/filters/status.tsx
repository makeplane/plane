import React, { useState } from "react";
import { observer } from "mobx-react";
import { TCycleGroups } from "@plane/types";
// components
import { FilterHeader, FilterOption } from "@/components/issues";
// types
import { CYCLE_STATUS } from "@/constants/cycle";
// constants

type Props = {
  appliedFilters: TCycleGroups[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterStatus: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery } = props;
  // states
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;
  const filteredOptions = CYCLE_STATUS.filter((p) => p.value.includes(searchQuery.toLowerCase()));

  return (
    <>
      <FilterHeader
        title={`Status of the cycle${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((status) => (
              <FilterOption
                key={status.value}
                isChecked={appliedFilters?.includes(status.value) ? true : false}
                onClick={() => handleUpdate(status.value)}
                title={status.title}
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
