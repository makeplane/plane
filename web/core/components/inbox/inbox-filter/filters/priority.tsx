"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { TIssuePriorities } from "@plane/types";
import { PriorityIcon } from "@plane/ui";
// components
import { FilterHeader, FilterOption } from "@/components/issues";
// constants
import { ISSUE_PRIORITIES } from "@/constants/issue";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

type Props = {
  searchQuery: string;
};

export const FilterPriority: FC<Props> = observer((props) => {
  const { searchQuery } = props;
  // hooks
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  // states
  const [previewEnabled, setPreviewEnabled] = useState(true);
  // derived values
  const filterValue = inboxFilters?.priority || [];
  const appliedFiltersCount = filterValue?.length ?? 0;
  const filteredOptions = ISSUE_PRIORITIES.filter((p) => p.key.includes(searchQuery.toLowerCase()));

  const handleFilterValue = (value: TIssuePriorities): TIssuePriorities[] =>
    filterValue?.includes(value) ? filterValue.filter((v) => v !== value) : [...filterValue, value];

  return (
    <>
      <FilterHeader
        title={`Priority${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((priority) => (
              <FilterOption
                key={priority.key}
                isChecked={filterValue?.includes(priority.key) ? true : false}
                onClick={() => handleInboxIssueFilters("priority", handleFilterValue(priority.key))}
                icon={<PriorityIcon priority={priority.key} className="h-3.5 w-3.5" />}
                title={priority.title}
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
