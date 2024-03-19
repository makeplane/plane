import React, { useState } from "react";
import { observer } from "mobx-react-lite";
// components
import { FilterHeader, FilterOption } from "components/issues";
// constants
import { INBOX_STATUS } from "constants/inbox";

type Props = {
  appliedFilters: number[] | null;
  handleUpdate: (val: number) => void;
  searchQuery: string;
};

export const FilterStatus: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery } = props;
  // states
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;
  const filteredOptions = INBOX_STATUS.filter((s) => s.key.includes(searchQuery.toLowerCase()));

  return (
    <>
      <FilterHeader
        title={`Issue Status ${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((status) => (
              <FilterOption
                key={status.key}
                isChecked={appliedFilters?.includes(status.status) ? true : false}
                onClick={() => handleUpdate(status.status)}
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
