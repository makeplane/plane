import React, { useState } from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader, FilterOption } from "components/issue-layouts";

export const FilterTargetDate = observer(() => {
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const store = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const appliedFiltersCount = issueFilterStore.userFilters?.target_date?.length ?? 0;

  return (
    <>
      <FilterHeader
        title={`Target date${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {issueFilterStore?.userFilters?.target_date &&
            issueFilterStore?.userFilters?.target_date.length > 0 &&
            issueFilterStore?.userFilters?.target_date.map((_targetDate) => (
              <FilterOption
                key={_targetDate?.key}
                isChecked={issueFilterStore?.userFilters?.target_date?.includes(_targetDate?.key) ? true : false}
                title={_targetDate.title}
                multiple={false}
              />
            ))}
        </div>
      )}
    </>
  );
});
