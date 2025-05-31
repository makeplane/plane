import React, { useState } from "react";
import { observer } from "mobx-react";
// plane constants
import { PROJECT_CREATED_AT_FILTER_OPTIONS } from "@plane/constants";
// components
import { isInDateFormat } from "@plane/utils";
import { DateFilterModal } from "@/components/core";
import { FilterHeader, FilterOption } from "@/components/issues";

// helpers

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string | string[]) => void;
  searchQuery: string;
};

export const FilterCreatedDate: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery } = props;
  // state
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);
  // derived values
  const appliedFiltersCount = appliedFilters?.length ?? 0;
  const filteredOptions = PROJECT_CREATED_AT_FILTER_OPTIONS.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isCustomDateSelected = () => {
    const isValidDateSelected = appliedFilters?.filter((f) => isInDateFormat(f.split(";")[0])) || [];
    return isValidDateSelected.length > 0 ? true : false;
  };
  const handleCustomDate = () => {
    if (isCustomDateSelected()) {
      const updateAppliedFilters = appliedFilters?.filter((f) => f.includes("-")) || [];
      handleUpdate(updateAppliedFilters);
    } else setIsDateFilterModalOpen(true);
  };

  return (
    <>
      {isDateFilterModalOpen && (
        <DateFilterModal
          handleClose={() => setIsDateFilterModalOpen(false)}
          isOpen={isDateFilterModalOpen}
          onSelect={(val) => handleUpdate(val)}
          title="Created date"
        />
      )}
      <FilterHeader
        title={`Created date${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 ? (
            <>
              {filteredOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  isChecked={appliedFilters?.includes(option.value) ? true : false}
                  onClick={() => handleUpdate(option.value)}
                  title={option.name}
                  multiple={false}
                />
              ))}
              <FilterOption
                isChecked={isCustomDateSelected()}
                onClick={handleCustomDate}
                title="Custom"
                multiple={false}
              />
            </>
          ) : (
            <p className="text-xs italic text-custom-text-400">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});
