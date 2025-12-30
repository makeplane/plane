import type { FC } from "react";
import { observer } from "mobx-react";
import { PAST_DURATION_FILTER_OPTIONS } from "@plane/constants";
import { CloseIcon } from "@plane/propel/icons";
import type { TInboxIssueFilterDateKeys } from "@plane/types";
// helpers
import { Tag } from "@plane/ui";
import { renderFormattedDate } from "@plane/utils";
// constants
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

type InboxIssueAppliedFiltersDate = {
  filterKey: TInboxIssueFilterDateKeys;
  label: string;
};

export const InboxIssueAppliedFiltersDate = observer(function InboxIssueAppliedFiltersDate(
  props: InboxIssueAppliedFiltersDate
) {
  const { filterKey, label } = props;
  // hooks
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  // derived values
  const filteredValues = inboxFilters?.[filterKey] || [];
  const currentOptionDetail = (date: string) => {
    const currentDate = PAST_DURATION_FILTER_OPTIONS.find((d) => d.value === date);
    if (currentDate) return currentDate;
    const dateSplit = date.split(";");
    return {
      name: `${dateSplit[1].charAt(0).toUpperCase() + dateSplit[1].slice(1)} ${renderFormattedDate(dateSplit[0])}`,
      value: date,
    };
  };

  const handleFilterValue = (value: string): string[] =>
    filteredValues?.includes(value) ? filteredValues.filter((v) => v !== value) : [...filteredValues, value];

  const clearFilter = () => handleInboxIssueFilters(filterKey, undefined);

  if (filteredValues.length === 0) return <></>;
  return (
    <Tag>
      <div className="text-11 text-secondary">{label}</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <div key={value} className="relative flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
            <div className="text-11 truncate">{optionDetail?.name}</div>
            <div
              className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden cursor-pointer text-tertiary hover:text-secondary transition-all"
              onClick={() => handleInboxIssueFilters(filterKey, handleFilterValue(optionDetail?.value))}
            >
              <CloseIcon className={`w-3 h-3`} />
            </div>
          </div>
        );
      })}

      <div
        className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden cursor-pointer text-tertiary hover:text-secondary transition-all"
        onClick={clearFilter}
      >
        <CloseIcon className={`w-3 h-3`} />
      </div>
    </Tag>
  );
});
