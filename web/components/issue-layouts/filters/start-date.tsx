import React, { useState } from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader, FilterOption } from "components/issue-layouts";

export const FilterStartDate = observer(() => {
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const store = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const appliedFiltersCount = issueFilterStore.userFilters?.start_date?.length ?? 0;

  return (
    <>
      <FilterHeader
        title={`Start date${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {issueFilterStore?.userFilters?.start_date &&
            issueFilterStore?.userFilters?.start_date.length > 0 &&
            issueFilterStore?.userFilters?.start_date.map((_startDate) => (
              <FilterOption
                key={_startDate?.key}
                isChecked={issueFilterStore?.userFilters?.start_date?.includes(_startDate?.key) ? true : false}
                title={_startDate.title}
                multiple={false}
              />
            ))}
        </div>
      )}
    </>
  );
});
