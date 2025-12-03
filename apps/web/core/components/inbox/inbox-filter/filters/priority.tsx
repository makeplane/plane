import type { FC } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { ISSUE_PRIORITIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PriorityIcon } from "@plane/propel/icons";
import type { TIssuePriorities } from "@plane/types";
// plane constants
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

type Props = {
  searchQuery: string;
};

export const FilterPriority = observer(function FilterPriority(props: Props) {
  const { searchQuery } = props;
  // hooks
  const { t } = useTranslation();
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
        title={`${t("common.priority")}${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
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
            <p className="text-11 italic text-placeholder">{t("common.search.no_matches_found")}</p>
          )}
        </div>
      )}
    </>
  );
});
