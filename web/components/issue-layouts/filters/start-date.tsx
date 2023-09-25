import React from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader, FilterOption } from "components/issue-layouts";

export const FilterStartDate = observer(() => {
  const store = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  return (
    <div>
      <FilterHeader
        title={`Start Date (${issueFilterStore?.userFilters?.start_date?.length})`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-1 pt-1">
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
    </div>
  );
});
