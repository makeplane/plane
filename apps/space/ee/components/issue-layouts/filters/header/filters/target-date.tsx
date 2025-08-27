import React, { useState } from "react";
import { observer } from "mobx-react";
// components
import { FilterHeader } from "@/components/issues/filters/helpers/filter-header";
import { FilterOption } from "@/components/issues/filters/helpers/filter-option";
// constants
import { DATE_AFTER_FILTER_OPTIONS } from "@/plane-web/constants/issue";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string | string[]) => void;
  searchQuery: string;
  allowedValues: string[] | undefined;
};

export const FilterTargetDate: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery, allowedValues } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const filteredOptions = DATE_AFTER_FILTER_OPTIONS.filter(
    (d) => (allowedValues?.includes(d.value) ?? true) && d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <FilterHeader
        title={`Target date${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
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
                  multiple
                />
              ))}
            </>
          ) : (
            <p className="text-xs italic text-custom-text-400">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});
