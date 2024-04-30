import { FC, useState } from "react";
import { observer } from "mobx-react";
// types
import { TInboxIssueFilter, TInboxIssueStatus } from "@plane/types";
// components
import { FilterHeader, FilterOption } from "@/components/issues";
// constants
import { INBOX_STATUS } from "@/constants/inbox";
// hooks
import { useProjectInbox } from "@/hooks/store";

type Props = {
  searchQuery: string;
  inboxFilters: Partial<TInboxIssueFilter>;
  handleFilterUpdate: (
    filterKey: keyof TInboxIssueFilter,
    filterValue: TInboxIssueFilter[keyof TInboxIssueFilter],
    isSelected: boolean,
    interactedValue: string
  ) => void;
};

export const FilterStatus: FC<Props> = observer((props) => {
  const { searchQuery, inboxFilters, handleFilterUpdate } = props;
  // hooks
  const { currentTab } = useProjectInbox();
  // states
  const [previewEnabled, setPreviewEnabled] = useState(true);
  // derived values
  const filterValue = inboxFilters?.status || [];
  const appliedFiltersCount = filterValue?.length ?? 0;
  const filteredOptions = INBOX_STATUS.filter(
    (s) =>
      ((currentTab === "open" && [-2, 0].includes(s.status)) ||
        (currentTab === "closed" && [-1, 1, 2].includes(s.status))) &&
      s.key.includes(searchQuery.toLowerCase())
  );

  const handleFilterValue = (value: TInboxIssueStatus): TInboxIssueStatus[] =>
    filterValue?.includes(value) ? filterValue.filter((v) => v !== value) : [...filterValue, value];

  const handleStatusFilterSelect = (status: TInboxIssueStatus) => {
    const selectedStatus = handleFilterValue(status);
    if (selectedStatus.length >= 1)
      handleFilterUpdate(
        "status",
        selectedStatus,
        filterValue?.includes(status),
        INBOX_STATUS.find((s) => s.status === status)?.title ?? ""
      );
  };

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
                isChecked={filterValue?.includes(status.status) ? true : false}
                onClick={() => handleStatusFilterSelect(status.status)}
                icon={<status.icon className={`h-3.5 w-3.5 ${status?.textColor(false)}`} />}
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
