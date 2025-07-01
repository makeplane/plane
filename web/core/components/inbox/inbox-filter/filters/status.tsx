import { FC, useState } from "react";
import { observer } from "mobx-react";
// types
import { INBOX_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TInboxIssueStatus } from "@plane/types";
// components
import { FilterHeader, FilterOption } from "@/components/issues";
// constants
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { InboxStatusIcon } from "../../inbox-status-icon";

type Props = {
  searchQuery: string;
};

export const FilterStatus: FC<Props> = observer((props) => {
  const { searchQuery } = props;
  // hooks
  const { currentTab, inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  const { t } = useTranslation();
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
    if (selectedStatus.length >= 1) handleInboxIssueFilters("status", selectedStatus);
  };

  return (
    <>
      <FilterHeader
        title={`Work item Status ${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
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
                icon={<InboxStatusIcon type={status.status} className={`h-3.5 w-3.5`} />}
                title={t(status.i18n_title)}
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
