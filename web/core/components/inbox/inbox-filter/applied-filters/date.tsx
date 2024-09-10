import { FC } from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";
import { TInboxIssueFilterDateKeys } from "@plane/types";
// helpers
import { Tag } from "@plane/ui";
import { renderFormattedDate } from "@/helpers/date-time.helper";
// constants
import { PAST_DURATION_FILTER_OPTIONS } from "@/helpers/inbox.helper";
// hooks
import { useProjectInbox } from "@/hooks/store";

type InboxIssueAppliedFiltersDate = {
  filterKey: TInboxIssueFilterDateKeys;
  label: string;
};

export const InboxIssueAppliedFiltersDate: FC<InboxIssueAppliedFiltersDate> = observer((props) => {
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
      <div className="text-xs text-custom-text-200">{label}</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <div key={value} className="relative flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
            <div className="text-xs truncate">{optionDetail?.name}</div>
            <div
              className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden cursor-pointer text-custom-text-300 hover:text-custom-text-200 transition-all"
              onClick={() => handleInboxIssueFilters(filterKey, handleFilterValue(optionDetail?.value))}
            >
              <X className={`w-3 h-3`} />
            </div>
          </div>
        );
      })}

      <div
        className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden cursor-pointer text-custom-text-300 hover:text-custom-text-200 transition-all"
        onClick={clearFilter}
      >
        <X className={`w-3 h-3`} />
      </div>
    </Tag>
  );
});
