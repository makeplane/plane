import { FC, useState } from "react";
import concat from "lodash/concat";
import uniq from "lodash/uniq";
import { observer } from "mobx-react";
import { PAST_DURATION_FILTER_OPTIONS } from "@plane/constants";
import { TInboxIssueFilterDateKeys } from "@plane/types";
// components
import { DateFilterModal } from "@/components/core";
import { FilterHeader, FilterOption } from "@/components/issues";
// constants
// hooks
import { useProjectInbox } from "@/hooks/store";

type Props = {
  filterKey: TInboxIssueFilterDateKeys;
  label?: string;
  searchQuery: string;
};

const isDate = (date: string) => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  return datePattern.test(date);
};

export const FilterDate: FC<Props> = observer((props) => {
  const { filterKey, label, searchQuery } = props;
  // hooks
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  // state
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);
  // derived values
  const filterValue: string[] = inboxFilters?.[filterKey] || [];
  const appliedFiltersCount = filterValue?.length ?? 0;
  const filteredOptions = PAST_DURATION_FILTER_OPTIONS.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFilterValue = (value: string): string[] => (filterValue?.includes(value) ? [] : uniq(concat(value)));

  const isCustomDateSelected = () => {
    const isValidDateSelected = filterValue?.filter((f) => isDate(f.split(";")[0])) || [];
    return isValidDateSelected.length > 0 ? true : false;
  };

  const handleCustomDate = () => {
    if (isCustomDateSelected()) {
      const updateAppliedFilters = filterValue?.filter((f) => !isDate(f.split(";")[0])) || [];
      handleInboxIssueFilters(filterKey, updateAppliedFilters);
    } else {
      setIsDateFilterModalOpen(true);
    }
  };

  return (
    <>
      {isDateFilterModalOpen && (
        <DateFilterModal
          handleClose={() => setIsDateFilterModalOpen(false)}
          isOpen={isDateFilterModalOpen}
          onSelect={(val) => handleInboxIssueFilters(filterKey, val)}
          title="Created date"
        />
      )}
      <FilterHeader
        title={`${label || "Created date"}${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
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
