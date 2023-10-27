import React, { useState } from "react";
import { observer } from "mobx-react-lite";

// components
import { FilterHeader, FilterOption } from "components/issues";
import { DateFilterModal } from "components/core";
// constants
import { DATE_FILTER_OPTIONS } from "constants/filters";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string | string[]) => void;
  itemsToRender: number;
  searchQuery: string;
};

export const FilterTargetDate: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, itemsToRender, searchQuery } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const filteredOptions = DATE_FILTER_OPTIONS.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      {isDateFilterModalOpen && (
        <DateFilterModal
          handleClose={() => setIsDateFilterModalOpen(false)}
          isOpen={isDateFilterModalOpen}
          onSelect={(val) => handleUpdate(val)}
          title="Due date"
        />
      )}
      <FilterHeader
        title={`Target date${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 ? (
            <>
              {filteredOptions.slice(0, itemsToRender).map((option) => (
                <FilterOption
                  key={option.value}
                  isChecked={appliedFilters?.includes(option.value) ? true : false}
                  onClick={() => handleUpdate(option.value)}
                  title={option.name}
                  multiple
                />
              ))}
              <FilterOption isChecked={false} onClick={() => setIsDateFilterModalOpen(true)} title="Custom" multiple />
            </>
          ) : (
            <p className="text-xs text-custom-text-400 italic">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});
