import React, { useState } from "react";
import { observer } from "mobx-react-lite";
// components
import { TInboxIssueFilterDateKeys } from "@plane/types";
import { DateFilterModal } from "@/components/core";
import { FilterHeader, FilterOption } from "@/components/issues";
// constants
import { DATE_BEFORE_FILTER_OPTIONS } from "@/constants/filters";
import { useProjectInbox } from "@/hooks/store";

type Props = {
  filterKey: TInboxIssueFilterDateKeys;
  label?: string;
  searchQuery: string;
};

export const FilterDate: React.FC<Props> = observer((props) => {
  const { filterKey, label = "Date", searchQuery } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);

  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();

  const filterValue = inboxFilters?.[filterKey] || [];

  const appliedFiltersCount = filterValue?.length ?? 0;

  const filteredOptions = DATE_BEFORE_FILTER_OPTIONS.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFilterValue = (value: string): string[] =>
    filterValue?.includes(value) ? filterValue.filter((v) => v !== value) : [...filterValue, value];

  return (
    <>
      {isDateFilterModalOpen && (
        <DateFilterModal
          handleClose={() => setIsDateFilterModalOpen(false)}
          isOpen={isDateFilterModalOpen}
          onSelect={(val) => handleInboxIssueFilters(filterKey, val)}
          title={label}
        />
      )}
      <FilterHeader
        title={`Created at${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
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
                  isChecked={filterValue?.includes(option.value) ? true : false}
                  onClick={() => handleInboxIssueFilters(filterKey, handleFilterValue(option.value))}
                  title={option.name}
                  multiple
                />
              ))}
              <FilterOption isChecked={false} onClick={() => setIsDateFilterModalOpen(true)} title="Custom" multiple />
            </>
          ) : (
            <p className="text-xs italic text-custom-text-400">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});
