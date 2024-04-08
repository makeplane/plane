import { FC, useState } from "react";
import concat from "lodash/concat";
import pull from "lodash/pull";
import uniq from "lodash/uniq";
import { observer } from "mobx-react";
import { TInboxIssueFilterDateKeys } from "@plane/types";
// components
import { DateFilterModal } from "@/components/core";
import { FilterHeader, FilterOption } from "@/components/issues";
// constants
import { DATE_BEFORE_FILTER_OPTIONS } from "@/constants/filters";
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
  const filteredOptions = DATE_BEFORE_FILTER_OPTIONS.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFilterValue = (value: string): string[] =>
    filterValue?.includes(value) ? pull(filterValue, value) : uniq(concat(filterValue, value));

  const handleCustomFilterValue = (value: string[]): string[] => {
    const finalOptions: string[] = [...filterValue];
    value.forEach((v) => (finalOptions?.includes(v) ? pull(finalOptions, v) : finalOptions.push(v)));
    return uniq(finalOptions);
  };

  const isCustomDateSelected = () => {
    const isValidDateSelected = filterValue?.filter((f) => isDate(f.split(";")[0])) || [];
    return isValidDateSelected.length > 0 ? true : false;
  };

  const handleCustomDate = () => {
    if (isCustomDateSelected()) {
      const updateAppliedFilters = filterValue?.filter((f) => isDate(f.split(";")[0])) || [];
      handleInboxIssueFilters(filterKey, handleCustomFilterValue(updateAppliedFilters));
    } else setIsDateFilterModalOpen(true);
  };
  return (
    <>
      {isDateFilterModalOpen && (
        <DateFilterModal
          handleClose={() => setIsDateFilterModalOpen(false)}
          isOpen={isDateFilterModalOpen}
          onSelect={(val) => handleInboxIssueFilters(filterKey, handleCustomFilterValue(val))}
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
                  multiple
                />
              ))}
              <FilterOption isChecked={isCustomDateSelected()} onClick={handleCustomDate} title="Custom" multiple />
            </>
          ) : (
            <p className="text-xs italic text-custom-text-400">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});
